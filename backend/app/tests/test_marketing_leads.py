"""Marketing leads: public capture is stored, de-duplicated and limited; the
list is admin-only."""

from __future__ import annotations

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user
from app.api.v1 import leads
from app.core.leads.models import MarketingLead
from app.db.session import Base, get_db
from app.models.domain import RoleEnum, User


@pytest.fixture()
def env():
    engine = create_engine(
        "sqlite:///:memory:", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    MarketingLead.__table__.create(engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    def _db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app = FastAPI()
    app.include_router(leads.router, prefix="/leads")
    app.dependency_overrides[get_db] = _db
    leads.reset_lead_rate_limits()
    yield app, TestClient(app), SessionLocal
    leads.reset_lead_rate_limits()


LEAD = {
    "name": "Asha",
    "email": "Asha@Example.com",
    "phone": "+91 98765 43210",
    "source": "diagnostic",
    "answers": {"year": "2027", "stage": "beginner", "subjects": ["Geography", "Polity"]},
}


def test_lead_is_stored(env):
    _, client, SessionLocal = env
    resp = client.post("/leads", json=LEAD)
    assert resp.status_code == 201
    with SessionLocal() as db:
        row = db.query(MarketingLead).one()
        assert row.email == "asha@example.com"
        assert row.answers["subjects"] == ["Geography", "Polity"]


def test_repeat_submission_updates_instead_of_duplicating(env):
    _, client, SessionLocal = env
    client.post("/leads", json=LEAD)
    client.post("/leads", json={**LEAD, "answers": {"year": "2028"}})
    with SessionLocal() as db:
        rows = db.query(MarketingLead).all()
        assert len(rows) == 1
        assert rows[0].answers == {"year": "2028"}


def test_invalid_email_rejected(env):
    _, client, _ = env
    assert client.post("/leads", json={**LEAD, "email": "not-an-email"}).status_code == 422


def test_public_capture_is_rate_limited_per_ip(env):
    _, client, _ = env
    codes = [
        client.post("/leads", json={**LEAD, "email": f"a{i}@example.com"}).status_code
        for i in range(leads.LEAD_LIMIT_PER_HOUR + 1)
    ]
    assert codes[-1] == 429 and set(codes[:-1]) == {201}


def test_list_requires_admin(env):
    app, client, _ = env
    assert client.get("/leads").status_code == 401

    app.dependency_overrides[get_current_user] = lambda: User(id=1, email="s@example.com", role=RoleEnum.STUDENT)
    assert client.get("/leads").status_code == 403

    client.post("/leads", json=LEAD)
    app.dependency_overrides[get_current_user] = lambda: User(id=2, email="a@example.com", role=RoleEnum.ADMIN)
    body = client.get("/leads").json()
    assert body["total"] == 1 and body["items"][0]["email"] == "asha@example.com"
