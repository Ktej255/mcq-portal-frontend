"""Evidence honesty regressions for GS Growth Reports.

A Growth Report is the topic-level answer to "what did I actually do?".
Sections with no reading or recall record must not be rendered as zero
performance, and must not generate "low recall" weakness advice.
"""

from __future__ import annotations

from datetime import date, datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.v1.gs_lms.growth import get_growth_report as get_growth_report_endpoint
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.funnel_models import (
    GsLmsGrowthReport,
    GsLmsMcqLabSession,
    GsLmsReadingTime,
    GsLmsRecallAttempt,
)
from app.core.gs_lms.growth_report import generate_growth_report
from app.core.gs_lms.models import (
    GsLmsContentSection,
    GsLmsNodeTypeEnum,
    GsLmsSectionLabelEnum,
    GsLmsSyllabusNode,
)
from app.db.session import Base
from app.models.domain import RoleEnum, User


TEST_TABLES = {
    "institutions",
    "users",
    "gs_subjects",
    "gs_lms_syllabus_nodes",
    "gs_lms_content_sections",
    "gs_lms_reading_times",
    "gs_lms_recall_attempts",
    "gs_lms_mcq_lab_sessions",
    "gs_lms_mcq_lab_attempts",
    "gs_lms_weakness_patterns",
    "gs_lms_growth_reports",
    "gs_lms_spaced_rep_schedules",
    "gs_lms_pyqs",
    "gs_lms_answer_attempts",
    "gs_lms_evaluation_reports",
}


@pytest.fixture()
def evidence_db():
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
        db.add(User(
            id=1,
            google_uid="evidence-student",
            email="evidence@test.local",
            full_name="Evidence Student",
            role=RoleEnum.STUDENT,
        ))
        db.add(GsSubject(id=1, slug="geography", name="GS Geography", display_order=1))
        db.add(GsLmsSyllabusNode(
            id=100,
            subject_id=1,
            title="Monsoon System",
            node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
            weight=1,
            display_order=1,
            review_status=GsReviewStatusEnum.REVIEWED,
        ))
        db.add_all([
            GsLmsContentSection(
                id=11, syllabus_node_id=100, section_label=GsLmsSectionLabelEnum.BASIC,
                title="Basic", blocks=[], display_order=1,
                review_status=GsReviewStatusEnum.REVIEWED,
            ),
            GsLmsContentSection(
                id=12, syllabus_node_id=100, section_label=GsLmsSectionLabelEnum.NCERT_LEVEL,
                title="NCERT", blocks=[], display_order=2,
                review_status=GsReviewStatusEnum.REVIEWED,
            ),
            GsLmsContentSection(
                id=13, syllabus_node_id=100, section_label=GsLmsSectionLabelEnum.EXAMINER_TRAPS,
                title="Traps", blocks=[], display_order=5,
                review_status=GsReviewStatusEnum.REVIEWED,
            ),
        ])
        db.flush()
        # BASIC was read and recalled well. NCERT was read but never checked.
        # EXAMINER_TRAPS has no evidence at all and must not be scored as zero.
        db.add_all([
            GsLmsReadingTime(
                student_id=1, syllabus_node_id=100, section_id=11,
                duration_seconds=420, estimated_duration_seconds=400,
            ),
            GsLmsReadingTime(
                student_id=1, syllabus_node_id=100, section_id=12,
                duration_seconds=360, estimated_duration_seconds=400,
            ),
            GsLmsRecallAttempt(
                student_id=1, syllabus_node_id=100, section_label="BASIC",
                recall_score=0.8, confidence_score=0.7, attempt_number=1,
            ),
        ])
        db.commit()
        yield db
    finally:
        db.close()
        engine.dispose()


def test_sections_without_evidence_are_flagged_not_penalised(evidence_db):
    report = generate_growth_report(evidence_db, student_id=1, node_id=100)
    by_label = {sm.section_label: sm for sm in report.section_metrics}

    assert [sm.section_label for sm in report.section_metrics] == [
        "BASIC",
        "NCERT_LEVEL",
        "EXAMINER_TRAPS",
    ]

    assert by_label["BASIC"].has_reading_evidence is True
    assert by_label["BASIC"].has_recall_evidence is True
    assert by_label["BASIC"].recall_score == pytest.approx(0.8)

    assert by_label["NCERT_LEVEL"].has_reading_evidence is True
    assert by_label["NCERT_LEVEL"].has_recall_evidence is False
    assert by_label["NCERT_LEVEL"].is_rushed is False

    assert by_label["EXAMINER_TRAPS"].has_reading_evidence is False
    assert by_label["EXAMINER_TRAPS"].has_recall_evidence is False
    assert by_label["EXAMINER_TRAPS"].is_rushed is False

    low_recall = [w for w in report.weaknesses if w.category == "low_recall"]
    assert low_recall == []


def test_recall_interval_uses_only_recorded_recall(evidence_db):
    report = generate_growth_report(evidence_db, student_id=1, node_id=100)

    # 0.8 recall maps to a 6-day initial interval. Had unevidenced sections
    # been averaged in as zero, the interval would collapse to 1–3 days.
    assert report.recall_interval_days == 6


def test_existing_snapshot_scores_are_returned_as_percentages(evidence_db):
    evidence_db.add(GsLmsGrowthReport(
        student_id=1,
        syllabus_node_id=100,
        section_metrics=[
            {
                "section_label": "BASIC",
                "reading_time_seconds": 120,
                "recall_score": 0.72,
                "confidence_score": 0.6,
                "is_rushed": False,
            },
            {
                "section_label": "EXAMINER_TRAPS",
                "reading_time_seconds": 0,
                "recall_score": 0.0,
                "confidence_score": 0.0,
                "is_rushed": True,
            },
        ],
        mcq_total_score=40,
        mcq_type_breakdown=[],
        mains_score=None,
        mains_max_marks=None,
        next_recall_date=date.today(),
        recall_interval_days=3,
        weaknesses=[],
        generated_at=datetime.now(timezone.utc),
    ))
    evidence_db.commit()

    response = get_growth_report_endpoint(
        node_id=100,
        subject=evidence_db.get(GsSubject, 1),
        current_user=evidence_db.get(User, 1),
        db=evidence_db,
    )

    first, second = response.section_metrics
    assert first.recall_score == 72.0
    assert first.confidence_score == 60.0
    assert first.has_recall_evidence is True
    assert first.is_rushed is False

    # A zero-duration row is not evidence of rushing, and a zero score on a
    # legacy snapshot cannot be presented as an attempted recall.
    assert second.has_reading_evidence is False
    assert second.is_rushed is False
    assert second.has_recall_evidence is False

    # No type breakdown means no MCQ session was ever submitted; the stored
    # score is a legacy placeholder and not a failed attempt.
    assert response.has_mcq_evidence is False


def test_mcq_is_not_scored_zero_without_a_session(evidence_db):
    report = generate_growth_report(evidence_db, student_id=1, node_id=100)

    assert report.has_mcq_evidence is False
    assert report.mcq_total_score == 0.0

    response = get_growth_report_endpoint(
        node_id=100,
        subject=evidence_db.get(GsSubject, 1),
        current_user=evidence_db.get(User, 1),
        db=evidence_db,
    )
    assert response.has_mcq_evidence is False
    assert response.mcq_type_breakdown == []


def test_submitted_mcq_session_is_evidence_even_at_zero(evidence_db):
    # A genuine zero must remain distinguishable from "never taken".
    evidence_db.add(GsLmsMcqLabSession(
        student_id=1,
        syllabus_node_id=100,
        total_questions=15,
        correct_count=0,
        score=0.0,
        submitted_at=datetime.now(timezone.utc),
    ))
    evidence_db.commit()

    report = generate_growth_report(evidence_db, student_id=1, node_id=100)

    assert report.has_mcq_evidence is True
    assert report.mcq_total_score == 0.0


def test_report_without_content_sections_still_generates_honestly(evidence_db):
    # Legacy topics may have no content-section rows at all. The report still
    # generates with the canonical labels, but every row is unevidenced and
    # none may be turned into weakness advice.
    evidence_db.query(GsLmsContentSection).delete()
    evidence_db.query(GsLmsRecallAttempt).delete()
    evidence_db.commit()

    report = generate_growth_report(evidence_db, student_id=1, node_id=100)

    assert len(report.section_metrics) == 5
    assert all(sm.has_reading_evidence is False for sm in report.section_metrics)
    assert all(sm.has_recall_evidence is False for sm in report.section_metrics)
    assert all(w.category != "low_recall" for w in report.weaknesses)
