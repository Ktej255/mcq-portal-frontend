"""GS LMS cohort access enforcement and operator grant management.

Covers the private-beta access contract:

* Access is enforced only when ``GS_LMS_ENFORCE_ACCESS`` is enabled.
* ADMIN / EDUCATOR are staff bypasses; students need an active grant.
* Grants are time-windowed and status-aware (ACTIVE / SUSPENDED / REVOKED).
* Every GS LMS route inherits the guard at the aggregate router.
* Operators can grant and revoke access without deleting audit history.

The tests deliberately use a minimal fake probe route for the dependency
integration check so they remain fast and do not depend on seeded content.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Iterator

import pytest
from fastapi import APIRouter, Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user
from app.api.v1 import gs_lms as gs_lms_api
from app.api.v1.gs_lms import access_admin
from app.api.v1.gs_lms.access import (
    require_gs_lms_access,
    user_has_gs_lms_access,
)
from app.core.config import settings
from app.core.gs_lms.readiness_models import GsLmsBetaAccess
from app.db.session import Base, get_db
from app.models.domain import RoleEnum, User

NOW = datetime.now(timezone.utc)


def _make_user(
    user_id: int,
    *,
    role: RoleEnum = RoleEnum.STUDENT,
    email: str | None = None,
) -> User:
    return User(
        id=user_id,
        google_uid=f"uid-{user_id}",
        email=email or f"student{user_id}@test.local",
        full_name=f"Student {user_id}",
        role=role,
    )


@pytest.fixture()
def db() -> Iterator[Session]:
    engine = create_engine(
        "sqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = SessionLocal()
    try:
        session.add_all([_make_user(1), _make_user(2), _make_user(3, role=RoleEnum.ADMIN)])
        session.commit()
        yield session
    finally:
        session.close()
        engine.dispose()


def _student(db: Session, user_id: int = 1) -> User:
    return db.query(User).filter(User.id == user_id).one()


def _grant(
    db: Session,
    user_id: int,
    *,
    starts_at: datetime | None = None,
    ends_at: datetime | None = None,
    status: str = "ACTIVE",
) -> GsLmsBetaAccess:
    grant = GsLmsBetaAccess(
        user_id=user_id,
        access_type="COMP",
        starts_at=starts_at or (NOW - timedelta(days=1)),
        ends_at=ends_at,
        status=status,
        reason="test",
        created_by="test",
        updated_by="test",
    )
    db.add(grant)
    db.commit()
    return grant


# ---------------------------------------------------------------------------
# Dependency behaviour
# ---------------------------------------------------------------------------


class TestAccessDependency:
    def test_disabled_enforcement_allows_authenticated_student(self, db, monkeypatch):
        monkeypatch.setattr(settings, "GS_LMS_ENFORCE_ACCESS", False)
        student = _student(db)
        assert require_gs_lms_access(current_user=student, db=db) is student

    def test_student_without_grant_is_denied(self, db, monkeypatch):
        monkeypatch.setattr(settings, "GS_LMS_ENFORCE_ACCESS", True)
        student = _student(db)
        with pytest.raises(Exception) as excinfo:
            require_gs_lms_access(current_user=student, db=db)
        assert getattr(excinfo.value, "status_code", None) == 403
        assert "beta access" in str(getattr(excinfo.value, "detail", "")).lower()

    def test_active_grant_allows_access(self, db, monkeypatch):
        monkeypatch.setattr(settings, "GS_LMS_ENFORCE_ACCESS", True)
        student = _student(db)
        _grant(db, student.id)
        assert require_gs_lms_access(current_user=student, db=db) is student

    def test_future_grant_is_denied(self, db, monkeypatch):
        monkeypatch.setattr(settings, "GS_LMS_ENFORCE_ACCESS", True)
        student = _student(db)
        _grant(db, student.id, starts_at=NOW + timedelta(days=1))
        assert user_has_gs_lms_access(db, student) is False

    def test_expired_grant_is_denied(self, db, monkeypatch):
        monkeypatch.setattr(settings, "GS_LMS_ENFORCE_ACCESS", True)
        student = _student(db)
        _grant(db, student.id, ends_at=NOW - timedelta(seconds=1))
        assert user_has_gs_lms_access(db, student) is False

    def test_suspended_grant_is_denied(self, db):
        student = _student(db)
        _grant(db, student.id, status="SUSPENDED")
        assert user_has_gs_lms_access(db, student) is False

    def test_revoked_grant_is_denied(self, db):
        student = _student(db)
        _grant(db, student.id, status="REVOKED")
        assert user_has_gs_lms_access(db, student) is False

    @pytest.mark.parametrize("role", [RoleEnum.ADMIN, RoleEnum.EDUCATOR])
    def test_staff_roles_bypass_grant_requirement(self, db, role):
        staff = _make_user(99, role=role)
        assert user_has_gs_lms_access(db, staff) is True

    def test_open_ended_grant_remains_active(self, db):
        student = _student(db)
        _grant(db, student.id, ends_at=None)
        assert user_has_gs_lms_access(db, student) is True


# ---------------------------------------------------------------------------
# Aggregate router wiring and HTTP behaviour
# ---------------------------------------------------------------------------


def test_aggregate_gs_lms_router_uses_cohort_guard():
    guard_targets = {
        getattr(dependency, "dependency", None)
        for dependency in gs_lms_api.router.dependencies
    }
    assert require_gs_lms_access in guard_targets


def test_probe_route_returns_403_without_grant(db, monkeypatch):
    monkeypatch.setattr(settings, "GS_LMS_ENFORCE_ACCESS", True)

    probe = APIRouter(dependencies=[Depends(require_gs_lms_access)])

    @probe.get("/probe")
    def _probe() -> dict[str, bool]:
        return {"ok": True}

    app = FastAPI()
    app.include_router(probe, prefix="/api/v1/gs-lms")
    app.dependency_overrides[get_current_user] = lambda: _student(db)
    app.dependency_overrides[get_db] = lambda: db

    response = TestClient(app).get("/api/v1/gs-lms/probe")
    assert response.status_code == 403
    assert "beta access" in response.json()["detail"].lower()


def test_probe_route_allows_active_grant(db, monkeypatch):
    monkeypatch.setattr(settings, "GS_LMS_ENFORCE_ACCESS", True)
    student = _student(db)
    _grant(db, student.id)

    probe = APIRouter(dependencies=[Depends(require_gs_lms_access)])

    @probe.get("/probe")
    def _probe() -> dict[str, bool]:
        return {"ok": True}

    app = FastAPI()
    app.include_router(probe, prefix="/api/v1/gs-lms")
    app.dependency_overrides[get_current_user] = lambda: student
    app.dependency_overrides[get_db] = lambda: db

    response = TestClient(app).get("/api/v1/gs-lms/probe")
    assert response.status_code == 200
    assert response.json() == {"ok": True}


# ---------------------------------------------------------------------------
# Operator grant / revoke endpoints
# ---------------------------------------------------------------------------


@pytest.fixture()
def admin_client(db: Session) -> Iterator[TestClient]:
    app = FastAPI()
    app.include_router(
        access_admin.router,
        prefix="/api/v1/admin/gs-lms/beta-access",
    )
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: _student(db, 3)
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_operator_can_grant_access(admin_client, db):
    response = admin_client.post(
        "/api/v1/admin/gs-lms/beta-access",
        json={"user_email": "student1@test.local", "reason": "paid beta cohort"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["user_id"] == 1
    assert data["status"] == "ACTIVE"
    assert data["reason"] == "paid beta cohort"

    student = _student(db, 1)
    assert user_has_gs_lms_access(db, student) is True


def test_operator_upsert_updates_existing_grant(admin_client, db):
    first = admin_client.post(
        "/api/v1/admin/gs-lms/beta-access",
        json={"user_email": "student1@test.local"},
    )
    assert first.status_code == 200

    second = admin_client.post(
        "/api/v1/admin/gs-lms/beta-access",
        json={
            "user_email": "student1@test.local",
            "status": "SUSPENDED",
            "reason": "payment reversed",
        },
    )
    assert second.status_code == 200
    assert second.json()["data"]["status"] == "SUSPENDED"
    assert second.json()["data"]["reason"] == "payment reversed"

    grants = db.query(GsLmsBetaAccess).all()
    assert len(grants) == 1


def test_operator_cannot_grant_unknown_email(admin_client):
    response = admin_client.post(
        "/api/v1/admin/gs-lms/beta-access",
        json={"user_email": "missing@test.local"},
    )
    assert response.status_code == 404


def test_operator_can_revoke_access(admin_client, db):
    granted = admin_client.post(
        "/api/v1/admin/gs-lms/beta-access",
        json={"user_email": "student1@test.local"},
    )
    assert granted.status_code == 200

    revoked = admin_client.delete("/api/v1/admin/gs-lms/beta-access/1")
    assert revoked.status_code == 200
    assert revoked.json()["data"]["status"] == "REVOKED"

    student = _student(db, 1)
    assert user_has_gs_lms_access(db, student) is False

    grants = db.query(GsLmsBetaAccess).all()
    assert len(grants) == 1  # audit record remains


def test_operator_lists_grants(admin_client):
    admin_client.post(
        "/api/v1/admin/gs-lms/beta-access",
        json={"user_email": "student1@test.local"},
    )
    listing = admin_client.get("/api/v1/admin/gs-lms/beta-access")
    assert listing.status_code == 200
    rows = listing.json()["data"]
    assert len(rows) == 1
    assert rows[0]["email"] == "student1@test.local"


def test_student_cannot_manage_grants(db):
    app = FastAPI()
    app.include_router(
        access_admin.router,
        prefix="/api/v1/admin/gs-lms/beta-access",
    )
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: _student(db, 1)

    response = TestClient(app).get("/api/v1/admin/gs-lms/beta-access")
    assert response.status_code == 403


def test_grant_rejects_inverted_window(admin_client):
    response = admin_client.post(
        "/api/v1/admin/gs-lms/beta-access",
        json={
            "user_email": "student1@test.local",
            "starts_at": NOW.isoformat(),
            "ends_at": (NOW - timedelta(days=1)).isoformat(),
        },
    )
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Production startup guard
# ---------------------------------------------------------------------------


def test_production_startup_refuses_disabled_enforcement(monkeypatch):
    """Production must fail fast rather than serve an unguarded paid LMS."""
    import asyncio

    from app.main import app, lifespan

    monkeypatch.setattr(settings, "APP_ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "GS_LMS_ENFORCE_ACCESS", False)

    async def enter_lifespan() -> None:
        async with lifespan(app):
            pass

    with pytest.raises(RuntimeError, match="GS_LMS_ENFORCE_ACCESS"):
        asyncio.run(enter_lifespan())


def test_non_production_startup_allows_disabled_enforcement(monkeypatch):
    """Local and test datasets keep working without a cohort grant."""
    import asyncio

    from app.main import app, lifespan

    monkeypatch.setattr(settings, "APP_ENVIRONMENT", "test")
    monkeypatch.setattr(settings, "GS_LMS_ENFORCE_ACCESS", False)

    async def enter_lifespan() -> None:
        async with lifespan(app):
            pass

    asyncio.run(enter_lifespan())
