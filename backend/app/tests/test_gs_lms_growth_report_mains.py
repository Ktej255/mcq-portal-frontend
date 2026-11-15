"""Hermetic Mains-score derivation coverage for GS Growth Reports."""

from __future__ import annotations

from datetime import date, datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.api.v1.gs_lms.growth import get_growth_report as get_growth_report_endpoint
from app.core.gs_lms.funnel_models import GsLmsGrowthReport
from app.core.gs_lms.growth_report import generate_growth_report
from app.core.gs_lms.models import (
    GsLmsAnswerAttempt,
    GsLmsAnswerAttemptStatusEnum,
    GsLmsAnswerModeEnum,
    GsLmsEvaluationReport,
    GsLmsExamTypeEnum,
    GsLmsNodeTypeEnum,
    GsLmsPyq,
    GsLmsSyllabusNode,
)
from app.db.session import Base
from app.models.domain import RoleEnum, User


TEST_TABLES = {
    "institutions",
    "users",
    "gs_subjects",
    "gs_day_lessons",
    "gs_lms_syllabus_nodes",
    "gs_lms_content_sections",
    "gs_lms_reading_times",
    "gs_lms_recall_attempts",
    "gs_lms_mcq_lab_sessions",
    "gs_lms_weakness_patterns",
    "gs_lms_growth_reports",
    "gs_lms_spaced_rep_schedules",
    "gs_lms_pyqs",
    "gs_lms_answer_attempts",
    "gs_lms_evaluation_reports",
}


@pytest.fixture
def growth_db():
    engine = create_engine(
        "sqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    tables = [table for name, table in Base.metadata.tables.items() if name in TEST_TABLES]
    Base.metadata.create_all(engine, tables=tables)
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    db = TestSession()
    try:
        _seed_growth_data(db)
        yield db
    finally:
        db.close()
        engine.dispose()


def _seed_growth_data(db: Session) -> None:
    db.add_all(
        [
            User(id=1, google_uid="growth-student", email="growth@test.local", full_name="Growth Student", role=RoleEnum.STUDENT),
            User(id=2, google_uid="other-student", email="other@test.local", full_name="Other Student", role=RoleEnum.STUDENT),
            User(id=3, google_uid="empty-student", email="empty@test.local", full_name="Empty Student", role=RoleEnum.STUDENT),
        ]
    )
    db.add_all(
        [
            GsSubject(id=1, slug="geography", name="GS Geography", display_order=1),
            GsSubject(id=2, slug="history", name="GS History", display_order=2),
        ]
    )
    db.add_all(
        [
            GsLmsSyllabusNode(id=100, subject_id=1, title="Target", node_type=GsLmsNodeTypeEnum.LEAF_TOPIC, weight=1, display_order=1, review_status=GsReviewStatusEnum.REVIEWED),
            GsLmsSyllabusNode(id=200, subject_id=1, title="Other Node", node_type=GsLmsNodeTypeEnum.LEAF_TOPIC, weight=1, display_order=2, review_status=GsReviewStatusEnum.REVIEWED),
            GsLmsSyllabusNode(id=300, subject_id=2, title="Other Subject", node_type=GsLmsNodeTypeEnum.LEAF_TOPIC, weight=1, display_order=3, review_status=GsReviewStatusEnum.REVIEWED),
        ]
    )
    db.add_all(
        [
            GsLmsPyq(id=1, subject_id=1, syllabus_node_id=100, exam_type=GsLmsExamTypeEnum.MAINS, year=2024, question_text="Target question", marks=15, review_status=GsReviewStatusEnum.REVIEWED),
            GsLmsPyq(id=2, subject_id=1, syllabus_node_id=200, exam_type=GsLmsExamTypeEnum.MAINS, year=2024, question_text="Other node question", marks=15, review_status=GsReviewStatusEnum.REVIEWED),
            GsLmsPyq(id=3, subject_id=2, syllabus_node_id=300, exam_type=GsLmsExamTypeEnum.MAINS, year=2024, question_text="Other subject question", marks=15, review_status=GsReviewStatusEnum.REVIEWED),
        ]
    )

    def add_evaluation(attempt_id: int, student_id: int, pyq_id: int, marks: float) -> None:
        attempt = GsLmsAnswerAttempt(
            id=attempt_id,
            student_id=student_id,
            pyq_id=pyq_id,
            question_text=f"Answer {attempt_id}",
            max_marks=15,
            mode=GsLmsAnswerModeEnum.TYPED,
            status=GsLmsAnswerAttemptStatusEnum.EVALUATED,
            raw_text="A submitted answer",
            review_acknowledged=True,
            is_deleted=False,
        )
        report = GsLmsEvaluationReport(
            id=attempt_id,
            attempt_id=attempt_id,
            student_id=student_id,
            sections={},
            incomplete_sections=[],
            marks_awarded=marks,
            max_marks=15,
        )
        db.add_all([attempt, report])

    # The target student's latest valid report is 11/15. Other records are
    # intentionally tempting but must not cross student, node, or subject scope.
    add_evaluation(1, 1, 1, 11)
    add_evaluation(2, 2, 1, 14)
    add_evaluation(3, 1, 2, 13)
    add_evaluation(4, 1, 3, 12)
    db.commit()


def test_growth_report_derives_scoped_mains_score(growth_db):
    report = generate_growth_report(growth_db, student_id=1, node_id=100)

    assert report.mains_score == 11
    assert report.mains_max_marks == 15

    persisted = (
        growth_db.query(GsLmsGrowthReport)
        .filter(
            GsLmsGrowthReport.student_id == 1,
            GsLmsGrowthReport.syllabus_node_id == 100,
        )
        .one()
    )
    assert persisted.mains_score == 11
    assert persisted.mains_max_marks == 15


def test_growth_report_excludes_other_student_node_and_subject(growth_db):
    report = generate_growth_report(growth_db, student_id=1, node_id=100)

    assert report.mains_score == 11
    assert report.mains_max_marks == 15


def test_growth_report_preserves_empty_mains_state_without_evaluation(growth_db):
    report = generate_growth_report(growth_db, student_id=3, node_id=100)

    assert report.mains_score is None
    assert report.mains_max_marks is None


def test_growth_endpoint_reconciles_older_empty_snapshot(growth_db):
    growth_db.add(
        GsLmsGrowthReport(
            student_id=1,
            syllabus_node_id=100,
            section_metrics=[],
            mcq_total_score=0,
            mcq_type_breakdown=[],
            mains_score=None,
            mains_max_marks=None,
            next_recall_date=date.today(),
            recall_interval_days=3,
            weaknesses=[],
            generated_at=datetime.now(timezone.utc),
        )
    )
    growth_db.commit()

    response = get_growth_report_endpoint(
        node_id=100,
        subject=growth_db.get(GsSubject, 1),
        current_user=growth_db.get(User, 1),
        db=growth_db,
    )

    assert response.mains_score == 11
    assert response.mains_max_marks == 15
    persisted = growth_db.query(GsLmsGrowthReport).one()
    assert persisted.mains_score == 11
    assert persisted.mains_max_marks == 15
