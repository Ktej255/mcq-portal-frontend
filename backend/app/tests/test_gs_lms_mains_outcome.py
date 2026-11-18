"""Tests for the honest Mains outcome estimate.

The band exists to answer "where do my written answers stand?" without turning
three machine-scored answers into a selection promise. These tests pin the
honesty rules: no band below three distinct questions, duplicates count once,
incomplete reports are excluded, marks project only onto papers with evidence,
and confidence rises only with a genuinely wider evidence base.
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

from app.core.gs_lms import models as gs_lms_models  # noqa: F401
from app.core.gs_lms import student_models as gs_lms_student_models  # noqa: F401
from app.core.gs import models as gs_models  # noqa: F401
from app.models import domain as domain_models  # noqa: F401

from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.mains_outcome import (
    MARKS_PER_GS_PAPER,
    MIN_DISTINCT_QUESTIONS,
    get_mains_outcome,
)
from app.core.gs_lms.models import (
    GsLmsAnswerAttempt,
    GsLmsAnswerAttemptStatusEnum,
    GsLmsAnswerModeEnum,
    GsLmsEvaluationReport,
    GsLmsExamTypeEnum,
    GsLmsNodeTypeEnum,
    GsLmsPaperEnum,
    GsLmsPyq,
    GsLmsSyllabusNode,
)

STUDENT_ID = 1


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


@pytest.fixture()
def seeded(session_factory):
    db = session_factory()
    try:
        db.add_all(
            [
                GsSubject(id=1, slug="geography", name="Geography", display_order=1),
                GsSubject(id=2, slug="history", name="History", display_order=2),
            ]
        )
        db.flush()
        db.add(
            GsLmsSyllabusNode(
                id=10,
                subject_id=1,
                title="Mains topic",
                node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
                weight=1.0,
                display_order=1,
                review_status=GsReviewStatusEnum.REVIEWED,
            )
        )
        db.flush()
        # Commit: API tests resolve the subject in a separate session.
        db.commit()
    finally:
        db.close()
    return {"subject_id": 1, "other_subject_id": 2}


def _add_question(db, pyq_id: int, subject_id: int = 1) -> None:
    db.add(
        GsLmsPyq(
            id=pyq_id,
            subject_id=subject_id,
            syllabus_node_id=10,
            exam_type=GsLmsExamTypeEnum.MAINS,
            year=2024,
            gs_paper=GsLmsPaperEnum.GS1,
            question_text=f"Question {pyq_id}",
            marks=10,
            review_status=GsReviewStatusEnum.REVIEWED,
        )
    )


def _add_scored_answer(
    db,
    attempt_id: int,
    pyq_id: int,
    marks: float,
    max_marks: int = 10,
    paper: GsLmsPaperEnum | None = GsLmsPaperEnum.GS1,
    *,
    status: GsLmsAnswerAttemptStatusEnum = GsLmsAnswerAttemptStatusEnum.EVALUATED,
    incomplete: list[str] | None = None,
) -> None:
    db.add(
        GsLmsAnswerAttempt(
            id=attempt_id,
            student_id=STUDENT_ID,
            pyq_id=pyq_id,
            gs_paper=paper,
            question_text=f"Question {pyq_id}",
            max_marks=max_marks,
            mode=GsLmsAnswerModeEnum.TYPED,
            status=status,
        )
    )
    db.add(
        GsLmsEvaluationReport(
            id=attempt_id,
            attempt_id=attempt_id,
            student_id=STUDENT_ID,
            marks_awarded=marks,
            max_marks=max_marks,
            incomplete_sections=incomplete or [],
        )
    )


def _seed_answers(session_factory, answers):
    """answers: (attempt_id, pyq_id, marks, max_marks, paper, kwargs)"""
    db = session_factory()
    try:
        seen_questions: set[int] = set()
        for answer in answers:
            attempt_id, pyq_id, marks, max_marks, paper, options = answer
            if pyq_id not in seen_questions and db.get(GsLmsPyq, pyq_id) is None:
                _add_question(db, pyq_id)
                seen_questions.add(pyq_id)
            _add_scored_answer(
                db, attempt_id, pyq_id, marks, max_marks, paper, **options
            )
        db.commit()
    finally:
        db.close()


def _outcome(session_factory):
    db = session_factory()
    try:
        return get_mains_outcome(db, STUDENT_ID, 1)
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Evidence threshold
# ---------------------------------------------------------------------------


class TestEvidenceThreshold:
    def test_no_answers_reports_insufficient_not_zero(self, session_factory, seeded):
        result = _outcome(session_factory)
        assert result["available"] is False
        assert result["band"] is None
        assert result["projection"] is None
        assert result["answers_evaluated"] == 0
        assert result["confidence"]["level"] == "insufficient"
        assert "never as zero marks" in result["reason"]

    def test_two_answers_are_still_insufficient(self, session_factory, seeded):
        _seed_answers(
            session_factory,
            [
                (1, 101, 6, 10, GsLmsPaperEnum.GS1, {}),
                (2, 102, 8, 10, GsLmsPaperEnum.GS1, {}),
            ],
        )
        result = _outcome(session_factory)
        assert result["available"] is False
        assert result["answers_evaluated"] == 2
        assert result["minimum_questions"] == MIN_DISTINCT_QUESTIONS
        assert "1 more scored Mains answer" in result["reason"]

    def test_three_answers_produce_a_widened_band(self, session_factory, seeded):
        _seed_answers(
            session_factory,
            [
                (1, 101, 4, 10, GsLmsPaperEnum.GS1, {}),
                (2, 102, 7, 10, GsLmsPaperEnum.GS1, {}),
                (3, 103, 8, 10, GsLmsPaperEnum.GS1, {}),
            ],
        )
        result = _outcome(session_factory)
        assert result["available"] is True
        assert result["band"] == {
            "low_pct": 35.0,
            "expected_pct": 63.3,
            "high_pct": 85.0,
            "observed_min_pct": 40.0,
            "observed_max_pct": 80.0,
        }
        assert result["projection"]["covered_marks"] == MARKS_PER_GS_PAPER
        assert result["projection"]["per_paper"] == [
            {
                "paper": "GS1",
                "answers": 3,
                "out_of": 250,
                "low_marks": 87.5,
                "expected_marks": 158.2,
                "high_marks": 212.5,
            }
        ]


# ---------------------------------------------------------------------------
# Evidence quality rules
# ---------------------------------------------------------------------------


class TestEvidenceQuality:
    def test_repeat_attempts_count_once_and_use_the_latest(
        self, session_factory, seeded
    ):
        _seed_answers(
            session_factory,
            [
                # Same question twice: the 8/10 rewrite must replace the 1/10.
                (1, 101, 1, 10, GsLmsPaperEnum.GS1, {}),
                (2, 101, 8, 10, GsLmsPaperEnum.GS1, {}),
                (3, 102, 7, 10, GsLmsPaperEnum.GS1, {}),
                (4, 103, 8, 10, GsLmsPaperEnum.GS1, {}),
            ],
        )
        result = _outcome(session_factory)
        assert result["answers_evaluated"] == 3
        assert result["submitted_answers"] == 4
        assert result["excluded_duplicate_attempts"] == 1
        # 80, 70, 80 -> expected 76.7, not dragged down by the old 10%.
        assert result["band"]["expected_pct"] == 76.7
        assert result["band"]["observed_min_pct"] == 70.0

    def test_incomplete_reports_are_excluded(self, session_factory, seeded):
        _seed_answers(
            session_factory,
            [
                (1, 101, 4, 10, GsLmsPaperEnum.GS1, {}),
                (2, 102, 7, 10, GsLmsPaperEnum.GS1, {}),
                (3, 103, 8, 10, GsLmsPaperEnum.GS1, {}),
                (
                    4,
                    104,
                    10,
                    10,
                    GsLmsPaperEnum.GS1,
                    {"incomplete": ["value_addition"]},
                ),
            ],
        )
        result = _outcome(session_factory)
        assert result["excluded_incomplete_reports"] == 1
        assert result["answers_evaluated"] == 3
        assert result["band"]["observed_max_pct"] == 80.0

    def test_projection_covers_only_papers_with_evidence(
        self, session_factory, seeded
    ):
        _seed_answers(
            session_factory,
            [
                (1, 101, 4, 10, GsLmsPaperEnum.GS1, {}),
                (2, 102, 5, 10, GsLmsPaperEnum.GS1, {}),
                (3, 103, 6, 10, GsLmsPaperEnum.GS1, {}),
                (4, 104, 6, 10, GsLmsPaperEnum.GS2, {}),
                (5, 105, 7, 10, GsLmsPaperEnum.GS2, {}),
                (6, 106, 8, 10, GsLmsPaperEnum.GS2, {}),
            ],
        )
        result = _outcome(session_factory)
        assert result["projection"]["covered_papers"] == ["GS1", "GS2"]
        assert result["projection"]["covered_marks"] == 500
        assert result["projection"]["expected_marks"] == 300.0
        assert result["confidence"]["level"] == "low"

    def test_unmapped_paper_still_informs_percentage_band(
        self, session_factory, seeded
    ):
        _seed_answers(
            session_factory,
            [
                (1, 101, 4, 10, GsLmsPaperEnum.GS1, {}),
                (2, 102, 5, 10, GsLmsPaperEnum.GS1, {}),
                (3, 103, 8, 10, None, {}),
            ],
        )
        result = _outcome(session_factory)
        assert result["answers_evaluated"] == 3
        assert result["unknown_paper_answers"] == 1
        assert result["projection"]["covered_papers"] == ["GS1"]
        assert result["band"]["observed_max_pct"] == 80.0
        assert any("not tied to a GS paper" in caveat for caveat in result["caveats"])

    def test_confidence_rises_only_with_spread_evidence(
        self, session_factory, seeded
    ):
        tight = [60, 61, 62, 63, 64, 65]
        answers = []
        attempt_id = 0
        pyq_id = 100
        for paper in (GsLmsPaperEnum.GS1, GsLmsPaperEnum.GS2):
            for marks in tight:
                attempt_id += 1
                pyq_id += 1
                answers.append((attempt_id, pyq_id, marks, 100, paper, {}))
        _seed_answers(session_factory, answers)
        result = _outcome(session_factory)
        assert result["answers_evaluated"] == 12
        assert result["papers_with_evidence"] == 2
        assert result["confidence"]["level"] == "moderate"

    def test_answers_on_another_subject_are_ignored(self, session_factory, seeded):
        db = session_factory()
        try:
            _add_question(db, 201, subject_id=2)
            _add_scored_answer(db, 1, 201, 9, 10, GsLmsPaperEnum.GS1)
            db.commit()
        finally:
            db.close()
        result = _outcome(session_factory)
        assert result["answers_evaluated"] == 0
        assert result["available"] is False

    def test_failed_attempts_are_ignored(self, session_factory, seeded):
        _seed_answers(
            session_factory,
            [
                (1, 101, 4, 10, GsLmsPaperEnum.GS1, {}),
                (2, 102, 7, 10, GsLmsPaperEnum.GS1, {}),
                (
                    3,
                    103,
                    9,
                    10,
                    GsLmsPaperEnum.GS1,
                    {"status": GsLmsAnswerAttemptStatusEnum.FAILED},
                ),
            ],
        )
        result = _outcome(session_factory)
        assert result["answers_evaluated"] == 2


# ---------------------------------------------------------------------------
# API
# ---------------------------------------------------------------------------


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


class TestMainsOutcomeApi:
    def test_returns_insufficient_state_with_next_step(self, client):
        resp = client.get("/api/v1/gs-lms/geography/readiness/mains")
        assert resp.status_code == 200, resp.text
        data = resp.json()["data"]
        assert data["available"] is False
        assert data["next_step"]
        assert data["band"] is None

    def test_returns_band_once_evidence_suffices(self, client, session_factory):
        _seed_answers(
            session_factory,
            [
                (1, 101, 4, 10, GsLmsPaperEnum.GS1, {}),
                (2, 102, 7, 10, GsLmsPaperEnum.GS1, {}),
                (3, 103, 8, 10, GsLmsPaperEnum.GS1, {}),
            ],
        )
        resp = client.get("/api/v1/gs-lms/geography/readiness/mains")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["available"] is True
        assert data["band"]["expected_pct"] == 63.3
        assert data["confidence"]["level"] == "very_low"
