"""Tests for the paid-beta topic scope.

Founder decision: the private paid beta opens only loop-ready Geography
topics. A loop-ready topic has all five reviewed canonical sections, at least
one reviewed PYQ (measured demand), and a complete reviewed 15-question MCQ
Lab. Everything else stays visible on the syllabus map but cannot be entered.

These tests prove the gate is applied at every learner entry point and that
disabling the flag restores the full authoring behaviour (the mechanics suites
deliberately build partial topics).

Requirements traced: beta scope decision, 9.1, 9.2
"""

from __future__ import annotations

from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base, get_db
from app.api.dependencies import get_current_user
from app.main import app
from app.models.domain import RoleEnum

# Ensure all models are registered on Base.metadata
from app.core.gs_lms import models as gs_lms_models  # noqa: F401
from app.core.gs_lms import student_models as gs_lms_student_models  # noqa: F401
from app.core.gs import models as gs_models  # noqa: F401
from app.models import domain as domain_models  # noqa: F401

from app.core.config import settings
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.beta_scope import (
    BETA_LOCKED_MESSAGE,
    CANONICAL_SECTION_LABELS,
    compute_loop_ready_ids,
)
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
from app.core.gs_lms.readiness_service import load_topic_evidence
from app.core.gs_lms.student_models import GsLmsRevisitSchedule

STUDENT_ID = 1

READY_NODE = 200
NO_CURRENT_AFFAIRS_NODE = 201
NO_DEMAND_NODE = 202
SHORT_LAB_NODE = 203


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


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
        t
        for name, t in Base.metadata.tables.items()
        if any(name.startswith(p) for p in relevant_prefixes)
    ]
    Base.metadata.create_all(engine, tables=relevant_tables)
    yield engine
    engine.dispose()


@pytest.fixture()
def session_factory(test_engine):
    return sessionmaker(bind=test_engine, autoflush=False, autocommit=False)


def _add_topic(db, node_id: int, title: str, display_order: int) -> None:
    db.add(
        GsLmsSyllabusNode(
            id=node_id,
            subject_id=1,
            title=title,
            node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
            weight=1.0,
            display_order=display_order,
            review_status=GsReviewStatusEnum.REVIEWED,
        )
    )


def _add_sections(
    db, node_id: int, labels: list[str], *, reviewed: bool, id_offset: int = 0
) -> None:
    for index, label in enumerate(labels):
        db.add(
            GsLmsContentSection(
                id=node_id * 10 + id_offset + index,
                syllabus_node_id=node_id,
                section_label=GsLmsSectionLabelEnum(label),
                title=f"{label.title()} for {node_id}",
                blocks=[{"type": "text", "content": f"{label} content"}],
                display_order=index + 1,
                review_status=(
                    GsReviewStatusEnum.REVIEWED
                    if reviewed
                    else GsReviewStatusEnum.UNREVIEWED
                ),
                authored=reviewed,
            )
        )


def _add_mcqs(db, node_id: int, count: int) -> None:
    for index in range(count):
        db.add(
            GsLmsMcqQuestion(
                id=node_id * 100 + index,
                syllabus_node_id=node_id,
                question_text=f"Question {index} for {node_id}",
                options=[
                    {"label": "A", "text": "Correct"},
                    {"label": "B", "text": "Incorrect"},
                ],
                correct_option="A",
                explanation="Because.",
                question_type=GsLmsQuestionTypeEnum.FACTUAL,
                display_order=index + 1,
                review_status=GsReviewStatusEnum.REVIEWED,
            )
        )


def _add_pyq(
    db,
    node_id: int,
    year: int = 2020,
    exam_type: GsLmsExamTypeEnum = GsLmsExamTypeEnum.PRELIMS,
    id_suffix: int = 9,
) -> None:
    db.add(
        GsLmsPyq(
            id=node_id * 10 + id_suffix,
            subject_id=1,
            syllabus_node_id=node_id,
            exam_type=exam_type,
            year=year,
            question_text=f"PYQ for {node_id}",
            answer_text="Model answer.",
            marks=2,
            question_type=GsLmsQuestionTypeEnum.FACTUAL,
            review_status=GsReviewStatusEnum.REVIEWED,
        )
    )


@pytest.fixture()
def seeded(session_factory):
    """Four reviewed leaves, each failing exactly one paid-beta gate but one.

    * 200 — all five reviewed sections, one reviewed PYQ, 15 reviewed MCQs.
    * 201 — no reviewed CURRENT_AFFAIRS (an UNREVIEWED one must not count).
    * 202 — all sections and MCQs, but no reviewed PYQ (no measured demand).
    * 203 — all sections and a PYQ, but only 14 reviewed MCQs.

    Node 201 deliberately has the lowest display_order so onboarding's default
    selection is observable: unscoped it picks 201, scoped it must pick 200.
    """
    db = session_factory()
    try:
        db.add(GsSubject(id=1, slug="geography", name="GS Geography", display_order=1))
        db.flush()

        _add_topic(db, READY_NODE, "Loop Ready Topic", display_order=2)
        _add_topic(db, NO_CURRENT_AFFAIRS_NODE, "Missing CA Topic", display_order=1)
        _add_topic(db, NO_DEMAND_NODE, "No Demand Topic", display_order=3)
        _add_topic(db, SHORT_LAB_NODE, "Short Lab Topic", display_order=4)

        all_labels = list(CANONICAL_SECTION_LABELS)
        _add_sections(db, READY_NODE, all_labels, reviewed=True)
        _add_sections(
            db,
            NO_CURRENT_AFFAIRS_NODE,
            [label for label in all_labels if label != "CURRENT_AFFAIRS"],
            reviewed=True,
        )
        _add_sections(
            db,
            NO_CURRENT_AFFAIRS_NODE,
            ["CURRENT_AFFAIRS"],
            reviewed=False,
            id_offset=9,
        )
        _add_sections(db, NO_DEMAND_NODE, all_labels, reviewed=True)
        _add_sections(db, SHORT_LAB_NODE, all_labels, reviewed=True)

        _add_pyq(db, READY_NODE)
        _add_pyq(
            db,
            READY_NODE,
            year=2023,
            exam_type=GsLmsExamTypeEnum.MAINS,
            id_suffix=8,
        )
        _add_pyq(db, NO_CURRENT_AFFAIRS_NODE)
        _add_pyq(db, SHORT_LAB_NODE)

        _add_mcqs(db, READY_NODE, TOTAL_MCQ_LAB_QUESTIONS)
        _add_mcqs(db, NO_CURRENT_AFFAIRS_NODE, TOTAL_MCQ_LAB_QUESTIONS)
        _add_mcqs(db, NO_DEMAND_NODE, TOTAL_MCQ_LAB_QUESTIONS)
        _add_mcqs(db, SHORT_LAB_NODE, TOTAL_MCQ_LAB_QUESTIONS - 1)

        today = date.today()
        db.add_all(
            [
                GsLmsRevisitSchedule(
                    id=1,
                    student_id=STUDENT_ID,
                    syllabus_node_id=READY_NODE,
                    due_date=today,
                    revisit_type="day_3",
                ),
                GsLmsRevisitSchedule(
                    id=2,
                    student_id=STUDENT_ID,
                    syllabus_node_id=NO_CURRENT_AFFAIRS_NODE,
                    due_date=today,
                    revisit_type="day_3",
                ),
            ]
        )
        db.commit()
    finally:
        db.close()

    return {
        "ready": READY_NODE,
        "missing_section": NO_CURRENT_AFFAIRS_NODE,
        "no_demand": NO_DEMAND_NODE,
        "short_lab": SHORT_LAB_NODE,
    }


@pytest.fixture()
def client(session_factory, seeded):
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


@pytest.fixture()
def scope_on(monkeypatch):
    monkeypatch.setattr(settings, "GS_LMS_BETA_SCOPE", True, raising=False)
    return True


@pytest.fixture()
def scope_off(monkeypatch):
    monkeypatch.setattr(settings, "GS_LMS_BETA_SCOPE", False, raising=False)
    return False


# ---------------------------------------------------------------------------
# Gate computation
# ---------------------------------------------------------------------------


class TestLoopReadyComputation:
    def test_only_the_topic_passing_every_gate_is_ready(self, session_factory, seeded):
        db = session_factory()
        try:
            assert compute_loop_ready_ids(db, 1) == {READY_NODE}
        finally:
            db.close()

    def test_empty_subject_returns_no_ready_topics(self, session_factory, seeded):
        db = session_factory()
        try:
            assert compute_loop_ready_ids(db, 999) == set()
        finally:
            db.close()


# ---------------------------------------------------------------------------
# Entry points: locked topics are refused with 409
# ---------------------------------------------------------------------------


class TestLockedTopicEntryPoints:
    def test_topic_sections_are_locked(self, client, seeded, scope_on):
        resp = client.get(
            f"/api/v1/gs-lms/geography/topics/{seeded['missing_section']}/sections"
        )
        assert resp.status_code == 409
        assert resp.json()["detail"] == BETA_LOCKED_MESSAGE

    def test_completing_a_section_on_a_locked_topic_is_refused(
        self, client, seeded, scope_on
    ):
        # Section id for node 201, first label, is node_id * 10 + 0.
        resp = client.post(
            f"/api/v1/gs-lms/geography/topics/{seeded['missing_section']}"
            f"/sections/{seeded['missing_section'] * 10}/complete"
        )
        assert resp.status_code == 409

    def test_practice_start_is_refused(self, client, seeded, scope_on):
        resp = client.post(
            "/api/v1/gs-lms/geography/practice/start",
            json={"syllabus_node_id": seeded["short_lab"]},
        )
        assert resp.status_code == 409
        assert resp.json()["detail"] == BETA_LOCKED_MESSAGE

    def test_funnel_state_is_refused(self, client, seeded, scope_on):
        resp = client.get(
            f"/api/v1/gs-lms/geography/funnel/{seeded['no_demand']}/state"
        )
        assert resp.status_code == 409

    def test_mcq_lab_questions_are_refused(self, client, seeded, scope_on):
        resp = client.get(
            f"/api/v1/gs-lms/geography/funnel/{seeded['no_demand']}"
            "/mcq-lab/questions"
        )
        assert resp.status_code == 409

    def test_ready_topic_is_enterable(self, client, seeded, scope_on):
        resp = client.get(
            f"/api/v1/gs-lms/geography/topics/{seeded['ready']}/sections"
        )
        assert resp.status_code == 200

        practice = client.post(
            "/api/v1/gs-lms/geography/practice/start",
            json={"syllabus_node_id": seeded["ready"]},
        )
        assert practice.status_code == 200


# ---------------------------------------------------------------------------
# Syllabus annotation, revisits, readiness, onboarding
# ---------------------------------------------------------------------------


class TestBetaAwareLearnerSurfaces:
    def test_syllabus_marks_each_leaf_beta_ready(self, client, seeded, scope_on):
        resp = client.get("/api/v1/gs-lms/geography/syllabus")
        assert resp.status_code == 200

        nodes = {
            node["node_id"]: node["beta_ready"]
            for node in resp.json()["data"]["tree"]
        }
        assert nodes[READY_NODE] is True
        assert nodes[NO_CURRENT_AFFAIRS_NODE] is False
        assert nodes[NO_DEMAND_NODE] is False
        assert nodes[SHORT_LAB_NODE] is False

    def test_syllabus_discloses_reviewed_pyq_evidence_per_leaf(
        self, client, seeded, scope_on
    ):
        resp = client.get("/api/v1/gs-lms/geography/syllabus")
        assert resp.status_code == 200

        rows = {node["node_id"]: node for node in resp.json()["data"]["tree"]}
        assert rows[READY_NODE]["prelims_pyq_count"] == 1
        assert rows[READY_NODE]["mains_pyq_count"] == 1
        assert rows[NO_DEMAND_NODE]["prelims_pyq_count"] == 0
        assert rows[NO_DEMAND_NODE]["mains_pyq_count"] == 0
        # Non-leaf nodes never invent demand evidence.
        assert all(
            node["prelims_pyq_count"] == 0 and node["mains_pyq_count"] == 0
            for node in rows.values()
            if node["node_type"] != "LEAF_TOPIC"
        )

    def test_revisits_on_locked_topics_are_not_surfaced(self, client, seeded, scope_on):
        resp = client.get("/api/v1/gs-lms/geography/revisits/due")
        assert resp.status_code == 200

        node_ids = [item["syllabus_node_id"] for item in resp.json()["data"]["revisits"]]
        assert node_ids == [READY_NODE]

    def test_readiness_counts_only_ready_topics(self, session_factory, seeded, scope_on):
        db = session_factory()
        try:
            evidence = load_topic_evidence(db, STUDENT_ID, 1)
        finally:
            db.close()
        assert [item.node_id for item in evidence] == [READY_NODE]

    def test_onboarding_default_skips_locked_topics(self, client, seeded, scope_on):
        # Without the scope, display_order would pick node 201.
        resp = client.post(
            "/api/v1/gs-lms/geography/onboarding/complete",
            json={"bandwidth": 2},
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["first_topic_id"] == READY_NODE

    def test_onboarding_rejects_explicit_locked_topic(self, client, seeded, scope_on):
        resp = client.post(
            "/api/v1/gs-lms/geography/onboarding/complete",
            json={"bandwidth": 2, "first_topic_id": seeded["missing_section"]},
        )
        assert resp.status_code == 422
        assert "not open in the paid beta" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# Flag off: authoring and mechanics keep working
# ---------------------------------------------------------------------------


class TestScopeDisabled:
    def test_locked_topic_content_is_available(self, client, seeded, scope_off):
        resp = client.get(
            f"/api/v1/gs-lms/geography/topics/{seeded['missing_section']}/sections"
        )
        assert resp.status_code == 200

    def test_syllabus_does_not_annotate_beta_ready(self, client, seeded, scope_off):
        resp = client.get("/api/v1/gs-lms/geography/syllabus")
        assert resp.status_code == 200
        assert all(
            node["beta_ready"] is None for node in resp.json()["data"]["tree"]
        )

    def test_all_due_revisits_are_surfaced(self, client, seeded, scope_off):
        resp = client.get("/api/v1/gs-lms/geography/revisits/due")
        assert resp.status_code == 200
        assert len(resp.json()["data"]["revisits"]) == 2

    def test_onboarding_default_uses_first_reviewed_leaf(
        self, client, seeded, scope_off
    ):
        resp = client.post(
            "/api/v1/gs-lms/geography/onboarding/complete",
            json={"bandwidth": 2},
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["first_topic_id"] == NO_CURRENT_AFFAIRS_NODE

    def test_readiness_includes_every_reviewed_topic(
        self, session_factory, seeded, scope_off
    ):
        db = session_factory()
        try:
            evidence = load_topic_evidence(db, STUDENT_ID, 1)
        finally:
            db.close()
        assert {item.node_id for item in evidence} == {
            READY_NODE,
            NO_CURRENT_AFFAIRS_NODE,
            NO_DEMAND_NODE,
            SHORT_LAB_NODE,
        }
