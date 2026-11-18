"""Content-access tests for funnel recall steps.

The funnel requires a recall attempt before a recall step can be completed,
but only when the topic actually has REVIEWED content for that section.
Otherwise a student would be trapped on a recall step they cannot answer.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base, get_db
from app.api.dependencies import get_current_user
from app.main import app
from app.models.domain import RoleEnum

# Register every model on Base.metadata before creating test tables.
from app.core.gs_lms import models as gs_lms_models  # noqa: F401
from app.core.gs_lms import student_models as gs_lms_student_models  # noqa: F401
from app.core.gs_lms import funnel_models as gs_lms_funnel_models  # noqa: F401
from app.core.gs import models as gs_models  # noqa: F401
from app.models import domain as domain_models  # noqa: F401

from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.models import (
    GsLmsContentSection,
    GsLmsNodeTypeEnum,
    GsLmsSectionLabelEnum,
    GsLmsSyllabusNode,
)
from app.core.gs_lms.funnel_models import GsLmsRecallAttempt

STUDENT_ID = 1
NODE_ID = 100


@pytest.fixture()
def test_engine():
    engine = create_engine(
        "sqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    relevant_prefixes = ("gs_lms_", "gs_subjects", "users")
    relevant_tables = [
        table
        for name, table in Base.metadata.tables.items()
        if any(name.startswith(prefix) for prefix in relevant_prefixes)
    ]
    Base.metadata.create_all(engine, tables=relevant_tables)
    yield engine
    engine.dispose()


@pytest.fixture()
def session_factory(test_engine):
    return sessionmaker(bind=test_engine, autoflush=False, autocommit=False)


@pytest.fixture()
def seeded_subject_and_node(session_factory):
    db = session_factory()
    try:
        db.add(GsSubject(id=1, slug="geography", name="GS Geography", display_order=1))
        db.flush()
        db.add(
            GsLmsSyllabusNode(
                id=NODE_ID,
                subject_id=1,
                title="Geomorphology Basics",
                node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
                weight=1.0,
                display_order=1,
                review_status=GsReviewStatusEnum.REVIEWED,
            )
        )
        db.commit()
    finally:
        db.close()


@pytest.fixture()
def client(session_factory, seeded_subject_and_node):
    def _override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    class _FakeUser:
        id = STUDENT_ID
        email = "student@test.local"
        role = RoleEnum.STUDENT

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user] = lambda: _FakeUser()

    yield TestClient(app)

    app.dependency_overrides.pop(get_db, None)
    app.dependency_overrides.pop(get_current_user, None)


def _add_section(session_factory, *, section_id: int, label: GsLmsSectionLabelEnum, review_status: GsReviewStatusEnum):
    db = session_factory()
    try:
        db.add(
            GsLmsContentSection(
                id=section_id,
                syllabus_node_id=NODE_ID,
                section_label=label,
                title=f"{label.value} section",
                blocks=[{"type": "text", "content": "Content"}],
                display_order=1,
                review_status=review_status,
                authored=review_status == GsReviewStatusEnum.REVIEWED,
            )
        )
        db.commit()
    finally:
        db.close()


def _complete_step(client: TestClient, step: int):
    return client.post(
        f"/api/v1/gs-lms/geography/funnel/{NODE_ID}/complete-step",
        json={"step": step},
    )


class TestRecallStepContentAccess:
    def test_recall_step_requires_attempt_when_reviewed_section_exists(
        self, client, session_factory
    ):
        _add_section(
            session_factory,
            section_id=1,
            label=GsLmsSectionLabelEnum.BASIC,
            review_status=GsReviewStatusEnum.REVIEWED,
        )

        assert _complete_step(client, 1).status_code == 200
        assert _complete_step(client, 2).status_code == 200

        blocked = _complete_step(client, 3)
        assert blocked.status_code == 409
        assert "Submit the BASIC recall response" in blocked.json()["detail"]

        db = session_factory()
        try:
            db.add(
                GsLmsRecallAttempt(
                    student_id=STUDENT_ID,
                    syllabus_node_id=NODE_ID,
                    section_label="BASIC",
                    transcript="Continental drift and plate movement.",
                    recall_score=0.6,
                    confidence_score=0.7,
                    attempt_number=1,
                )
            )
            db.commit()
        finally:
            db.close()

        allowed = _complete_step(client, 3)
        assert allowed.status_code == 200
        assert allowed.json()["current_step"] == 4
        assert 3 in allowed.json()["completed_steps"]

    def test_recall_step_advances_when_section_is_missing(self, client):
        assert _complete_step(client, 1).status_code == 200
        assert _complete_step(client, 2).status_code == 200

        allowed = _complete_step(client, 3)
        assert allowed.status_code == 200
        assert allowed.json()["current_step"] == 4
        assert 3 in allowed.json()["completed_steps"]

    def test_recall_step_advances_when_section_is_unreviewed(
        self, client, session_factory
    ):
        _add_section(
            session_factory,
            section_id=1,
            label=GsLmsSectionLabelEnum.BASIC,
            review_status=GsReviewStatusEnum.UNREVIEWED,
        )

        assert _complete_step(client, 1).status_code == 200
        assert _complete_step(client, 2).status_code == 200

        allowed = _complete_step(client, 3)
        assert allowed.status_code == 200
        assert allowed.json()["current_step"] == 4
