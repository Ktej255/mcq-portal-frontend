"""Tests for the Revision Command Center, Overconfidence Traps, Adaptive Spacing,
Triage Evaluation, and Tests string-list option key mapping.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms import models as _gs_lms_models  # noqa: F401
from app.core.gs_lms import student_models as _gs_lms_student_models  # noqa: F401
from app.core.gs_lms import funnel_models as _gs_lms_funnel_models  # noqa: F401
from app.core.gs_lms.beta_scope import CANONICAL_SECTION_LABELS
from app.core.gs_lms.funnel_models import GsLmsMcqLabAttempt, GsLmsMcqLabSession
from app.core.gs_lms.mcq_lab_scoring import TOTAL_MCQ_LAB_QUESTIONS
from app.core.gs_lms.models import (
    GsLmsContentSection,
    GsLmsExamTypeEnum,
    GsLmsMcqQuestion,
    GsLmsNodeTypeEnum,
    GsLmsPyq,
    GsLmsQuestionTypeEnum,
    GsLmsSectionLabelEnum,
    GsLmsSyllabusNode,
)
from app.core.gs_lms.student_models import (
    GsLmsPracticeAttempt,
    GsLmsPracticeSession,
    GsLmsPracticeSessionStatusEnum,
    GsLmsRevisitSchedule,
)
from app.db.session import Base, get_db
from app.main import app
from app.models.domain import (
    Attempt,
    AttemptAnswer,
    AttemptStatusEnum,
    ConfidenceEnum,
    Question,
    Report,
    RevisionQueue,
    RoleEnum,
    Subject,
    Test,
    Topic,
    User,
    WorkflowStatusEnum,
)
from app.services.revision_service import (
    compute_adaptive_revision_schedule,
    compute_exam_countdown_pacing,
    populate_revision_queue_from_attempt,
)


def _make_session_factory():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    return engine, sessionmaker(bind=engine, autoflush=False, autocommit=False)


def _client_for(SessionLocal, user_obj):
    def _override_get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user] = lambda: user_obj
    return TestClient(app)


def _teardown_overrides():
    app.dependency_overrides.pop(get_db, None)
    app.dependency_overrides.pop(get_current_user, None)


def _seed_loop_ready_node(db, subject_id: int, node_id: int, title: str, *, loop_ready: bool):
    node = GsLmsSyllabusNode(
        id=node_id,
        subject_id=subject_id,
        title=title,
        node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
        weight=1.0,
        display_order=node_id,
        review_status=GsReviewStatusEnum.REVIEWED,
    )
    db.add(node)
    db.flush()

    labels = CANONICAL_SECTION_LABELS if loop_ready else CANONICAL_SECTION_LABELS[:3]
    for idx, label in enumerate(labels):
        db.add(
            GsLmsContentSection(
                syllabus_node_id=node_id,
                section_label=GsLmsSectionLabelEnum(label),
                title=f"{label} for {title}",
                blocks=[{"type": "text", "content": "text"}],
                display_order=idx + 1,
                review_status=GsReviewStatusEnum.REVIEWED,
                authored=True,
            )
        )

    if loop_ready:
        db.add(
            GsLmsPyq(
                subject_id=subject_id,
                syllabus_node_id=node_id,
                exam_type=GsLmsExamTypeEnum.PRELIMS,
                year=2022,
                question_text=f"PYQ for {title}",
                review_status=GsReviewStatusEnum.REVIEWED,
            )
        )
        for idx in range(TOTAL_MCQ_LAB_QUESTIONS):
            db.add(
                GsLmsMcqQuestion(
                    syllabus_node_id=node_id,
                    question_text=f"MCQ {idx} for {title}",
                    options=[{"label": "A", "text": "Yes"}, {"label": "B", "text": "No"}],
                    correct_option="A",
                    explanation="Because.",
                    question_type=GsLmsQuestionTypeEnum.FACTUAL,
                    display_order=idx + 1,
                    review_status=GsReviewStatusEnum.REVIEWED,
                )
            )
    db.flush()
    return node


def test_overconfidence_trap_capture_and_repeat_miss_metrics():
    engine, SessionLocal = _make_session_factory()
    db = SessionLocal()
    try:
        user = User(google_uid="trap-u", email="trap@upsc.local", role=RoleEnum.STUDENT)
        subject = Subject(name="Geography")
        db.add_all([user, subject])
        db.commit()

        topic = Topic(name="Monsoon", subject_id=subject.id)
        test = Test(title="GS Test 1", subject_id=subject.id)
        db.add_all([topic, test])
        db.commit()

        q_trap = Question(
            test_id=test.id,
            topic_id=topic.id,
            text_en="Trap Q",
            options_en={"A": "1", "B": "2", "C": "3", "D": "4"},
            correct_option="A",
            status=WorkflowStatusEnum.PUBLISHED,
        )
        q_mistake = Question(
            test_id=test.id,
            topic_id=topic.id,
            text_en="Mistake Q",
            options_en=["Opt1", "Opt2", "Opt3", "Opt4"],
            correct_option="B",
            status=WorkflowStatusEnum.PUBLISHED,
        )
        q_review = Question(
            test_id=test.id,
            topic_id=topic.id,
            text_en="Review Q",
            options_en={"A": "1", "B": "2", "C": "3", "D": "4"},
            correct_option="C",
            status=WorkflowStatusEnum.PUBLISHED,
        )
        q_skipped = Question(
            test_id=test.id,
            topic_id=topic.id,
            text_en="Skipped Q",
            options_en={"A": "1", "B": "2"},
            correct_option="A",
            status=WorkflowStatusEnum.PUBLISHED,
        )
        db.add_all([q_trap, q_mistake, q_review, q_skipped])
        db.commit()

        attempt1 = Attempt(user_id=user.id, test_id=test.id, status=AttemptStatusEnum.SUBMITTED)
        db.add(attempt1)
        db.commit()

        db.add_all([
            AttemptAnswer(
                attempt_id=attempt1.id,
                question_id=q_trap.id,
                selected_option="B",
                is_correct=False,
                is_skipped=False,
                confidence_level=ConfidenceEnum.HUNDRED_PERCENT,
            ),
            AttemptAnswer(
                attempt_id=attempt1.id,
                question_id=q_mistake.id,
                selected_option="A",
                is_correct=False,
                is_skipped=False,
                confidence_level=ConfidenceEnum.FIFTY_FIFTY,
            ),
            AttemptAnswer(
                attempt_id=attempt1.id,
                question_id=q_review.id,
                selected_option="C",
                is_correct=True,
                is_skipped=False,
                marked_for_review=True,
            ),
            AttemptAnswer(
                attempt_id=attempt1.id,
                question_id=q_skipped.id,
                selected_option=None,
                is_correct=False,
                is_skipped=True,
                confidence_level=ConfidenceEnum.FAIRLY_SURE,
            ),
        ])
        db.commit()

        populate_revision_queue_from_attempt(db, attempt1.id, user.id)

        trap_row = db.query(RevisionQueue).filter_by(user_id=user.id, question_id=q_trap.id).one()
        mistake_row = db.query(RevisionQueue).filter_by(user_id=user.id, question_id=q_mistake.id).one()
        review_row = db.query(RevisionQueue).filter_by(user_id=user.id, question_id=q_review.id).one()
        skipped_row = db.query(RevisionQueue).filter_by(user_id=user.id, question_id=q_skipped.id).first()

        assert trap_row.is_overconfident is True
        assert trap_row.category == "OVERCONFIDENCE_TRAP"
        assert trap_row.priority_score == pytest.approx(1.5)
        assert trap_row.forgetting_count == 0
        assert len(trap_row.retention_history) == 1

        assert mistake_row.is_overconfident is False
        assert mistake_row.category == "MISTAKE"
        assert mistake_row.priority_score == pytest.approx(1.0)

        assert review_row.category == "WEAKNESS"
        assert review_row.priority_score == pytest.approx(0.5)
        assert skipped_row is None

        # Simulate 26 repeat misses to verify forgetting_count, decay_rate cap (3.0), and 25-entry retention cap
        for idx in range(26):
            att = Attempt(user_id=user.id, test_id=test.id, status=AttemptStatusEnum.SUBMITTED)
            db.add(att)
            db.commit()
            db.add(
                AttemptAnswer(
                    attempt_id=att.id,
                    question_id=q_trap.id,
                    selected_option="D",
                    is_correct=False,
                    is_skipped=False,
                    confidence_level=ConfidenceEnum.FAIRLY_SURE,
                )
            )
            db.commit()
            populate_revision_queue_from_attempt(db, att.id, user.id)

        db.refresh(trap_row)
        assert trap_row.forgetting_count == 26
        assert trap_row.decay_rate == pytest.approx(3.0)
        assert len(trap_row.retention_history) == 25
    finally:
        db.close()
        engine.dispose()


def test_adaptive_schedule_and_exam_countdown_pacing():
    now = datetime(2026, 11, 19, 12, 0, tzinfo=timezone.utc)

    # Blank / wrong resets to 1 day
    days_blank, dt_blank = compute_adaptive_revision_schedule(
        current_mastery=0.6,
        new_mastery=0.45,
        review_count=3,
        last_reviewed_at=now - timedelta(days=5),
        next_review_at=now,
        now=now,
        is_correct=False,
        rating="blank",
    )
    assert days_blank == 1
    assert (dt_blank - now).days == 1

    # Improving score extends interval via compute_next_interval
    days_solid, _ = compute_adaptive_revision_schedule(
        current_mastery=0.5,
        new_mastery=0.75,
        review_count=3,
        last_reviewed_at=now - timedelta(days=6),
        next_review_at=now,
        now=now,
        is_correct=True,
        rating="solid",
    )
    assert 6 <= days_solid <= 90

    # Overdue (>2 days past scheduled) invokes handle_missed_session cap <= 3 days
    days_overdue, _ = compute_adaptive_revision_schedule(
        current_mastery=0.5,
        new_mastery=0.75,
        review_count=3,
        last_reviewed_at=now - timedelta(days=14),
        next_review_at=now - timedelta(days=5),
        now=now,
        is_correct=True,
        rating="solid",
    )
    assert 1 <= days_overdue <= 3

    # Clamp upper bound to 90 days
    days_capped, _ = compute_adaptive_revision_schedule(
        current_mastery=0.7,
        new_mastery=0.95,
        review_count=8,
        last_reviewed_at=now - timedelta(days=80),
        next_review_at=now,
        now=now,
        is_correct=True,
        rating="solid",
    )
    assert days_capped == 90

    # Max mastery (1.0 -> 1.0) on correct/solid keeps extending instead of halving
    days_max_mastery, _ = compute_adaptive_revision_schedule(
        current_mastery=1.0,
        new_mastery=1.0,
        review_count=4,
        last_reviewed_at=now - timedelta(days=10),
        next_review_at=now,
        now=now,
        is_correct=True,
        rating="solid",
    )
    assert days_max_mastery == 15

    # Exam countdown pacing: omitted, invalid, and past dates return None honestly
    assert compute_exam_countdown_pacing(10, 30, None, 25)["days_remaining"] is None
    assert compute_exam_countdown_pacing(10, 30, None, 25)["projected_cycles_before_exam"] is None
    assert compute_exam_countdown_pacing(10, 30, "not-a-date", 25)["days_remaining"] is None
    past_date = (date.today() - timedelta(days=10)).isoformat()
    past_pacing = compute_exam_countdown_pacing(10, 30, past_date, 25)
    assert past_pacing["days_remaining"] is None
    assert past_pacing["projected_cycles_before_exam"] is None

    future_date = (date.today() + timedelta(days=20)).isoformat()
    future_pacing = compute_exam_countdown_pacing(10, 50, future_date, 25)
    assert future_pacing["days_remaining"] == 20
    assert future_pacing["projected_cycles_before_exam"] == pytest.approx(10.0)
    assert future_pacing["recommended_daily_items"] >= 1


def test_rapid_drill_high_confidence_mistake_and_list_options_and_completion_ratings():
    engine, SessionLocal = _make_session_factory()
    db = SessionLocal()
    try:
        user = User(google_uid="drill-u", email="drill@upsc.local", role=RoleEnum.STUDENT)
        subject = Subject(name="Geography")
        db.add_all([user, subject])
        db.commit()
        topic = Topic(name="Climatology", subject_id=subject.id)
        test = Test(title="Drill Test", subject_id=subject.id)
        db.add_all([topic, test])
        db.commit()

        q1 = Question(
            test_id=test.id,
            topic_id=topic.id,
            text_en="List options trap",
            options_en=["Alpha", "Beta", "Gamma", "Delta"],
            correct_option="A",
            status=WorkflowStatusEnum.PUBLISHED,
        )
        q2 = Question(
            test_id=test.id,
            topic_id=topic.id,
            text_en="Regular mistake",
            options_en={"A": "1", "B": "2", "C": "3", "D": "4"},
            correct_option="B",
            status=WorkflowStatusEnum.PUBLISHED,
        )
        db.add_all([q1, q2])
        db.commit()

        rq1 = RevisionQueue(
            user_id=user.id,
            topic_id=topic.id,
            question_id=q1.id,
            reason="OVERCONFIDENCE_TRAP",
            category="OVERCONFIDENCE_TRAP",
            priority_score=1.5,
            is_overconfident=True,
            mastery_level=0.5,
            review_count=0,
            forgetting_count=0,
            next_review_at=datetime.now(timezone.utc) - timedelta(hours=1),
        )
        rq2 = RevisionQueue(
            user_id=user.id,
            topic_id=topic.id,
            question_id=q2.id,
            reason="INCORRECT_ANSWER",
            category="MISTAKE",
            priority_score=1.0,
            is_overconfident=False,
            mastery_level=0.2,
            review_count=0,
            forgetting_count=0,
            next_review_at=datetime.now(timezone.utc) - timedelta(hours=1),
        )
        db.add_all([rq1, rq2])
        db.commit()
        db.refresh(user)
        rq1_id, rq2_id, q1_id, q2_id = rq1.id, rq2.id, q1.id, q2.id
    finally:
        db.close()

    client = _client_for(SessionLocal, user)
    try:
        # GET /api/v1/revision/ includes new fields
        q_resp = client.get("/api/v1/revision/")
        assert q_resp.status_code == 200, q_resp.text
        items = q_resp.json()
        assert len(items) == 2
        assert items[0]["id"] == rq1_id
        assert items[0]["is_overconfident"] is True
        assert items[0]["category"] == "OVERCONFIDENCE_TRAP"
        assert "forgetting_count" in items[0]
        assert "next_review_at" in items[0]

        # GET /api/v1/revision/rapid-drill?mode=high_confidence_mistake
        drill_resp = client.get("/api/v1/revision/rapid-drill", params={"mode": "high_confidence_mistake"})
        assert drill_resp.status_code == 200, drill_resp.text
        drill = drill_resp.json()
        assert len(drill) == 1
        assert drill[0]["id"] == q1_id
        assert [opt["id"] for opt in drill[0]["options"]] == ["A", "B", "C", "D"]
        assert [opt["textEn"] for opt in drill[0]["options"]] == ["Alpha", "Beta", "Gamma", "Delta"]

        # POST complete with rating=solid (0.5 + 0.25 = 0.75 >= 0.7 -> clears is_overconfident)
        comp_solid = client.post(f"/api/v1/revision/{rq1_id}/complete", params={"rating": "solid"})
        assert comp_solid.status_code == 200, comp_solid.text
        solid_data = comp_solid.json()
        assert solid_data["status"] == "completed"
        assert solid_data["mastery_level"] == pytest.approx(0.75)
        assert solid_data["review_count"] == 1
        assert 1 <= solid_data["interval_days"] <= 90
        assert solid_data["is_overconfident"] is False

        # Negative mastery_delta (failed review) must NOT clear is_overconfident even when mastery >= 0.7
        db2 = SessionLocal()
        try:
            q2_row = db2.query(RevisionQueue).filter_by(id=rq2_id).one()
            q2_row.is_overconfident = True
            q2_row.mastery_level = 0.85
            db2.commit()
        finally:
            db2.close()
        comp_neg = client.post(f"/api/v1/revision/{rq2_id}/complete", params={"mastery_delta": -0.1})
        assert comp_neg.status_code == 200, comp_neg.text
        neg_data = comp_neg.json()
        assert neg_data["mastery_level"] == pytest.approx(0.75)
        assert neg_data["is_overconfident"] is True

        # POST complete with rating=blank increments forgetting_count and sets 1-day interval
        comp_blank = client.post(f"/api/v1/revision/{rq2_id}/complete", params={"rating": "blank"})
        assert comp_blank.status_code == 200, comp_blank.text
        blank_data = comp_blank.json()
        assert blank_data["interval_days"] == 1
        assert blank_data["mastery_level"] == pytest.approx(0.60)

        # Invalid rating returns 422
        bad_rating = client.post(f"/api/v1/revision/{rq2_id}/complete", params={"rating": "invalid"})
        assert bad_rating.status_code == 422

        # Bulk-complete updates adaptive interval and retention_history
        bulk_resp = client.post(
            "/api/v1/revision/bulk-complete",
            json=[{"question_id": q1_id, "is_correct": True}, {"question_id": q2_id, "is_correct": False}],
        )
        assert bulk_resp.status_code == 200, bulk_resp.text
        assert bulk_resp.json()["processed"] == 2
    finally:
        _teardown_overrides()
        engine.dispose()


def test_command_center_beta_scope_merge_and_zero_attempt_safety():
    engine, SessionLocal = _make_session_factory()
    db = SessionLocal()
    prev_beta_scope = settings.GS_LMS_BETA_SCOPE
    settings.GS_LMS_BETA_SCOPE = True
    try:
        user = User(id=10, google_uid="cc-u", email="cc@upsc.local", role=RoleEnum.STUDENT)
        subject = Subject(name="Geography")
        gs_subject = GsSubject(id=1, slug="geography", name="GS Geography", display_order=1)
        db.add_all([user, subject, gs_subject])
        db.commit()

        topic = Topic(name="Geomorphology", subject_id=subject.id)
        test = Test(title="CC Test", subject_id=subject.id)
        db.add_all([topic, test])
        db.commit()

        q = Question(
            test_id=test.id,
            topic_id=topic.id,
            text_en="Trap CC",
            options_en={"A": "1", "B": "2"},
            correct_option="A",
            status=WorkflowStatusEnum.PUBLISHED,
        )
        db.add(q)
        db.commit()

        db.add(
            RevisionQueue(
                user_id=user.id,
                topic_id=topic.id,
                question_id=q.id,
                reason="OVERCONFIDENCE_TRAP",
                category="OVERCONFIDENCE_TRAP",
                priority_score=1.5,
                is_overconfident=True,
                mastery_level=0.1,
                next_review_at=datetime.now(timezone.utc) - timedelta(hours=2),
            )
        )
        # Marked-for-review (WEAKNESS) item should count in total_due without inflating mistakes_due
        db.add(
            RevisionQueue(
                user_id=user.id,
                topic_id=topic.id,
                question_id=q.id,
                reason="MARKED_FOR_REVIEW",
                category="WEAKNESS",
                priority_score=0.5,
                is_overconfident=False,
                mastery_level=0.5,
                next_review_at=datetime.now(timezone.utc) - timedelta(hours=1),
            )
        )

        # Loop-ready node (101) vs locked unfinished node (102)
        _seed_loop_ready_node(db, subject_id=1, node_id=101, title="Plate Tectonics", loop_ready=True)
        _seed_loop_ready_node(db, subject_id=1, node_id=102, title="Locked Topic", loop_ready=False)

        # Due revisits on both nodes; locked node MUST be filtered out!
        db.add_all([
            GsLmsRevisitSchedule(
                student_id=user.id,
                syllabus_node_id=101,
                due_date=date.today() - timedelta(days=1),
                revisit_type="day_3",
                completed=False,
            ),
            GsLmsRevisitSchedule(
                student_id=user.id,
                syllabus_node_id=102,
                due_date=date.today() - timedelta(days=1),
                revisit_type="day_3",
                completed=False,
            ),
        ])

        # Practice + MCQ Lab weak topic on ready node (101) and locked node (102)
        for nid in (101, 102):
            ps = GsLmsPracticeSession(
                student_id=user.id,
                syllabus_node_id=nid,
                status=GsLmsPracticeSessionStatusEnum.SUBMITTED,
                total_questions=2,
            )
            ls = GsLmsMcqLabSession(
                student_id=user.id,
                syllabus_node_id=nid,
                total_questions=2,
            )
            db.add_all([ps, ls])
            db.flush()
            mcq_q = db.query(GsLmsMcqQuestion).first()
            if mcq_q is None:
                mcq_q = GsLmsMcqQuestion(
                    syllabus_node_id=101,
                    question_text="Dummy",
                    options=[{"label": "A", "text": "1"}],
                    correct_option="A",
                    explanation="Exp",
                    question_type=GsLmsQuestionTypeEnum.FACTUAL,
                    display_order=99,
                    review_status=GsReviewStatusEnum.REVIEWED,
                )
                db.add(mcq_q)
                db.flush()
            db.add_all([
                GsLmsPracticeAttempt(session_id=ps.id, question_id=mcq_q.id, student_id=user.id, is_correct=False),
                GsLmsPracticeAttempt(session_id=ps.id, question_id=mcq_q.id, student_id=user.id, is_correct=False),
                GsLmsMcqLabAttempt(
                    session_id=ls.id,
                    question_id=mcq_q.id,
                    question_type="FACTUAL",
                    chosen_answer="B",
                    correct_answer="A",
                    is_correct=False,
                ),
            ])
        db.commit()
        db.refresh(user)
    finally:
        db.close()

    client = _client_for(SessionLocal, user)
    try:
        future = (date.today() + timedelta(days=30)).isoformat()
        resp = client.get(
            "/api/v1/revision/command-center",
            params={"exam_date": future, "daily_minutes": 25},
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()

        assert data["revision_engine_version"] == "revision-os.v1"
        assert data["memory_alerts"] == []  # 0-attempt user gets [] cleanly

        summary = data["summary"]
        assert summary["total_due"] == 4  # 1 trap + 1 marked-for-review + 1 ready revisit + 1 ready weak topic
        assert summary["overconfidence_traps"] == 1
        assert summary["mistakes_due"] == 0
        assert summary["topic_revisits_due"] == 1
        assert summary["weak_topics_count"] == 1

        # Locked node 102 must NEVER appear in priority_queue
        node_ids = {item["syllabus_node_id"] for item in data["priority_queue"] if item["syllabus_node_id"] is not None}
        assert node_ids == {101}
        assert data["priority_queue"][0]["source"] == "revision_queue"
        assert data["priority_queue"][0]["is_overconfident"] is True
        assert data["pacing"]["days_remaining"] == 30
    finally:
        settings.GS_LMS_BETA_SCOPE = prev_beta_scope
        _teardown_overrides()
        engine.dispose()


def test_command_center_includes_real_misconception_alerts():
    engine, SessionLocal = _make_session_factory()
    db = SessionLocal()
    try:
        user = User(google_uid="mem-u", email="mem@upsc.local", role=RoleEnum.STUDENT)
        subject = Subject(name="Polity")
        db.add_all([user, subject])
        db.commit()
        topic = Topic(name="Parliament", subject_id=subject.id)
        test = Test(title="Polity Mock", subject_id=subject.id)
        db.add_all([topic, test])
        db.commit()

        for idx in range(2):
            att = Attempt(user_id=user.id, test_id=test.id, status=AttemptStatusEnum.SUBMITTED)
            db.add(att)
            db.commit()
            db.add(
                Report(
                    attempt_id=att.id,
                    total_score=30.0 + idx * 5,
                    accuracy=40.0,
                    correct_count=2,
                    incorrect_count=3,
                    unattempted_count=0,
                    topic_wise_analysis={"Parliament": {"correct": 2, "incorrect": 3}},
                )
            )
            db.commit()
        db.refresh(user)
    finally:
        db.close()

    client = _client_for(SessionLocal, user)
    try:
        resp = client.get("/api/v1/revision/command-center")
        assert resp.status_code == 200, resp.text
        alerts = resp.json()["memory_alerts"]
        assert len(alerts) == 1
        assert alerts[0]["topic"] == "Parliament"
        assert "recurring low mastery" in alerts[0]["flags"]
        assert alerts[0]["safety_note"]
    finally:
        _teardown_overrides()
        engine.dispose()


def test_triage_evaluate_and_tests_string_list_option_keys():
    engine, SessionLocal = _make_session_factory()
    db = SessionLocal()
    try:
        user = User(google_uid="triage-u", email="triage@upsc.local", role=RoleEnum.STUDENT)
        subject = Subject(name="Geography")
        db.add_all([user, subject])
        db.commit()
        topic = Topic(name="Oceans", subject_id=subject.id)
        test = Test(title="String Options Test", subject_id=subject.id, is_active=True)
        db.add_all([topic, test])
        db.commit()
        q = Question(
            test_id=test.id,
            topic_id=topic.id,
            text_en="Salinity question",
            options_en=["Atlantic", "Pacific", "Indian", "Arctic"],
            options_hi={"A": "अटलांटिक", "B": "प्रशांत"},
            correct_option="A",
            question_number=1,
            status=WorkflowStatusEnum.PUBLISHED,
        )
        db.add(q)
        db.commit()
        test_id, q_id = test.id, q.id
        db.refresh(user)
    finally:
        db.close()

    client = _client_for(SessionLocal, user)
    try:
        triage_resp = client.post(
            "/api/v1/revision/triage/evaluate",
            json={
                "items": [
                    {"topic_label": "Plate Tectonics", "subject_slug": "geography", "syllabus_node_id": 1, "accuracy": 0.9, "confidence": "high"},
                    {"topic_label": "Jet Streams", "subject_slug": "geography", "syllabus_node_id": 2, "accuracy": 0.65, "confidence": "medium"},
                    {"topic_label": "El Nino", "subject_slug": "geography", "syllabus_node_id": 3, "accuracy": 0.35, "confidence": "high"},
                ]
            },
        )
        assert triage_resp.status_code == 200, triage_resp.text
        triage = triage_resp.json()
        assert triage["counts"] == {
            "solid": 1,
            "rusty": 1,
            "blind_spot": 1,
            "overconfidence_alerts": 1,
        }
        bands = [r["band"] for r in triage["results"]]
        assert bands == ["SOLID", "RUSTY", "BLIND_SPOT"]
        assert triage["results"][2]["overconfidence_alert"] is True

        # Verify tests.py maps plain list of strings to A..D
        tests_resp = client.get(f"/api/v1/tests/{test_id}/questions")
        assert tests_resp.status_code == 200, tests_resp.text
        q_data = tests_resp.json()["data"][0]
        assert [o["id"] for o in q_data["options"]] == [
            f"{q_id}_opt_A",
            f"{q_id}_opt_B",
            f"{q_id}_opt_C",
            f"{q_id}_opt_D",
        ]
        assert q_data["options"][0]["textHi"] == "अटलांटिक"
    finally:
        _teardown_overrides()
        engine.dispose()


def test_command_center_surgical_repair_cards_for_mcq_and_topic_sources():
    engine, SessionLocal = _make_session_factory()
    db = SessionLocal()
    prev_beta_scope = settings.GS_LMS_BETA_SCOPE
    settings.GS_LMS_BETA_SCOPE = False
    try:
        user = User(id=20, google_uid="repair-u", email="repair@upsc.local", role=RoleEnum.STUDENT)
        subject = Subject(name="Geography")
        gs_subject = GsSubject(id=2, slug="geography", name="GS Geography", display_order=1)
        db.add_all([user, subject, gs_subject])
        db.commit()

        topic = Topic(name="Indian Monsoon", subject_id=subject.id)
        test = Test(title="Repair Test", subject_id=subject.id)
        db.add_all([topic, test])
        db.commit()

        q_mistake = Question(
            test_id=test.id,
            topic_id=topic.id,
            text_en="Which jet stream steers western disturbances into northern India?",
            options_en=["Subtropical Westerly Jet", "Tropical Easterly Jet", "Somali Jet", "Polar Night Jet"],
            correct_option="a",
            explanation_en="The Subtropical Westerly Jet brings winter western disturbances across NW India.",
            status=WorkflowStatusEnum.PUBLISHED,
        )
        db.add(q_mistake)
        db.commit()

        db.add_all([
            RevisionQueue(
                user_id=user.id,
                topic_id=topic.id,
                question_id=q_mistake.id,
                reason="OVERCONFIDENCE_TRAP",
                category="OVERCONFIDENCE_TRAP",
                priority_score=1.5,
                is_overconfident=True,
                mastery_level=0.2,
                next_review_at=datetime.now(timezone.utc) - timedelta(hours=1),
            ),
            RevisionQueue(
                user_id=user.id,
                topic_id=topic.id,
                question_id=None,
                reason="WEAK_TOPIC",
                category="WEAKNESS",
                priority_score=0.5,
                is_overconfident=False,
                mastery_level=0.3,
                next_review_at=datetime.now(timezone.utc) - timedelta(hours=1),
            ),
        ])

        node = GsLmsSyllabusNode(
            id=201,
            subject_id=2,
            title="Plate Tectonics & Seafloor Spreading",
            node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
            weight=1.0,
            display_order=1,
            concept_checklist=["Continental Drift", "Seafloor Spreading"],
            review_status=GsReviewStatusEnum.REVIEWED,
        )
        db.add(node)
        db.flush()

        db.add_all([
            GsLmsContentSection(
                syllabus_node_id=201,
                section_label=GsLmsSectionLabelEnum.BASIC,
                title="Core Mechanism",
                blocks=[
                    {
                        "type": "text",
                        "content": "Driven by **mantle convection** and **subduction zones** at convergent boundaries.",
                    },
                    {
                        "type": "diagram",
                        "title": "Mid-Oceanic Ridge Profile",
                    },
                ],
                display_order=1,
                review_status=GsReviewStatusEnum.REVIEWED,
                authored=True,
            ),
            GsLmsMcqQuestion(
                id=501,
                syllabus_node_id=201,
                question_text="Where is new oceanic crust primarily created?",
                options=[
                    {"label": "A", "text": "Mid-ocean ridges"},
                    {"label": "B", "text": "Deep ocean trenches"},
                    {"label": "C", "text": "Transform faults"},
                    {"label": "D", "text": "Continental shields"},
                ],
                correct_option="a",
                explanation="Divergent boundaries at mid-ocean ridges form new oceanic lithosphere.",
                question_type=GsLmsQuestionTypeEnum.FACTUAL,
                display_order=1,
                review_status=GsReviewStatusEnum.REVIEWED,
            ),
            GsLmsRevisitSchedule(
                student_id=user.id,
                syllabus_node_id=201,
                due_date=date.today() - timedelta(days=1),
                revisit_type="day_3",
                completed=False,
            ),
        ])

        ps = GsLmsPracticeSession(
            student_id=user.id,
            syllabus_node_id=201,
            status=GsLmsPracticeSessionStatusEnum.SUBMITTED,
            total_questions=3,
        )
        db.add(ps)
        db.flush()
        db.add_all([
            GsLmsPracticeAttempt(session_id=ps.id, question_id=501, student_id=user.id, is_correct=False),
            GsLmsPracticeAttempt(session_id=ps.id, question_id=501, student_id=user.id, is_correct=False),
            GsLmsPracticeAttempt(session_id=ps.id, question_id=501, student_id=user.id, is_correct=True),
        ])
        db.commit()
        q_mistake_id = q_mistake.id
        db.refresh(user)
    finally:
        db.close()

    client = _client_for(SessionLocal, user)
    try:
        resp = client.get("/api/v1/revision/command-center")
        assert resp.status_code == 200, resp.text
        queue = resp.json()["priority_queue"]

        rq_with_q = next(item for item in queue if item["source"] == "revision_queue" and item["question_id"] == q_mistake_id)
        rq_without_q = next(item for item in queue if item["source"] == "revision_queue" and item["question_id"] is None)
        revisit_item = next(item for item in queue if item["source"] == "topic_revisit")
        weak_item = next(item for item in queue if item["source"] == "weak_topic")

        assert rq_without_q["repair_card"] is None

        mcq_card = rq_with_q["repair_card"]
        assert mcq_card is not None
        assert mcq_card["kind"] == "mcq_mistake"
        assert mcq_card["question_id"] == q_mistake_id
        assert mcq_card["question_text"] == "Which jet stream steers western disturbances into northern India?"
        assert [o["id"] for o in mcq_card["options"]] == ["A", "B", "C", "D"]
        assert [o["text"] for o in mcq_card["options"]] == [
            "Subtropical Westerly Jet",
            "Tropical Easterly Jet",
            "Somali Jet",
            "Polar Night Jet",
        ]
        assert mcq_card["correct_option"] == "A"
        assert mcq_card["explanation"] == "The Subtropical Westerly Jet brings winter western disturbances across NW India."
        assert mcq_card["concept_bullets"] == []

        for topic_item in (revisit_item, weak_item):
            card = topic_item["repair_card"]
            assert card is not None
            assert card["kind"] == "topic_concept"
            assert card["question_id"] == 501
            assert card["question_text"] == "Where is new oceanic crust primarily created?"
            assert [o["id"] for o in card["options"]] == ["A", "B", "C", "D"]
            assert [o["text"] for o in card["options"]] == [
                "Mid-ocean ridges",
                "Deep ocean trenches",
                "Transform faults",
                "Continental shields",
            ]
            assert card["correct_option"] == "A"
            assert card["explanation"] == "Divergent boundaries at mid-ocean ridges form new oceanic lithosphere."
            assert card["concept_bullets"][:2] == ["Continental Drift", "Seafloor Spreading"]
            assert "mantle convection" in card["concept_bullets"]
            assert "subduction zones" in card["concept_bullets"]
            assert "mid-oceanic ridge profile" in card["concept_bullets"]
            assert len(card["concept_bullets"]) == 5
    finally:
        settings.GS_LMS_BETA_SCOPE = prev_beta_scope
        _teardown_overrides()
        engine.dispose()
