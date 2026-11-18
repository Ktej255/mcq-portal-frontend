"""Subject-scope regressions for GS LMS revisit endpoints."""

from __future__ import annotations

from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user
from app.db.session import Base, get_db
from app.main import app
from app.models.domain import RoleEnum, User
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.models import GsLmsNodeTypeEnum, GsLmsSyllabusNode
from app.core.gs_lms.student_models import GsLmsRevisitSchedule


@pytest.fixture()
def seeded_engine():
    engine = create_engine(
        "sqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    table_names = {
        "users",
        "gs_subjects",
        "gs_lms_syllabus_nodes",
        "gs_lms_revisit_schedule",
    }
    tables = [table for name, table in Base.metadata.tables.items() if name in table_names]
    Base.metadata.create_all(engine, tables=tables)
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    session = TestSession()
    try:
        session.add(User(
            id=1,
            google_uid="revisit-student-uid",
            email="revisit@upsc.local",
            full_name="Revisit Student",
            role=RoleEnum.STUDENT,
        ))
        session.add_all([
            GsSubject(id=1, slug="geography", name="GS Geography", display_order=1),
            GsSubject(id=2, slug="polity", name="GS Polity", display_order=2),
        ])
        session.add_all([
            GsLmsSyllabusNode(
                id=30, subject_id=1, title="Continental Drift",
                node_type=GsLmsNodeTypeEnum.LEAF_TOPIC, weight=1.0,
                display_order=1, review_status=GsReviewStatusEnum.REVIEWED,
            ),
            GsLmsSyllabusNode(
                id=50, subject_id=2, title="Constitutional Framework",
                node_type=GsLmsNodeTypeEnum.LEAF_TOPIC, weight=1.0,
                display_order=1, review_status=GsReviewStatusEnum.REVIEWED,
            ),
        ])
        session.flush()
        session.add_all([
            GsLmsRevisitSchedule(
                id=1, student_id=1, syllabus_node_id=30,
                due_date=date.today() - timedelta(days=1),
                revisit_type="day_3", completed=False,
            ),
            GsLmsRevisitSchedule(
                id=2, student_id=1, syllabus_node_id=50,
                due_date=date.today() - timedelta(days=1),
                revisit_type="day_3", completed=False,
            ),
        ])
        session.commit()
    finally:
        session.close()

    yield engine, TestSession
    engine.dispose()


@pytest.fixture()
def client(seeded_engine):
    _, TestSession = seeded_engine

    def override_get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    class FakeUser:
        id = 1
        email = "revisit@upsc.local"
        google_uid = "revisit-student-uid"

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: FakeUser()
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)


def test_due_revisits_are_scoped_to_subject(client):
    response = client.get("/api/v1/gs-lms/geography/revisits/due")

    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert data["total"] == 1
    assert data["revisits"][0]["id"] == 1
    assert data["revisits"][0]["syllabus_node_id"] == 30


def test_complete_revisit_rejects_other_subject(client, seeded_engine):
    response = client.post("/api/v1/gs-lms/geography/revisits/2/complete")
    assert response.status_code == 404

    _, TestSession = seeded_engine
    db = TestSession()
    try:
        schedule = db.query(GsLmsRevisitSchedule).filter_by(id=2).one()
        assert schedule.completed is False
    finally:
        db.close()


def test_unknown_subject_is_rejected(client):
    response = client.get("/api/v1/gs-lms/unknown/revisits/due")
    assert response.status_code == 404


def test_completing_revisit_closes_the_loop(client, seeded_engine):
    """A completed recall leaves the due queue and keeps its audit timestamp."""
    before = client.get("/api/v1/gs-lms/geography/revisits/due").json()["data"]
    assert before["total"] == 1

    response = client.post("/api/v1/gs-lms/geography/revisits/1/complete")
    assert response.status_code == 200, response.text
    assert response.json()["data"]["completed"] is True

    after = client.get("/api/v1/gs-lms/geography/revisits/due").json()["data"]
    assert after["total"] == 0

    _, TestSession = seeded_engine
    db = TestSession()
    try:
        schedule = db.query(GsLmsRevisitSchedule).filter_by(id=1).one()
        assert schedule.completed is True
        assert schedule.completed_at is not None
    finally:
        db.close()
