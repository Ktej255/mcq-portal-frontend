"""Focused subject-scope and persistence tests for GS LMS video routes."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.models import GsLmsNodeTypeEnum, GsLmsSyllabusNode
from app.core.gs_lms.student_models import GsLmsVideoWatch
from app.db.session import Base, get_db
from app.main import app
from app.models import domain as domain_models  # noqa: F401
from app.models.domain import RoleEnum, User

# Ensure all GS LMS models are registered on Base.metadata.
from app.core.gs_lms import models as gs_lms_models  # noqa: F401,E402
from app.core.gs_lms import student_models as gs_lms_student_models  # noqa: F401,E402
from app.core.gs import models as gs_models  # noqa: F401,E402

STUDENT_ID = 1


@pytest.fixture()
def session_factory():
    engine = create_engine(
        "sqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    relevant_tables = [
        table
        for name, table in Base.metadata.tables.items()
        if name in {
            "users",
            "gs_subjects",
            "gs_lms_syllabus_nodes",
            "gs_lms_video_watches",
        }
    ]
    Base.metadata.create_all(engine, tables=relevant_tables)
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    db = factory()
    try:
        db.add(User(
            id=STUDENT_ID,
            google_uid="video-test-student",
            email="video-student@test.local",
            full_name="Video Test Student",
            role=RoleEnum.STUDENT,
        ))
        db.add_all([
            GsSubject(id=1, slug="geography", name="GS Geography", display_order=1),
            GsSubject(id=2, slug="history", name="GS History", display_order=2),
        ])
        db.add_all([
            GsLmsSyllabusNode(
                id=100,
                subject_id=1,
                title="Geography Topic",
                node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
                weight=1.0,
                display_order=1,
                review_status=GsReviewStatusEnum.REVIEWED,
            ),
            GsLmsSyllabusNode(
                id=101,
                subject_id=2,
                title="History Topic",
                node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
                weight=1.0,
                display_order=1,
                review_status=GsReviewStatusEnum.REVIEWED,
            ),
        ])
        db.commit()
    finally:
        db.close()

    yield factory
    engine.dispose()


@pytest.fixture()
def client(session_factory):
    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    class FakeUser:
        id = STUDENT_ID
        email = "video-student@test.local"
        role = RoleEnum.STUDENT

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: FakeUser()
    yield TestClient(app)
    app.dependency_overrides.pop(get_db, None)
    app.dependency_overrides.pop(get_current_user, None)


def test_status_returns_not_watched_for_owned_node(client):
    response = client.get("/api/v1/gs-lms/geography/topics/100/video/status")
    assert response.status_code == 200
    assert response.json()["data"] == {
        "watched": False,
        "watched_at": None,
        "duration_seconds": None,
    }


def test_status_rejects_node_owned_by_another_subject(client):
    response = client.get("/api/v1/gs-lms/geography/topics/101/video/status")
    assert response.status_code == 404


def test_mark_watched_rejects_node_owned_by_another_subject(client, session_factory):
    response = client.post(
        "/api/v1/gs-lms/geography/topics/101/video/watched",
        json={"duration_seconds": 42.0},
    )
    assert response.status_code == 404

    db = session_factory()
    try:
        assert db.query(GsLmsVideoWatch).count() == 0
    finally:
        db.close()


def test_unknown_subject_slug_is_rejected(client):
    response = client.get("/api/v1/unknown/topics/100/video/status")
    assert response.status_code == 404


def test_mark_and_read_watched_status_for_owned_node(client):
    mark_response = client.post(
        "/api/v1/gs-lms/geography/topics/100/video/watched",
        json={"duration_seconds": 42.0},
    )
    assert mark_response.status_code == 200
    assert mark_response.json()["data"]["watched"] is True

    status_response = client.get(
        "/api/v1/gs-lms/geography/topics/100/video/status"
    )
    assert status_response.status_code == 200
    assert status_response.json()["data"]["watched"] is True
    assert status_response.json()["data"]["duration_seconds"] == 42.0
