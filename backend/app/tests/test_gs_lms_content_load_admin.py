"""Loading the Geography content from the admin console.

An operator must be able to fill a new database without a developer, run the
load again without duplicating or losing anything, and a student must not be
able to trigger it.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user
from app.core.gs.models import GsReviewStatusEnum
from app.core.gs_lms import content_loader
from app.core.gs_lms.models import GsLmsContentSection, GsLmsMcqQuestion, GsLmsSyllabusNode
from app.db.session import Base, get_db
from app.main import app
from app.models.domain import RoleEnum, User

URL = "/api/v1/admin/gs-lms/content-load"


@pytest.fixture()
def session_factory():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    yield sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.drop_all(engine)


@pytest.fixture()
def client(session_factory):
    db = session_factory()
    db.add_all([
        User(google_uid="admin", email="admin@example.com", role=RoleEnum.ADMIN),
        User(google_uid="student", email="student@example.com", role=RoleEnum.STUDENT),
    ])
    db.commit()
    db.close()
    current = {"uid": "admin"}

    def _db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    def _user():
        db = session_factory()
        try:
            user = db.query(User).filter(User.google_uid == current["uid"]).one()
            db.expunge(user)
            return user
        finally:
            db.close()

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user] = _user
    test_client = TestClient(app)
    test_client.act_as = lambda uid: current.update(uid=uid)
    try:
        yield test_client
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)


def _row_counts(session_factory) -> tuple[int, int, int]:
    db = session_factory()
    try:
        return (
            db.query(GsLmsSyllabusNode).count(),
            db.query(GsLmsContentSection).count(),
            db.query(GsLmsMcqQuestion).count(),
        )
    finally:
        db.close()


def test_an_empty_database_reports_nothing_loaded(client):
    status = client.get(URL).json()["data"]

    assert status["loaded"] is False
    assert status["sections"] == 0


def test_loading_fills_an_empty_database(client):
    response = client.post(URL)

    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert data["result"]["nodes_created"] > 0
    assert data["result"]["mcqs_created"] > 0
    status = data["status"]
    assert status["loaded"] is True
    assert status["topics_visible"] > 0
    assert status["sections"] > 0
    assert status["mcqs"] > 0
    assert status["pyqs"] > 0
    assert client.get(URL).json()["data"] == status


def test_loading_again_changes_no_row_counts_and_keeps_ids(client, session_factory):
    client.post(URL)
    before = _row_counts(session_factory)
    db = session_factory()
    ids_before = sorted(row.id for row in db.query(GsLmsSyllabusNode.id))
    db.close()

    second = client.post(URL).json()["data"]["result"]

    assert _row_counts(session_factory) == before
    assert second["nodes_created"] == 0
    assert second["sections_created"] == 0
    assert second["mcqs_created"] == 0
    db = session_factory()
    assert sorted(row.id for row in db.query(GsLmsSyllabusNode.id)) == ids_before
    db.close()


def test_topics_without_content_are_hidden_not_shown_empty(client, session_factory):
    client.post(URL)

    db = session_factory()
    try:
        with_sections = {row[0] for row in db.query(GsLmsContentSection.syllabus_node_id).distinct()}
        visible_leaves = db.query(GsLmsSyllabusNode).filter(
            GsLmsSyllabusNode.node_type == "LEAF_TOPIC",
            GsLmsSyllabusNode.review_status == GsReviewStatusEnum.REVIEWED,
        ).all()
        assert visible_leaves
        assert all(node.id in with_sections for node in visible_leaves)
    finally:
        db.close()


def test_a_student_cannot_load_or_read_status(client, session_factory):
    client.act_as("student")

    assert client.post(URL).status_code == 403
    assert client.get(URL).status_code == 403
    assert _row_counts(session_factory) == (0, 0, 0)


def test_a_failed_load_changes_nothing(client, session_factory, monkeypatch):
    def broken(session):
        content_loader.ensure_gs_subjects(session)
        raise RuntimeError("password=never-show-this")

    monkeypatch.setattr("app.api.v1.gs_lms.content_load_admin.load_geography_content", broken)

    response = client.post(URL)

    assert response.status_code == 500
    assert "never-show-this" not in response.text
    assert response.json()["detail"]["code"] == "CONTENT_LOAD_FAILED"
    assert client.get(URL).json()["data"]["loaded"] is False
