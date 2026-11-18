"""Regression guards for the October 2026 security audit fixes.

* ``GET /admin/search-questions`` used to return the question bank to anyone;
  it now needs an admin.
* ``POST /engagement/welcome`` used to message any email/phone in the body;
  it now needs a signed-in user and only emails that user's own address.
* AI-backed endpoints share a per-user rate limit (``ai_rate_limit``).
"""

from __future__ import annotations

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.api import dependencies
from app.api.dependencies import ai_rate_limit, get_current_user
from app.api.v1 import admin_legacy, engagement
from app.core.config import settings
from app.db.session import get_db
from app.models.domain import RoleEnum, User


def _user(role: RoleEnum = RoleEnum.STUDENT) -> User:
    return User(id=7, google_uid="uid-7", email="learner@example.com", full_name="Asha", role=role)


def _app(*routers) -> FastAPI:
    app = FastAPI()
    for router, prefix in routers:
        app.include_router(router, prefix=prefix)
    app.dependency_overrides[get_db] = lambda: iter([None])
    return app


# --- search-questions -------------------------------------------------------

def test_search_questions_requires_login():
    client = TestClient(_app((admin_legacy.router, "/admin")))
    assert client.get("/admin/search-questions").status_code == 401


def test_search_questions_rejects_students():
    app = _app((admin_legacy.router, "/admin"))
    app.dependency_overrides[get_current_user] = lambda: _user(RoleEnum.STUDENT)
    assert TestClient(app).get("/admin/search-questions").status_code == 403


# --- engagement/welcome -----------------------------------------------------

def test_welcome_requires_login():
    client = TestClient(_app((engagement.router, "/engagement")))
    resp = client.post("/engagement/welcome", json={"name": "X", "email": "victim@example.com"})
    assert resp.status_code == 401


def test_welcome_only_emails_the_signed_in_user(monkeypatch):
    sent = []
    monkeypatch.setattr(engagement, "send_welcome_email", lambda **kw: sent.append(kw["email"]))
    monkeypatch.setattr(engagement, "send_welcome_message", lambda **kw: sent.append(kw["phone"]))

    app = _app((engagement.router, "/engagement"))
    app.dependency_overrides[get_current_user] = lambda: _user()
    resp = TestClient(app).post(
        "/engagement/welcome",
        json={"name": "Asha", "email": "victim@example.com", "phone": "+910000000000"},
    )

    assert resp.status_code == 200
    assert resp.json()["whatsapp_queued"] is False
    assert sent == ["learner@example.com"]


# --- ai_rate_limit ----------------------------------------------------------

@pytest.fixture()
def usage_db():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    from app.core.usage.models import DailyUsage

    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    User.__table__.create(engine)
    DailyUsage.__table__.create(engine)
    session = sessionmaker(bind=engine)()
    session.add(_user())
    session.commit()
    yield session
    session.close()


def _limited_client(usage_db):
    app = FastAPI()

    @app.post("/ai", dependencies=[Depends(ai_rate_limit)])
    def ai():
        return {"ok": True}

    app.dependency_overrides[get_current_user] = lambda: _user()
    app.dependency_overrides[get_db] = lambda: usage_db
    return TestClient(app)


def test_ai_rate_limit_per_minute(usage_db, monkeypatch):
    monkeypatch.setattr(settings, "AI_RATE_LIMIT_PER_MINUTE", 2)
    monkeypatch.setattr(settings, "AI_RATE_LIMIT_PER_DAY", 50)
    dependencies.reset_ai_rate_limits()
    client = _limited_client(usage_db)
    assert [client.post("/ai").status_code for _ in range(3)] == [200, 200, 429]


def test_ai_daily_limit_survives_a_fresh_server_instance(usage_db, monkeypatch):
    """The daily cap is kept in the database, so wiping process memory (which is
    what a new serverless instance amounts to) must not hand out a fresh allowance."""
    monkeypatch.setattr(settings, "AI_RATE_LIMIT_PER_MINUTE", 100)
    monkeypatch.setattr(settings, "AI_RATE_LIMIT_PER_DAY", 3)
    dependencies.reset_ai_rate_limits()
    client = _limited_client(usage_db)

    assert [client.post("/ai").status_code for _ in range(3)] == [200, 200, 200]
    dependencies.reset_ai_rate_limits()
    refused = client.post("/ai")

    assert refused.status_code == 429
    assert "Daily AI limit" in refused.json()["detail"]
    assert int(refused.headers["Retry-After"]) >= 1


def test_ai_daily_limit_starts_again_the_next_day(usage_db, monkeypatch):
    from datetime import timedelta

    from app.core.usage.models import DailyUsage

    monkeypatch.setattr(settings, "AI_RATE_LIMIT_PER_MINUTE", 100)
    monkeypatch.setattr(settings, "AI_RATE_LIMIT_PER_DAY", 1)
    dependencies.reset_ai_rate_limits()
    client = _limited_client(usage_db)
    assert [client.post("/ai").status_code for _ in range(2)] == [200, 429]

    # Move today's count to yesterday: the learner is allowed again.
    row = usage_db.query(DailyUsage).one()
    row.usage_date = row.usage_date - timedelta(days=1)
    usage_db.commit()
    assert client.post("/ai").status_code == 200


def test_web_app_ai_routes_draw_on_the_same_daily_allowance(usage_db, monkeypatch):
    from app.api.v1 import auth

    monkeypatch.setattr(settings, "AI_RATE_LIMIT_PER_MINUTE", 100)
    monkeypatch.setattr(settings, "AI_RATE_LIMIT_PER_DAY", 2)
    dependencies.reset_ai_rate_limits()
    app = FastAPI()
    app.include_router(auth.router, prefix="/auth")
    app.dependency_overrides[get_db] = lambda: usage_db
    client = TestClient(app)

    assert client.post("/auth/ai-usage").status_code == 401

    app.dependency_overrides[get_current_user] = lambda: _user()
    assert [client.post("/auth/ai-usage").status_code for _ in range(3)] == [200, 200, 429]
