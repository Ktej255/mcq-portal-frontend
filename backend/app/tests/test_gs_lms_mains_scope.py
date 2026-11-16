"""Hermetic scope and review-gate regressions for GS Mains funnel routes."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.models import (
    GsLmsAnswerAttempt,
    GsLmsAnswerAttemptStatusEnum,
    GsLmsEvaluationReport,
    GsLmsExamTypeEnum,
    GsLmsNodeTypeEnum,
    GsLmsPyq,
    GsLmsSyllabusNode,
)
from app.db.session import Base, get_db
from app.main import app
from app.models.domain import JobExecutionRegistry, RoleEnum, User


@pytest.fixture
def mains_client():
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
            "gs_lms_pyqs",
            "gs_lms_answer_attempts",
            "gs_lms_evaluation_reports",
            "job_execution_registry",
            "daily_usage",
        }
    ]
    Base.metadata.create_all(engine, tables=tables)
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    db = TestSession()
    try:
        db.add(
            User(
                id=1,
                google_uid="mains-scope-student",
                email="mains-scope@test.local",
                full_name="Mains Scope Student",
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
            for node_id, title in ((100, "Target Topic"), (200, "Other Topic"))
        )
        db.add_all(
            GsLmsPyq(
                id=question_id,
                subject_id=1,
                syllabus_node_id=node_id,
                exam_type=GsLmsExamTypeEnum.MAINS,
                year=2024,
                question_text=f"Mains prompt {question_id}",
                answer_text=f"Reference answer for question {question_id}",
                explanation=f"Reference outline for question {question_id}",
                marks=15,
                review_status=review_status,
            )
            for question_id, node_id, review_status in (
                (1, 100, GsReviewStatusEnum.REVIEWED),
                (2, 200, GsReviewStatusEnum.REVIEWED),
                (3, 100, GsReviewStatusEnum.UNREVIEWED),
            )
        )
        # Attempt 11 finished with a report, attempt 12 is still evaluating,
        # and attempt 13 failed without a report.
        db.add_all(
            GsLmsAnswerAttempt(
                id=attempt_id,
                student_id=1,
                pyq_id=1,
                gs_paper="GS1",
                question_text="Mains prompt 1",
                max_marks=15,
                mode="TYPED",
                status=status,
                raw_text="A submitted answer.",
                review_acknowledged=True,
                word_count=120,
                word_limit=250,
            )
            for attempt_id, status in (
                (11, GsLmsAnswerAttemptStatusEnum.EVALUATED),
                (12, GsLmsAnswerAttemptStatusEnum.SUBMITTED),
                (13, GsLmsAnswerAttemptStatusEnum.FAILED),
            )
        )
        db.add(
            GsLmsEvaluationReport(
                id=21,
                attempt_id=11,
                student_id=1,
                sections={
                    "introduction": {"feedback": "Clear framing.", "score": 3},
                    "body": {"feedback": "Add one more example.", "score": 4},
                },
                incomplete_sections=[],
                marks_awarded=8,
                max_marks=15,
            )
        )
        db.add_all(
            JobExecutionRegistry(
                id=job_id,
                job_name="student:1",
                job_type="GS_LMS_EVALUATION",
                reference_id=str(attempt_id),
                status=job_status,
            )
            for job_id, attempt_id, job_status in (
                (31, 11, "COMPLETED"),
                (32, 12, "STARTED"),
                (33, 13, "FAILED"),
            )
        )
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
        id = 1
        email = "mains-scope@test.local"
        google_uid = "mains-scope-student"
        role = RoleEnum.STUDENT

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: FakeUser()
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)
        engine.dispose()


def _payload(question_id: int, mode: str = "TYPED") -> dict:
    return {
        "question_id": question_id,
        "introduction": "An introduction.",
        "body": "A body with enough content for a bounded route validation.",
        "conclusion": "A conclusion.",
        "mode": mode,
    }


def test_mains_questions_are_reviewed_and_node_scoped(mains_client):
    response = mains_client.get(
        "/api/v1/gs-lms/geography/funnel/100/mains/questions"
    )

    assert response.status_code == 200
    assert [item["question_id"] for item in response.json()] == [1]


def test_submit_rejects_reviewed_question_from_another_node(mains_client):
    response = mains_client.post(
        "/api/v1/gs-lms/geography/funnel/100/mains/submit",
        json=_payload(2),
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Mains question not found"


def test_submit_rejects_unreviewed_question(mains_client):
    response = mains_client.post(
        "/api/v1/gs-lms/geography/funnel/100/mains/submit",
        json=_payload(3),
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Mains question not found"


def test_submit_rejects_modes_not_supported_by_this_route(mains_client):
    response = mains_client.post(
        "/api/v1/gs-lms/geography/funnel/100/mains/submit",
        json=_payload(1, mode="HANDWRITTEN"),
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "This Mains route currently accepts typed answers only"


def test_status_reveals_reference_answer_once_report_exists(mains_client):
    response = mains_client.get(
        "/api/v1/gs-lms/geography/funnel/100/mains/status/11"
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "COMPLETED"
    assert body["report"]["marks_awarded"] == 8
    assert body["model_answer"] == "Reference answer for question 1"
    assert body["explanation"] == "Reference outline for question 1"


def test_status_withholds_reference_answer_before_report(mains_client):
    response = mains_client.get(
        "/api/v1/gs-lms/geography/funnel/100/mains/status/12"
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "IN_PROGRESS"
    assert body["report"] is None
    assert body["model_answer"] is None
    assert body["explanation"] is None


def test_status_still_reveals_reference_answer_after_failed_evaluation(mains_client):
    response = mains_client.get(
        "/api/v1/gs-lms/geography/funnel/100/mains/status/13"
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "FAILED"
    assert body["report"] is None
    assert body["model_answer"] == "Reference answer for question 1"
    assert body["explanation"] == "Reference outline for question 1"
