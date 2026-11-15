"""Hermetic integrity regressions for the GS LMS MCQ Lab."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.funnel_models import (
    GsLmsMcqLabAttempt,
    GsLmsMcqLabSession,
    GsLmsWeaknessPattern,
)
from app.core.gs_lms.models import (
    GsLmsMcqQuestion,
    GsLmsNodeTypeEnum,
    GsLmsQuestionTypeEnum,
    GsLmsSyllabusNode,
)
from app.db.session import Base, get_db
from app.main import app
from app.models.domain import RoleEnum, User


TARGET_NODE_ID = 100
SHORT_NODE_ID = 101
OTHER_NODE_ID = 200
STUDENT_ID = 1


@pytest.fixture
def seeded_mcq_lab():
    """Create one complete topic, one short topic, and one other topic."""
    engine = create_engine(
        "sqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    tables = [
        table
        for name, table in Base.metadata.tables.items()
        if name
        in {
            "institutions",
            "users",
            "gs_subjects",
            "gs_day_lessons",
            "gs_lms_syllabus_nodes",
            "gs_lms_mcq_questions",
            "gs_lms_mcq_lab_sessions",
            "gs_lms_mcq_lab_attempts",
            "gs_lms_weakness_patterns",
        }
    ]
    Base.metadata.create_all(engine, tables=tables)
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    db = TestSession()
    try:
        db.add(
            User(
                id=STUDENT_ID,
                google_uid="mcq-lab-student",
                email="mcq-lab-student@test.local",
                full_name="MCQ Lab Student",
                role=RoleEnum.STUDENT,
            )
        )
        db.add(GsSubject(id=1, slug="geography", name="GS Geography", display_order=1))
        db.add_all(
            GsLmsSyllabusNode(
                id=node_id,
                subject_id=1,
                title=title,
                node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
                weight=1.0,
                display_order=node_id,
                review_status=GsReviewStatusEnum.REVIEWED,
            )
            for node_id, title in (
                (TARGET_NODE_ID, "Complete Topic"),
                (SHORT_NODE_ID, "Short Topic"),
                (OTHER_NODE_ID, "Other Topic"),
            )
        )
        db.flush()

        def add_question(question_id: int, node_id: int, reviewed: bool = True):
            db.add(
                GsLmsMcqQuestion(
                    id=question_id,
                    syllabus_node_id=node_id,
                    question_text=f"Question {question_id}",
                    options=[
                        {"label": "A", "text": "Correct"},
                        {"label": "B", "text": "Incorrect"},
                    ],
                    correct_option="A",
                    explanation=f"Explanation {question_id}",
                    question_type=GsLmsQuestionTypeEnum.FACTUAL,
                    display_order=question_id,
                    review_status=(
                        GsReviewStatusEnum.REVIEWED
                        if reviewed
                        else GsReviewStatusEnum.UNREVIEWED
                    ),
                )
            )

        for question_id in range(1, 16):
            add_question(question_id, TARGET_NODE_ID)
        add_question(16, TARGET_NODE_ID, reviewed=False)
        for question_id in range(17, 19):
            add_question(question_id, OTHER_NODE_ID)
        for question_id in range(19, 33):
            add_question(question_id, SHORT_NODE_ID)
        db.commit()
    finally:
        db.close()

    def override_get_db():
        session = TestSession()
        try:
            yield session
        finally:
            session.close()

    class FakeUser:
        id = STUDENT_ID
        email = "mcq-lab-student@test.local"
        google_uid = "mcq-lab-student"
        role = RoleEnum.STUDENT

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: FakeUser()
    try:
        yield TestClient(app), TestSession
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)
        engine.dispose()


def _answers(question_ids: list[int]) -> dict:
    return {
        "answers": [
            {"question_id": question_id, "chosen_answer": "A"}
            for question_id in question_ids
        ]
    }


def _submit(client: TestClient, node_id: int, question_ids: list[int]):
    return client.post(
        f"/api/v1/gs-lms/geography/funnel/{node_id}/mcq-lab/submit",
        json=_answers(question_ids),
    )


def test_questions_reject_a_short_reviewed_topic_without_backfill(seeded_mcq_lab):
    client, _ = seeded_mcq_lab

    response = client.get(
        f"/api/v1/gs-lms/geography/funnel/{SHORT_NODE_ID}/mcq-lab/questions"
    )

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "This topic does not yet have a complete reviewed MCQ Lab set"
    )


def test_submit_rejects_duplicate_question_ids_before_persistence(seeded_mcq_lab):
    client, TestSession = seeded_mcq_lab
    question_ids = list(range(1, 15)) + [14]

    response = _submit(client, TARGET_NODE_ID, question_ids)

    assert response.status_code == 422
    assert response.json()["detail"] == "Duplicate question IDs are not allowed"
    db = TestSession()
    try:
        assert db.query(GsLmsMcqLabSession).count() == 0
        assert db.query(GsLmsMcqLabAttempt).count() == 0
    finally:
        db.close()


def test_submit_rejects_reviewed_question_from_another_topic(seeded_mcq_lab):
    client, TestSession = seeded_mcq_lab
    question_ids = list(range(1, 15)) + [17]

    response = _submit(client, TARGET_NODE_ID, question_ids)

    assert response.status_code == 422
    assert response.json()["detail"] == (
        "Questions must be reviewed and belong to the requested topic"
    )
    db = TestSession()
    try:
        assert db.query(GsLmsMcqLabSession).count() == 0
    finally:
        db.close()


def test_submit_rejects_unreviewed_question_from_requested_topic(seeded_mcq_lab):
    client, TestSession = seeded_mcq_lab
    question_ids = list(range(1, 15)) + [16]

    response = _submit(client, TARGET_NODE_ID, question_ids)

    assert response.status_code == 422
    assert response.json()["detail"] == (
        "Questions must be reviewed and belong to the requested topic"
    )
    db = TestSession()
    try:
        assert db.query(GsLmsMcqLabSession).count() == 0
    finally:
        db.close()


def test_submit_scores_and_persists_a_valid_same_topic_reviewed_set(seeded_mcq_lab):
    client, TestSession = seeded_mcq_lab
    question_ids = list(range(1, 16))

    response = _submit(client, TARGET_NODE_ID, question_ids)

    assert response.status_code == 200
    payload = response.json()
    assert payload["total_questions"] == 15
    assert payload["correct_count"] == 15
    assert payload["score"] == 100.0
    assert {attempt["question_id"] for attempt in payload["attempts"]} == set(question_ids)

    db = TestSession()
    try:
        session = db.query(GsLmsMcqLabSession).one()
        assert session.student_id == STUDENT_ID
        assert session.syllabus_node_id == TARGET_NODE_ID
        assert session.correct_count == 15
        assert db.query(GsLmsMcqLabAttempt).filter_by(session_id=session.id).count() == 15
        weakness = db.query(GsLmsWeaknessPattern).one()
        assert weakness.student_id == STUDENT_ID
        assert weakness.total_attempts == 15
        assert weakness.correct_count == 15
    finally:
        db.close()


def test_preferred_distribution_uses_the_taxonomy_the_bank_stores():
    """The lab must not ask for question types the content pipeline never writes.

    An earlier distribution used MULTI_STATEMENT / DIRECT_RECALL style labels
    while every stored question used GsLmsQuestionTypeEnum, so the preferred
    mix was silently never enforced.
    """
    from app.core.gs_lms.mcq_lab_scoring import (
        REQUIRED_TYPE_DISTRIBUTION,
        TOTAL_MCQ_LAB_QUESTIONS,
    )

    stored = {value.value for value in GsLmsQuestionTypeEnum}
    assert set(REQUIRED_TYPE_DISTRIBUTION) <= stored
    assert sum(REQUIRED_TYPE_DISTRIBUTION.values()) == TOTAL_MCQ_LAB_QUESTIONS
