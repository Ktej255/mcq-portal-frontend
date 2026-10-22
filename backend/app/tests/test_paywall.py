"""Paywall: free trial, plan features and the daily MCQ limit.

Everything is a no-op while PAYWALL_ENABLED is off (the default)."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.main as main_module
from app.api.dependencies import get_current_user, mcq_quota, require_access
from app.api.v1 import entitlements
from app.core.config import settings
from app.core.payments.models import PaymentOrder, Subscription
from app.db.session import Base, get_db
from app.models.domain import RoleEnum, User

NOW = datetime.now(timezone.utc)


@pytest.fixture()
def db_factory():
    engine = create_engine(
        "sqlite:///:memory:", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True, expire_on_commit=False)


@pytest.fixture()
def paywall_on(monkeypatch):
    monkeypatch.setattr(settings, "PAYWALL_ENABLED", True)
    monkeypatch.setattr(settings, "TRIAL_DAYS", 7)
    monkeypatch.setattr(settings, "PAYWALL_LAUNCH_DATE", None)


def make_user(SessionLocal, *, days_old: int = 0, role=RoleEnum.STUDENT, plan: str | None = None, plan_ends_in_days: int = 30):
    with SessionLocal() as db:
        n = db.query(User).count() + 1
        user = User(google_uid=f"uid-{n}", email=f"u{n}@example.com", role=role, created_at=NOW - timedelta(days=days_old))
        db.add(user)
        if plan:
            db.add(PaymentOrder(
                order_id=f"order-{n}", user_id=user.google_uid, plan_tier=plan,
                billing_cycle="monthly", amount=399, status="paid",
            ))
            db.add(Subscription(
                user_id=user.google_uid, plan_tier=plan, billing_cycle="monthly", order_id=f"order-{n}",
                start_date=NOW - timedelta(days=1), end_date=NOW + timedelta(days=plan_ends_in_days), status="active",
            ))
        db.commit()
        db.refresh(user)
        return user


def client_for(SessionLocal, user: User) -> TestClient:
    app = FastAPI()

    @app.get("/learn", dependencies=[Depends(require_access())])
    def learn():
        return {"ok": True}

    @app.get("/optional", dependencies=[Depends(require_access("optional_subjects"))])
    def optional():
        return {"ok": True}

    @app.post("/answer", dependencies=[Depends(mcq_quota(1))])
    def answer():
        return {"ok": True}

    @app.post("/lab", dependencies=[Depends(mcq_quota(15))])
    def lab():
        return {"ok": True}

    app.include_router(entitlements.router, prefix="/entitlements")

    def _db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user] = lambda: user
    return TestClient(app)


def test_paywall_off_changes_nothing(db_factory):
    old = make_user(db_factory, days_old=365)
    client = client_for(db_factory, old)
    assert client.get("/learn").status_code == 200
    assert client.get("/optional").status_code == 200
    assert all(client.post("/answer").status_code == 200 for _ in range(60))
    assert client.get("/entitlements/me").json()["data"]["source"] == "open"


def test_new_student_gets_full_trial(db_factory, paywall_on):
    client = client_for(db_factory, make_user(db_factory))
    assert client.get("/learn").status_code == 200
    assert client.get("/optional").status_code == 200
    me = client.get("/entitlements/me").json()["data"]
    assert me["source"] == "trial" and me["trial_days_left"] == 7


def test_trial_expires(db_factory, paywall_on):
    client = client_for(db_factory, make_user(db_factory, days_old=8))
    resp = client.get("/learn")
    assert resp.status_code == 402
    assert resp.json()["detail"]["reason"] == "trial_expired"
    assert resp.json()["detail"]["upgrade_path"] == "/upsc/pricing"
    assert client.get("/entitlements/me").json()["data"]["source"] == "expired"


def test_launch_date_gives_existing_students_a_fresh_trial(db_factory, paywall_on, monkeypatch):
    monkeypatch.setattr(settings, "PAYWALL_LAUNCH_DATE", date.today())
    client = client_for(db_factory, make_user(db_factory, days_old=200))
    assert client.get("/learn").status_code == 200
    assert client.get("/entitlements/me").json()["data"]["source"] == "trial"


def test_foundation_plan_has_no_optional_and_50_mcqs(db_factory, paywall_on):
    client = client_for(db_factory, make_user(db_factory, days_old=30, plan="foundation"))
    assert client.get("/learn").status_code == 200

    resp = client.get("/optional")
    assert resp.status_code == 402
    assert resp.json()["detail"]["reason"] == "feature"
    assert resp.json()["detail"]["required_tier"] == "plus"

    assert all(client.post("/answer").status_code == 200 for _ in range(50))
    over = client.post("/answer")
    assert over.status_code == 402
    assert over.json()["detail"]["reason"] == "mcq_limit"
    assert over.json()["detail"]["required_tier"] == "plus"
    assert client.get("/entitlements/me").json()["data"]["mcqs_used_today"] == 50


def test_batch_submit_counts_every_answer(db_factory, paywall_on):
    client = client_for(db_factory, make_user(db_factory, days_old=30, plan="foundation"))
    assert [client.post("/lab").status_code for _ in range(4)] == [200, 200, 200, 402]  # 45 used, 60 > 50


def test_pro_plan_is_unlimited(db_factory, paywall_on):
    client = client_for(db_factory, make_user(db_factory, days_old=30, plan="pro"))
    assert client.get("/optional").status_code == 200
    assert all(client.post("/lab").status_code == 200 for _ in range(20))


def test_ended_subscription_does_not_count(db_factory, paywall_on):
    client = client_for(db_factory, make_user(db_factory, days_old=30, plan="pro", plan_ends_in_days=-1))
    assert client.get("/learn").status_code == 402


def test_admin_is_never_blocked(db_factory, paywall_on):
    client = client_for(db_factory, make_user(db_factory, days_old=400, role=RoleEnum.ADMIN))
    assert client.get("/optional").status_code == 200
    assert all(client.post("/lab").status_code == 200 for _ in range(10))


def test_main_app_gates_optional_router(db_factory, paywall_on):
    """The real /api/v1/optional router is wired to the Plus feature check."""
    expired = make_user(db_factory, days_old=30, plan="foundation")

    def _db():
        db = db_factory()
        try:
            yield db
        finally:
            db.close()

    app = main_module.app
    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user] = lambda: expired
    try:
        resp = TestClient(app).get("/api/v1/optional/health")
        assert resp.status_code == 402
        assert resp.json()["detail"]["required_tier"] == "plus"
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)
