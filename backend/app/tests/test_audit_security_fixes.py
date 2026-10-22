"""Regression guards for the October 2026 security audit fixes.

* ``GET /admin/search-questions`` used to return the question bank to anyone;
  it now needs an admin.
* ``POST /engagement/welcome`` used to message any email/phone in the body;
  it now needs a signed-in user and only emails that user's own address.
* AI-backed endpoints share a per-user rate limit (``ai_rate_limit``).
"""

from __future__ import annotations

from types import SimpleNamespace

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
def limited_client(monkeypatch):
    monkeypatch.setattr(settings, "AI_RATE_LIMIT_PER_MINUTE", 2)
    monkeypatch.setattr(settings, "AI_RATE_LIMIT_PER_DAY", 3)
    app = FastAPI()

    @app.post("/ai", dependencies=[Depends(ai_rate_limit)])
    def ai():
        return {"ok": True}

    app.dependency_overrides[get_current_user] = lambda: _user()
    return TestClient(app)


def test_ai_rate_limit_per_minute(limited_client):
    assert [limited_client.post("/ai").status_code for _ in range(3)] == [200, 200, 429]


def test_ai_rate_limit_per_day(limited_client, monkeypatch):
    # Calls 100 s apart: never 2 in the same minute, but all inside one day.
    clock = iter([1000.0, 1100.0, 1200.0, 1300.0])
    monkeypatch.setattr(dependencies, "time", SimpleNamespace(time=lambda: next(clock)))
    assert [limited_client.post("/ai").status_code for _ in range(4)] == [200, 200, 200, 429]
