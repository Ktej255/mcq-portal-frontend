"""Authorization regression for the legacy admin question search route."""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.api.v1 import admin_legacy
from app.db.session import get_db
from app.models.domain import RoleEnum, User


class _EmptyQuery:
    def filter(self, *_args):
        return self

    def limit(self, _limit):
        return self

    def all(self):
        return []


class _FakeDb:
    def query(self, *_args):
        return _EmptyQuery()


@pytest.fixture()
def admin_search_app():
    app = FastAPI()
    app.include_router(admin_legacy.router, prefix="/admin")
    app.dependency_overrides[get_db] = lambda: _FakeDb()
    yield app
    app.dependency_overrides.clear()


def test_admin_search_rejects_unauthenticated_request(admin_search_app):
    response = TestClient(admin_search_app).get("/admin/search-questions")
    assert response.status_code == 401

def test_admin_search_rejects_authenticated_student(admin_search_app):
    admin_search_app.dependency_overrides[get_current_user] = lambda: User(
        id=2,
        google_uid="student-sub",
        email="student@example.com",
        role=RoleEnum.STUDENT,
    )

    response = TestClient(admin_search_app).get("/admin/search-questions")
    assert response.status_code == 403


def test_admin_search_allows_admin(admin_search_app):
    admin_search_app.dependency_overrides[get_current_user] = lambda: User(
        id=1,
        google_uid="admin-sub",
        email="admin@example.com",
        role=RoleEnum.ADMIN,
    )

    response = TestClient(admin_search_app).get("/admin/search-questions")
    assert response.status_code == 200
    assert response.json() == {"data": [], "total": 0}
