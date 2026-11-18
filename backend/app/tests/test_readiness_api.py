"""API integration tests for the GS readiness endpoints.

Routes under test (mounted at ``/api/v1/gs-lms/{subject}``):

* ``GET  /readiness``           -- evidence-based readiness report
* ``GET  /readiness/trend``     -- persisted daily history
* ``POST /readiness/recompute`` -- admin-only demand/snapshot refresh

The tests run against an in-memory SQLite database seeded with a small
Geography syllabus. They assert the behaviour the product promises:

* no evidence never becomes "weak", "strong", or a celebratory band;
* a band appears only once enough demand has assessment evidence;
* the report separates coverage, depth, performance, demand, and outcome;
* snapshots are one-per-learner-per-subject-per-day and never leak across
  learners;
* recompute is admin-gated and the response contract is stable for the UI.
"""

from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user
from app.core.gs.models import GsReviewStatusEnum, GsSubject
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
from app.core.gs_lms.readiness_models import (
    GsLmsDemandWeight,
    GsLmsReadinessSnapshot,
)
from app.core.gs_lms.student_models import (  # noqa: F401 - registers tables
    GsLmsDiscussionSession,
    GsLmsOnboardingStatus,
    GsLmsPracticeAttempt,
    GsLmsPracticeSession,
    GsLmsPracticeSessionStatusEnum,
    GsLmsRevisitSchedule,
    GsLmsStudentSectionProgress,
)
from app.db.session import Base, get_db
from app.main import app
from app.models.domain import RoleEnum, User

READINESS_URL = "/api/v1/gs-lms/geography/readiness"
TREND_URL = "/api/v1/gs-lms/geography/readiness/trend"
RECOMPUTE_URL = "/api/v1/gs-lms/geography/readiness/recompute"

REQUIRED_TABLES = [
    "users",
    "gs_subjects",
    "gs_day_lessons",
    "gs_lms_syllabus_nodes",
    "gs_lms_content_sections",
    "gs_lms_pyqs",
    "gs_lms_mcq_questions",
    "gs_lms_student_section_progress",
    "gs_lms_practice_sessions",
    "gs_lms_practice_attempts",
    "gs_lms_discussion_sessions",
    "gs_lms_onboarding",
    "gs_lms_revisit_schedule",
    "gs_lms_demand_weights",
    "gs_lms_readiness_snapshots",
]

SECTION_LABELS = [
    GsLmsSectionLabelEnum.BASIC,
    GsLmsSectionLabelEnum.NCERT_LEVEL,
    GsLmsSectionLabelEnum.ADVANCED,
    GsLmsSectionLabelEnum.EXAMINER_TRAPS,
]


# ---------------------------------------------------------------------------
# Seeding
# ---------------------------------------------------------------------------


def _seed_engine(*, with_evidence: bool):
    """Build an isolated database with a three-topic Geography subject.

    Topics:
        30 Continental Drift -- 1 Prelims PYQ (2022), 1 MCQ, all sections done
                                 and 2/2 practice correct when evidence is on.
        31 Plate Tectonics   -- 2 Prelims PYQs (2019, 2021) plus one Mains PYQ
                                 (2023) that must not inflate Prelims demand.
        40 Atmosphere        -- no PYQ mapping, no MCQ; demand prior only.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    relevant_tables = [
        table
        for name, table in Base.metadata.tables.items()
        if name in REQUIRED_TABLES
    ]
    Base.metadata.create_all(engine, tables=relevant_tables)
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    session = TestSession()
    try:
        session.add_all(
            [
                User(
                    id=1,
                    google_uid="student-one",
                    email="student1@upsc.local",
                    full_name="Student One",
                    role=RoleEnum.STUDENT,
                ),
                User(
                    id=2,
                    google_uid="student-two",
                    email="student2@upsc.local",
                    full_name="Student Two",
                    role=RoleEnum.STUDENT,
                ),
                User(
                    id=3,
                    google_uid="admin-three",
                    email="admin@upsc.local",
                    full_name="Admin Three",
                    role=RoleEnum.ADMIN,
                ),
            ]
        )
        session.add(
            GsSubject(id=1, slug="geography", name="GS Geography", display_order=1)
        )
        session.flush()

        session.add_all(
            [
                GsLmsSyllabusNode(
                    id=10,
                    subject_id=1,
                    parent_id=None,
                    title="Geomorphology",
                    node_type=GsLmsNodeTypeEnum.MEGA_TOPIC,
                    weight=1.0,
                    display_order=1,
                    review_status=GsReviewStatusEnum.REVIEWED,
                ),
                GsLmsSyllabusNode(
                    id=20,
                    subject_id=1,
                    parent_id=None,
                    title="Climatology",
                    node_type=GsLmsNodeTypeEnum.MEGA_TOPIC,
                    weight=1.0,
                    display_order=2,
                    review_status=GsReviewStatusEnum.REVIEWED,
                ),
            ]
        )
        session.flush()

        session.add_all(
            [
                GsLmsSyllabusNode(
                    id=30,
                    subject_id=1,
                    parent_id=10,
                    title="Continental Drift",
                    node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
                    weight=0.5,
                    display_order=1,
                    review_status=GsReviewStatusEnum.REVIEWED,
                ),
                GsLmsSyllabusNode(
                    id=31,
                    subject_id=1,
                    parent_id=10,
                    title="Plate Tectonics",
                    node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
                    weight=0.5,
                    display_order=2,
                    review_status=GsReviewStatusEnum.REVIEWED,
                ),
                GsLmsSyllabusNode(
                    id=40,
                    subject_id=1,
                    parent_id=20,
                    title="Atmosphere",
                    node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
                    weight=1.0,
                    display_order=3,
                    review_status=GsReviewStatusEnum.REVIEWED,
                ),
            ]
        )
        session.flush()

        for node_id, base in ((30, 100), (31, 200), (40, 300)):
            for index, label in enumerate(SECTION_LABELS, start=1):
                session.add(
                    GsLmsContentSection(
                        id=base + index,
                        syllabus_node_id=node_id,
                        section_label=label,
                        title=f"Section {label.value}",
                        blocks=[{"type": "text", "content": "..."}],
                        display_order=index,
                        review_status=GsReviewStatusEnum.REVIEWED,
                    )
                )

        session.add_all(
            [
                GsLmsPyq(
                    id=1,
                    subject_id=1,
                    syllabus_node_id=30,
                    exam_type=GsLmsExamTypeEnum.PRELIMS,
                    year=2022,
                    question_text="Continental drift evidence question",
                    review_status=GsReviewStatusEnum.REVIEWED,
                ),
                GsLmsPyq(
                    id=2,
                    subject_id=1,
                    syllabus_node_id=31,
                    exam_type=GsLmsExamTypeEnum.PRELIMS,
                    year=2019,
                    question_text="Plate boundary question",
                    review_status=GsReviewStatusEnum.REVIEWED,
                ),
                GsLmsPyq(
                    id=3,
                    subject_id=1,
                    syllabus_node_id=31,
                    exam_type=GsLmsExamTypeEnum.PRELIMS,
                    year=2021,
                    question_text="Subduction zone question",
                    review_status=GsReviewStatusEnum.REVIEWED,
                ),
                GsLmsPyq(
                    id=4,
                    subject_id=1,
                    syllabus_node_id=31,
                    exam_type=GsLmsExamTypeEnum.MAINS,
                    year=2023,
                    marks=10,
                    question_text="Explain plate tectonics with examples.",
                    review_status=GsReviewStatusEnum.REVIEWED,
                ),
                GsLmsMcqQuestion(
                    id=1,
                    syllabus_node_id=30,
                    question_text="Which evidence supports continental drift?",
                    options=[
                        {"label": "A", "text": "Option A"},
                        {"label": "B", "text": "Option B"},
                        {"label": "C", "text": "Option C"},
                        {"label": "D", "text": "Option D"},
                    ],
                    correct_option="B",
                    question_type=GsLmsQuestionTypeEnum.STATEMENT_BASED,
                    display_order=1,
                    review_status=GsReviewStatusEnum.REVIEWED,
                ),
            ]
        )

        if with_evidence:
            session.add(
                GsLmsOnboardingStatus(
                    student_id=1,
                    completed=True,
                    learner_level="beginner",
                )
            )
            for index in range(1, 5):
                session.add(
                    GsLmsStudentSectionProgress(
                        student_id=1,
                        section_id=100 + index,
                        syllabus_node_id=30,
                        completed=True,
                        completed_at=datetime(
                            2026, 1, index, tzinfo=timezone.utc
                        ),
                    )
                )
            session.add(
                GsLmsPracticeSession(
                    id=1,
                    student_id=1,
                    syllabus_node_id=30,
                    status=GsLmsPracticeSessionStatusEnum.SUBMITTED,
                    total_questions=2,
                    current_index=2,
                    started_at=datetime(
                        2026, 1, 5, tzinfo=timezone.utc
                    ),
                    submitted_at=datetime(
                        2026, 1, 5, 0, 30, tzinfo=timezone.utc
                    ),
                )
            )
            session.flush()
            session.add_all(
                [
                    GsLmsPracticeAttempt(
                        id=1,
                        session_id=1,
                        question_id=1,
                        student_id=1,
                        chosen_answer="B",
                        is_correct=True,
                        time_taken_seconds=10.0,
                        question_type=GsLmsQuestionTypeEnum.STATEMENT_BASED,
                    ),
                    GsLmsPracticeAttempt(
                        id=2,
                        session_id=1,
                        question_id=1,
                        student_id=1,
                        chosen_answer="B",
                        is_correct=True,
                        time_taken_seconds=8.0,
                        question_type=GsLmsQuestionTypeEnum.STATEMENT_BASED,
                    ),
                ]
            )

        session.commit()
    finally:
        session.close()

    return engine, TestSession


@pytest.fixture()
def empty_env():
    engine, TestSession = _seed_engine(with_evidence=False)
    yield TestSession, engine
    engine.dispose()


@pytest.fixture()
def seeded_env():
    engine, TestSession = _seed_engine(with_evidence=True)
    yield TestSession, engine
    engine.dispose()


# ---------------------------------------------------------------------------
# Client helpers
# ---------------------------------------------------------------------------


class _FakeUser:
    def __init__(self, user_id: int, role: RoleEnum) -> None:
        self.id = user_id
        self.role = role
        self.email = f"user{user_id}@upsc.local"
        self.google_uid = f"google-{user_id}"


@contextmanager
def _client_for(TestSession, *, user_id: int = 1, role: RoleEnum = RoleEnum.STUDENT):
    def _override_get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    fake_user = _FakeUser(user_id, role)

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user] = lambda: fake_user
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)


def _snapshot_dicts(TestSession):
    db = TestSession()
    try:
        rows = (
            db.query(GsLmsReadinessSnapshot)
            .order_by(
                GsLmsReadinessSnapshot.student_id,
                GsLmsReadinessSnapshot.snapshot_date,
            )
            .all()
        )
        return [
            {
                "student_id": row.student_id,
                "subject_id": row.subject_id,
                "snapshot_date": row.snapshot_date,
                "readiness_score": row.readiness_score,
                "band": row.band,
                "confidence_level": row.confidence_level,
                "assessed_demand_pct": row.assessed_demand_pct,
                "coverage_pct": row.coverage_pct,
                "depth_pct": row.depth_pct,
                "payload": row.payload,
            }
            for row in rows
        ]
    finally:
        db.close()


def _demand_rows(TestSession):
    db = TestSession()
    try:
        return db.query(GsLmsDemandWeight).all()
    finally:
        db.close()


def _utc_today():
    return datetime.now(timezone.utc).date()


# ---------------------------------------------------------------------------
# Response contract
# ---------------------------------------------------------------------------


class TestReadinessContract:
    def test_full_section_contract(self, seeded_env):
        TestSession, _ = seeded_env
        with _client_for(TestSession) as client:
            resp = client.get(READINESS_URL)

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        data = body["data"]

        assert data["subject"] == "geography"
        assert data["model_version"] == "readiness-v1"
        datetime.fromisoformat(data["generated_at"])

        for key in ("summary", "coverage", "depth", "evidence", "topics"):
            assert key in data
        assert "next_actions" in data
        assert "data_quality" in data

        summary = data["summary"]
        assert set(summary) == {
            "readiness_score",
            "band",
            "band_suppressed",
            "confidence",
            "projection",
        }
        assert set(summary["confidence"]) == {
            "level",
            "assessed_demand_pct",
            "demand_mapping_pct",
            "weighted_confidence",
        }
        projection = summary["projection"]
        assert projection["questions"] == 20
        assert set(projection["correct"]) == {"low", "expected", "high"}
        assert set(projection["net_marks"]) == {"low", "expected", "high"}
        assert projection["assumptions"]

        topic = data["topics"][0]
        for field in (
            "node_id",
            "title",
            "mega_topic",
            "demand_score",
            "demand_share_pct",
            "coverage_pct",
            "depth_pct",
            "performance_pct",
            "confidence_pct",
            "status",
            "gap_marks",
            "has_evidence",
            "next_action",
        ):
            assert field in topic
        assert topic["status"] in {
            "UNTOUCHED",
            "IN_PROGRESS",
            "UNVERIFIED",
            "WEAK",
            "DEVELOPING",
            "SECURE",
            "STRONG",
        }

    def test_topics_sorted_by_gap_marks(self, seeded_env):
        TestSession, _ = seeded_env
        with _client_for(TestSession) as client:
            data = client.get(READINESS_URL).json()["data"]

        gaps = [topic["gap_marks"] for topic in data["topics"]]
        assert gaps == sorted(gaps, reverse=True)
        assert data["topics"][0]["node_id"] == 31

    def test_gap_marks_bounded_by_geography_block(self, seeded_env):
        TestSession, _ = seeded_env
        with _client_for(TestSession) as client:
            data = client.get(READINESS_URL).json()["data"]

        score = data["summary"]["readiness_score"]
        gaps = [topic["gap_marks"] for topic in data["topics"]]
        assert all(0.0 <= gap <= 40.0 for gap in gaps)
        # Sum of topic gaps is the whole-block gap implied by the headline.
        assert abs(sum(gaps) - 40.0 * (1.0 - score / 100.0)) < 0.4

    def test_projection_ranges_are_ordered(self, seeded_env):
        TestSession, _ = seeded_env
        with _client_for(TestSession) as client:
            projection = client.get(READINESS_URL).json()["data"]["summary"][
                "projection"
            ]

        correct = projection["correct"]
        net = projection["net_marks"]
        assert correct["low"] <= correct["expected"] <= correct["high"]
        assert net["low"] <= net["expected"] <= net["high"]
        assert 0.0 <= correct["low"] and correct["high"] <= 20.0

    def test_data_quality_reports_mapping_gaps(self, seeded_env):
        TestSession, _ = seeded_env
        with _client_for(TestSession) as client:
            quality = client.get(READINESS_URL).json()["data"]["data_quality"]

        assert quality["topics_total"] == 3
        assert quality["topics_with_pyq"] == 2
        assert quality["topics_without_pyq"] == 1
        assert quality["topics_with_mcq"] == 1
        assert quality["topics_without_mcq"] == 2
        assert abs(quality["demand_mapping_pct"] - 66.7) < 0.1
        assert len(quality["notes"]) == 2


# ---------------------------------------------------------------------------
# No evidence is not failure and not praise
# ---------------------------------------------------------------------------


class TestReadinessWithoutEvidence:
    def test_band_is_suppressed_and_no_topic_is_weak(self, empty_env):
        TestSession, _ = empty_env
        with _client_for(TestSession) as client:
            data = client.get(READINESS_URL).json()["data"]

        summary = data["summary"]
        assert summary["band"] == "INSUFFICIENT_EVIDENCE"
        assert summary["band_suppressed"] is True
        assert summary["confidence"]["level"] == "LOW"
        assert summary["confidence"]["assessed_demand_pct"] == 0.0

        statuses = {topic["status"] for topic in data["topics"]}
        assert statuses == {"UNTOUCHED"}
        assert data["evidence"]["assessed_topics"] == 0
        assert data["coverage"]["demand_weighted_pct"] == 0.0
        assert data["depth"]["demand_weighted_pct"] == 0.0

    def test_every_topic_has_a_start_action(self, empty_env):
        TestSession, _ = empty_env
        with _client_for(TestSession) as client:
            data = client.get(READINESS_URL).json()["data"]

        assert len(data["topics"]) == 3
        for topic in data["topics"]:
            assert topic["has_evidence"] is False
            assert topic["next_action"] == "Start the basic section"
            assert topic["practice_attempts"] == 0

    def test_persist_false_writes_no_snapshot(self, empty_env):
        TestSession, _ = empty_env
        with _client_for(TestSession) as client:
            resp = client.get(READINESS_URL, params={"persist": "false"})
            assert resp.status_code == 200
            assert _snapshot_dicts(TestSession) == []

            trend = client.get(TREND_URL).json()["data"]
            assert trend == []

        # And a normal read does persist.
        with _client_for(TestSession) as client:
            client.get(READINESS_URL)
        assert len(_snapshot_dicts(TestSession)) == 1


# ---------------------------------------------------------------------------
# Evidence produces measured states, not fabricated confidence
# ---------------------------------------------------------------------------


class TestReadinessWithEvidence:
    def test_tested_topic_is_measured_and_others_stay_honest(self, seeded_env):
        TestSession, _ = seeded_env
        with _client_for(TestSession) as client:
            data = client.get(READINESS_URL).json()["data"]

        by_id = {topic["node_id"]: topic for topic in data["topics"]}

        tested = by_id[30]
        assert tested["has_evidence"] is True
        assert tested["status"] == "SECURE"
        assert tested["coverage_pct"] == 100.0
        assert tested["depth_pct"] == 100.0
        assert tested["performance_pct"] == 70.0
        assert 0.0 < tested["confidence_pct"] < 50.0

        for node_id in (31, 40):
            topic = by_id[node_id]
            assert topic["has_evidence"] is False
            assert topic["status"] == "UNTOUCHED"
            assert topic["performance_pct"] < 50.0

        summary = data["summary"]
        assert summary["band"] != "INSUFFICIENT_EVIDENCE"
        assert summary["band_suppressed"] is False
        assert summary["band"] == "DEVELOPING"
        # Two correct answers cover only 35% of demand and 18% topic
        # confidence, so the headline confidence must stay LOW.
        assert summary["confidence"]["level"] == "LOW"
        assert summary["confidence"]["assessed_demand_pct"] < 40.0

    def test_two_correct_answers_are_never_labelled_strong(self, seeded_env):
        TestSession, _ = seeded_env
        with _client_for(TestSession) as client:
            data = client.get(READINESS_URL).json()["data"]

        statuses = {topic["status"] for topic in data["topics"]}
        assert "STRONG" not in statuses
        assert data["summary"]["band"] != "STRONG"

    def test_prelims_only_last_year_ignores_mains_pyq(self, seeded_env):
        TestSession, _ = seeded_env
        with _client_for(TestSession) as client:
            data = client.get(READINESS_URL).json()["data"]

        plate = next(
            topic for topic in data["topics"] if topic["node_id"] == 31
        )
        # Two Prelims PYQs; the Mains 2023 PYQ contributes demand weight but
        # must not be reported as the latest Prelims year.
        assert plate["pyq_count"] == 2
        assert plate["last_pyq_year"] == 2021
        # The Mains contribution is disclosed separately rather than folded
        # silently into demand_share_pct.
        assert plate["mains_pyq_count"] == 1
        assert plate["last_mains_year"] == 2023

    def test_zero_pyq_topic_keeps_prior_demand(self, seeded_env):
        TestSession, _ = seeded_env
        with _client_for(TestSession) as client:
            data = client.get(READINESS_URL).json()["data"]

        atmosphere = next(
            topic for topic in data["topics"] if topic["node_id"] == 40
        )
        assert atmosphere["pyq_count"] == 0
        assert atmosphere["last_pyq_year"] is None
        assert atmosphere["demand_share_pct"] > 0.0
        assert atmosphere["demand_confidence_pct"] == 25.0


# ---------------------------------------------------------------------------
# Persistence, trend, and ownership
# ---------------------------------------------------------------------------


class TestSnapshotsAndTrend:
    def test_read_persists_one_snapshot_per_day(self, seeded_env):
        TestSession, _ = seeded_env
        with _client_for(TestSession) as client:
            first = client.get(READINESS_URL).json()["data"]
            client.get(READINESS_URL)
            client.get(READINESS_URL, params={"persist": "false"})

        rows = _snapshot_dicts(TestSession)
        assert len(rows) == 1
        snapshot = rows[0]
        assert snapshot["student_id"] == 1
        assert snapshot["subject_id"] == 1
        assert snapshot["snapshot_date"] == _utc_today()
        assert snapshot["readiness_score"] == first["summary"]["readiness_score"]
        assert snapshot["band"] == first["summary"]["band"]
        assert snapshot["payload"]["topics"]

    def test_trend_returns_persisted_history_oldest_first(self, seeded_env):
        TestSession, _ = seeded_env
        with _client_for(TestSession) as client:
            today_payload = client.get(READINESS_URL).json()["data"]
            today = _snapshot_dicts(TestSession)[0]["snapshot_date"]

            db = TestSession()
            try:
                db.add(
                    GsLmsReadinessSnapshot(
                        student_id=1,
                        subject_id=1,
                        snapshot_date=today - timedelta(days=1),
                        readiness_score=12.3,
                        band="FOUNDATION",
                        projected_correct_low=4.0,
                        projected_correct_expected=7.0,
                        projected_correct_high=10.0,
                        projected_net_low=0.0,
                        projected_net_expected=3.0,
                        projected_net_high=6.0,
                        confidence_level="LOW",
                        assessed_demand_pct=5.0,
                        coverage_pct=10.0,
                        depth_pct=5.0,
                        payload={"note": "yesterday"},
                    )
                )
                db.commit()
            finally:
                db.close()

            trend = client.get(TREND_URL).json()["data"]

        assert len(trend) == 2
        assert trend[0]["readiness_score"] == 12.3
        assert trend[0]["date"] < trend[1]["date"]
        assert trend[1]["readiness_score"] == today_payload["summary"]["readiness_score"]
        assert trend[1]["band"] == today_payload["summary"]["band"]
        assert trend[1]["projected_correct_expected"] == (
            today_payload["summary"]["projection"]["correct"]["expected"]
        )

    def test_trend_limit_and_validation(self, seeded_env):
        TestSession, _ = seeded_env
        with _client_for(TestSession) as client:
            today_score = client.get(READINESS_URL).json()["data"]["summary"][
                "readiness_score"
            ]
            today = _snapshot_dicts(TestSession)[0]["snapshot_date"]

            db = TestSession()
            try:
                for offset, score in ((1, 11.0), (2, 22.0)):
                    db.add(
                        GsLmsReadinessSnapshot(
                            student_id=1,
                            subject_id=1,
                            snapshot_date=today - timedelta(days=offset),
                            readiness_score=score,
                            band="FOUNDATION",
                            confidence_level="LOW",
                        )
                    )
                db.commit()
            finally:
                db.close()

            limited = client.get(TREND_URL, params={"limit": 2}).json()["data"]
            # Newest two days: today's computed score and yesterday's 11.0,
            # returned oldest first; the day-before snapshot is excluded.
            assert [row["readiness_score"] for row in limited] == [
                11.0,
                today_score,
            ]

            assert client.get(TREND_URL, params={"limit": 0}).status_code == 422
            assert client.get(TREND_URL, params={"limit": 181}).status_code == 422

    def test_snapshots_do_not_leak_across_learners(self, seeded_env):
        TestSession, _ = seeded_env
        with _client_for(TestSession, user_id=1) as client:
            first = client.get(READINESS_URL).json()["data"]

        with _client_for(TestSession, user_id=2) as client:
            second = client.get(READINESS_URL).json()["data"]
            second_trend = client.get(TREND_URL).json()["data"]

        assert first["summary"]["band"] != "INSUFFICIENT_EVIDENCE"
        assert second["summary"]["band"] == "INSUFFICIENT_EVIDENCE"
        assert second["summary"]["confidence"]["assessed_demand_pct"] == 0.0
        assert all(
            topic["practice_attempts"] == 0 for topic in second["topics"]
        )

        rows = _snapshot_dicts(TestSession)
        assert sorted(row["student_id"] for row in rows) == [1, 2]
        by_student = {row["student_id"]: row for row in rows}
        assert by_student[1]["readiness_score"] != by_student[2]["readiness_score"]

        assert len(second_trend) == 1
        assert second_trend[0]["readiness_score"] == (
            second["summary"]["readiness_score"]
        )


# ---------------------------------------------------------------------------
# Admin recompute and demand cache
# ---------------------------------------------------------------------------


class TestRecompute:
    def test_students_cannot_recompute(self, seeded_env):
        TestSession, _ = seeded_env
        with _client_for(TestSession, user_id=1) as client:
            resp = client.post(RECOMPUTE_URL)
        assert resp.status_code == 403

    def test_admin_rebuilds_demand_cache_and_snapshot(self, seeded_env):
        TestSession, _ = seeded_env
        with _client_for(
            TestSession, user_id=3, role=RoleEnum.ADMIN
        ) as client:
            resp = client.post(RECOMPUTE_URL)

        assert resp.status_code == 200
        body = resp.json()
        assert "3 demand rows refreshed" in body["message"]
        assert body["data"]["summary"]["band"] == "INSUFFICIENT_EVIDENCE"

        rows = _demand_rows(TestSession)
        assert len(rows) == 3
        assert abs(sum(row.demand_share for row in rows) - 1.0) < 1e-6
        assert all(row.computed_at is not None for row in rows)

        snapshots = _snapshot_dicts(TestSession)
        assert len(snapshots) == 1
        assert snapshots[0]["student_id"] == 3


# ---------------------------------------------------------------------------
# Auth and subject resolution
# ---------------------------------------------------------------------------


class TestAuthAndResolution:
    def test_requires_authentication(self):
        bare = TestClient(app)
        assert bare.get(READINESS_URL).status_code == 401
        assert bare.get(TREND_URL).status_code == 401
        assert bare.post(RECOMPUTE_URL).status_code == 401

    def test_unknown_subject_returns_404(self, seeded_env):
        TestSession, _ = seeded_env
        with _client_for(TestSession) as client:
            resp = client.get("/api/v1/gs-lms/history/readiness")
        assert resp.status_code == 404
