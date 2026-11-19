"""Tests for Phase 3 Slice A: Paraphrase-Resilient Active-Recall Scoring
and Adaptive Topic Revisit Scheduling.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.funnel_models import GsLmsRecallAttempt
from app.core.gs_lms.models import (
    GsLmsContentSection,
    GsLmsNodeTypeEnum,
    GsLmsSectionLabelEnum,
    GsLmsSyllabusNode,
)
from app.core.gs_lms.recall_scoring import (
    _STOPWORDS,
    _stem_token,
    score_recall,
)
from app.core.gs_lms.revisit import schedule_adaptive_revisit, schedule_revisits
from app.core.gs_lms.student_models import GsLmsRevisitSchedule
from app.db.session import Base, get_db
from app.main import app
from app.models.domain import RoleEnum, User


# ---------------------------------------------------------------------------
# 1. Strategy 4: Stemmed Content-Token Paraphrase Match
# ---------------------------------------------------------------------------


class TestParaphraseRecallScoring:
    """Verify morphological & paraphrase concept matching in score_recall."""

    def test_subducting_oceanic_plates_matches_subduction_of_oceanic_plate(self):
        result = score_recall(
            transcript="We observed subducting oceanic plates along the trench.",
            key_concepts=["subduction of oceanic plate"],
        )
        assert result.total_concepts == 1
        assert result.matched_count == 1
        assert result.recall_score == 1.0
        assert result.concepts[0].matched is True
        assert result.concepts[0].matched_fragment is not None

    def test_orographic_rainfall_patterns_matches_orographic_rains(self):
        result = score_recall(
            transcript="The Western Ghats experience heavy orographic rainfall patterns during monsoon.",
            key_concepts=["orographic rains"],
        )
        assert result.total_concepts == 1
        assert result.matched_count == 1
        assert result.recall_score == 1.0
        assert result.concepts[0].matched is True
        assert "orographic" in (result.concepts[0].matched_fragment or "")
        assert "rain" in (result.concepts[0].matched_fragment or "")

    def test_unrelated_text_still_scores_zero(self):
        result = score_recall(
            transcript="Monetary policy committee adjusted repo rates for banking liquidity.",
            key_concepts=[
                "subduction of oceanic plate",
                "orographic rains",
                "continental drift theory",
            ],
        )
        assert result.matched_count == 0
        assert result.recall_score == 0.0
        assert all(not c.matched for c in result.concepts)

    def test_single_content_stem_paraphrase_match_and_min_length_guard(self):
        # Single stem with len >= 4 matches morphological variant
        matched_res = score_recall(
            transcript="Rapidly urbanizing corridors in coastal regions.",
            key_concepts=["urbanization"],
        )
        assert matched_res.matched_count == 1
        assert matched_res.recall_score == 1.0

        # Short single stem (len < 4) must not false-match via Strategy 4
        short_res = score_recall(
            transcript="The icy air mass moved south.",
            key_concepts=["ice"],
        )
        assert short_res.matched_count == 0
        assert short_res.recall_score == 0.0

    def test_four_or_more_content_stems_uses_0_6_threshold(self):
        # 4 non-stopword content tokens: "tropical", "cyclonic", "circulation", "movements"
        # Transcript matches 3 of 4 stems ("tropic", "cyclonic", "move") -> 3/4 = 0.75 >= 0.6
        result = score_recall(
            transcript="Tropic cyclonic systems show strong vertical movement.",
            key_concepts=["tropical cyclonic circulation movements"],
        )
        assert result.matched_count == 1
        assert result.recall_score == 1.0

    def test_stem_token_suffix_stripping(self):
        assert "of" in _STOPWORDS
        assert "the" in _STOPWORDS
        assert _stem_token("educational") == "educate"
        assert _stem_token("urbanization") == _stem_token("urbanizing")
        assert _stem_token("oxidising") == "oxidise"
        assert _stem_token("movements") == _stem_token("movement")
        assert _stem_token("boundaries") == "boundary"
        assert _stem_token("continental") == "continent"
        assert _stem_token("subduction") == _stem_token("subducting")
        assert _stem_token("plates") == _stem_token("plate")


# ---------------------------------------------------------------------------
# 2. Adaptive Revisit Scheduling & Endpoints
# ---------------------------------------------------------------------------


@pytest.fixture()
def adaptive_engine():
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
        "gs_lms_content_sections",
        "gs_lms_recall_attempts",
        "gs_lms_revisit_schedule",
    }
    tables = [
        table for name, table in Base.metadata.tables.items() if name in table_names
    ]
    Base.metadata.create_all(engine, tables=tables)
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    session = TestSession()
    try:
        session.add(
            User(
                id=1,
                google_uid="adaptive-student-uid",
                email="adaptive@upsc.local",
                full_name="Adaptive Student",
                role=RoleEnum.STUDENT,
            )
        )
        session.add(
            GsSubject(id=1, slug="geography", name="GS Geography", display_order=1)
        )
        session.add(
            GsLmsSyllabusNode(
                id=30,
                subject_id=1,
                title="Plate Tectonics & Orographic Rain",
                node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
                weight=1.0,
                display_order=1,
                review_status=GsReviewStatusEnum.REVIEWED,
            )
        )
        session.add(
            GsLmsContentSection(
                id=10,
                syllabus_node_id=30,
                section_label=GsLmsSectionLabelEnum.BASIC,
                title="Basic Tectonics",
                blocks=[
                    {
                        "type": "text",
                        "content": (
                            "Key processes include **subduction of oceanic plate**, "
                            "**orographic rains**, **continental drift**, "
                            "**seafloor spreading**, and **convection currents**."
                        ),
                    }
                ],
                display_order=1,
                review_status=GsReviewStatusEnum.REVIEWED,
                authored=True,
            )
        )
        session.commit()
    finally:
        session.close()

    yield engine, TestSession
    engine.dispose()


@pytest.fixture()
def client(adaptive_engine):
    _, TestSession = adaptive_engine

    def override_get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    class FakeUser:
        id = 1
        email = "adaptive@upsc.local"
        google_uid = "adaptive-student-uid"
        role = RoleEnum.STUDENT

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: FakeUser()
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_current_user, None)


class TestAdaptiveRevisitScheduling:
    """Verify schedule_adaptive_revisit unit behavior and DB idempotency."""

    def test_schedule_adaptive_revisit_plus_1d_and_plus_3d_and_idempotent_update(
        self, adaptive_engine
    ):
        _, TestSession = adaptive_engine
        db = TestSession()
        today = date.today()
        try:
            # 1. Weak score (< 0.6) -> +1d
            row_weak = schedule_adaptive_revisit(
                db, student_id=1, syllabus_node_id=30, recall_score=0.4
            )
            db.commit()
            assert row_weak is not None
            assert row_weak.revisit_type == "adaptive"
            assert row_weak.due_date == today + timedelta(days=1)
            assert row_weak.completed is False

            # Mark it completed first to verify re-scheduling resets completed state
            row_weak.completed = True
            row_weak.completed_at = datetime.now(timezone.utc)
            db.commit()

            # 2. Moderate score (0.6 <= score < 0.8) -> updates same row idempotently to +3d
            row_mod = schedule_adaptive_revisit(
                db, student_id=1, syllabus_node_id=30, recall_score=0.65
            )
            db.commit()
            assert row_mod is not None
            assert row_mod.id == row_weak.id
            assert row_mod.due_date == today + timedelta(days=3)
            assert row_mod.completed is False
            assert row_mod.completed_at is None

            # Verify only 1 adaptive row exists in DB
            count = (
                db.query(GsLmsRevisitSchedule)
                .filter_by(student_id=1, syllabus_node_id=30, revisit_type="adaptive")
                .count()
            )
            assert count == 1

            # 3. With previous_score supplied, uses compute_next_interval
            row_next = schedule_adaptive_revisit(
                db,
                student_id=1,
                syllabus_node_id=30,
                recall_score=0.85,
                previous_score=0.65,
            )
            db.commit()
            assert row_next is not None
            assert row_next.id == row_weak.id
            assert row_next.due_date == today + timedelta(days=4)

            # 4. Fixed schedule_revisits (day_3, day_7, day_21) remains 100% intact
            fixed_rows = schedule_revisits(db, student_id=1, syllabus_node_id=30)
            db.commit()
            assert len(fixed_rows) == 3
            assert {r.revisit_type for r in fixed_rows} == {"day_3", "day_7", "day_21"}
        finally:
            db.close()

    def test_schedule_adaptive_revisit_returns_none_when_table_missing(self):
        engine = create_engine(
            "sqlite:///:memory:",
            future=True,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        # Create only users table, omitting gs_lms_revisit_schedule
        Base.metadata.create_all(engine, tables=[Base.metadata.tables["users"]])
        PartialSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
        db = PartialSession()
        try:
            result = schedule_adaptive_revisit(
                db, student_id=1, syllabus_node_id=30, recall_score=0.3
            )
            assert result is None
        finally:
            db.close()
            engine.dispose()


class TestRecallAndRevisitEndpointsAdaptiveWiring:
    """Verify API endpoints wire paraphrase recall scoring into adaptive revisits."""

    def test_submit_recall_text_schedules_adaptive_revisit_when_score_below_0_8(
        self, client, adaptive_engine
    ):
        _, TestSession = adaptive_engine
        today = date.today()

        # Section has 5 concepts. Paraphrasing 1 concept ("subducting oceanic plates")
        # yields recall_score = 1/5 = 0.20 (< 0.6) -> schedules +1d adaptive revisit.
        resp_weak = client.post(
            "/api/v1/gs-lms/geography/funnel/30/recall/text",
            json={
                "section_label": "BASIC",
                "text": "Trench zones feature subducting oceanic plates.",
            },
        )
        assert resp_weak.status_code == 200, resp_weak.text
        body_weak = resp_weak.json()
        assert body_weak["recall_score"] == 20
        assert body_weak["matched_count"] == 1

        db = TestSession()
        try:
            sched = (
                db.query(GsLmsRevisitSchedule)
                .filter_by(student_id=1, syllabus_node_id=30, revisit_type="adaptive")
                .one_or_none()
            )
            assert sched is not None
            assert sched.due_date == today + timedelta(days=1)
            assert sched.completed is False
        finally:
            db.close()

        # Matching 3 of 5 concepts (0.60, in [0.6, 0.8)) -> updates adaptive revisit to +3d
        resp_mod = client.post(
            "/api/v1/gs-lms/geography/funnel/30/recall/text",
            json={
                "section_label": "BASIC",
                "text": (
                    "Subducting oceanic plates and orographic rainfall patterns "
                    "combine with continental drift."
                ),
            },
        )
        assert resp_mod.status_code == 200, resp_mod.text
        body_mod = resp_mod.json()
        assert body_mod["recall_score"] == 60
        assert body_mod["matched_count"] == 3

        db = TestSession()
        try:
            sched = (
                db.query(GsLmsRevisitSchedule)
                .filter_by(student_id=1, syllabus_node_id=30, revisit_type="adaptive")
                .one()
            )
            assert sched.due_date == today + timedelta(days=3)
        finally:
            db.close()

    def test_submit_recall_text_does_not_schedule_adaptive_when_score_at_least_0_8(
        self, client, adaptive_engine
    ):
        _, TestSession = adaptive_engine

        # Matching all 5 of 5 concepts (1.0 >= 0.8) -> no adaptive revisit created
        resp_high = client.post(
            "/api/v1/gs-lms/geography/funnel/30/recall/text",
            json={
                "section_label": "BASIC",
                "text": (
                    "Subducting oceanic plates, orographic rainfall patterns, "
                    "continental drift, seafloor spreading, and convection currents."
                ),
            },
        )
        assert resp_high.status_code == 200, resp_high.text
        assert resp_high.json()["recall_score"] == 100

        db = TestSession()
        try:
            sched = (
                db.query(GsLmsRevisitSchedule)
                .filter_by(student_id=1, syllabus_node_id=30, revisit_type="adaptive")
                .one_or_none()
            )
            assert sched is None
        finally:
            db.close()

    def test_complete_revisit_optional_recall_score_parameter(
        self, client, adaptive_engine
    ):
        _, TestSession = adaptive_engine
        today = date.today()

        db = TestSession()
        try:
            db.add_all(
                [
                    GsLmsRevisitSchedule(
                        id=101,
                        student_id=1,
                        syllabus_node_id=30,
                        due_date=today - timedelta(days=1),
                        revisit_type="day_3",
                        completed=False,
                    ),
                    GsLmsRevisitSchedule(
                        id=102,
                        student_id=1,
                        syllabus_node_id=30,
                        due_date=today - timedelta(days=1),
                        revisit_type="day_7",
                        completed=False,
                    ),
                ]
            )
            db.commit()
        finally:
            db.close()

        # 1. Default behavior without recall_score creates no adaptive row
        r1 = client.post("/api/v1/gs-lms/geography/revisits/101/complete")
        assert r1.status_code == 200, r1.text
        assert r1.json()["data"]["completed"] is True

        db = TestSession()
        try:
            adaptive = (
                db.query(GsLmsRevisitSchedule)
                .filter_by(student_id=1, syllabus_node_id=30, revisit_type="adaptive")
                .one_or_none()
            )
            assert adaptive is None
        finally:
            db.close()

        # 2. Passing recall_score=0.45 schedules an adaptive revisit at +1d
        r2 = client.post(
            "/api/v1/gs-lms/geography/revisits/102/complete?recall_score=0.45"
        )
        assert r2.status_code == 200, r2.text
        assert r2.json()["data"]["completed"] is True

        db = TestSession()
        try:
            adaptive = (
                db.query(GsLmsRevisitSchedule)
                .filter_by(student_id=1, syllabus_node_id=30, revisit_type="adaptive")
                .one_or_none()
            )
            assert adaptive is not None
            assert adaptive.due_date == today + timedelta(days=1)
            assert adaptive.completed is False
        finally:
            db.close()
