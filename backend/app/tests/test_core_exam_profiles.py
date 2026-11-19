"""Tests for the Phase 0 ExamProfile configuration and engine parity."""

from __future__ import annotations

import random
from dataclasses import FrozenInstanceError, replace
from datetime import date
from types import SimpleNamespace

import pytest

from app.core.exam_profiles import (
    DEFAULT_EXAM_ID,
    UPSC_CSE_PROFILE,
    ExamProfile,
    get_exam_profile,
    list_exam_profiles,
)
from app.core.gs_lms.mains_outcome import (
    BAND_PADDING_PCT,
    MARKS_PER_GS_PAPER,
    MIN_DISTINCT_QUESTIONS,
    build_mains_outcome,
)
from app.core.gs_lms.mcq_lab_scoring import (
    RECOVERY_THRESHOLD,
    RECOVERY_WINDOW,
    REQUIRED_TYPE_DISTRIBUTION,
    TOTAL_MCQ_LAB_QUESTIONS,
    WEAKNESS_MIN_ATTEMPTS,
    WEAKNESS_THRESHOLD,
    check_weakness_recovery,
    create_attempt,
    get_weak_types,
    score_mcq_lab,
    select_mcq_lab_questions,
)
from app.core.gs_lms.models import GsLmsPaperEnum
from app.core.gs_lms.readiness import (
    BAND_SUPPRESSION_ASSESSED_SHARE,
    CORRECT_MARKS,
    DEMAND_PRIOR,
    DEPTH_WEIGHTS,
    GEOGRAPHY_BLOCK_MARKS,
    GEOGRAPHY_BLOCK_QUESTIONS,
    MAINS_EXAM_WEIGHT,
    PRELIMS_EXAM_WEIGHT,
    PRIOR_STRENGTH,
    RECALL_PSEUDO_OBSERVATIONS,
    RECENCY_HALF_LIFE_YEARS,
    WRONG_MARKS,
    Z_80,
    PyqRef,
    SectionEvidence,
    TopicEvidence,
    build_readiness_report,
    compute_demand_weights,
)

AS_OF = date(2026, 11, 19)


def _sample_topics() -> list[TopicEvidence]:
    return [
        TopicEvidence(
            node_id=1,
            title="Plate Tectonics",
            mega_topic="Geomorphology",
            display_order=1,
            sections=(
                SectionEvidence(11, "BASIC", True),
                SectionEvidence(12, "NCERT_LEVEL", True),
                SectionEvidence(13, "ADVANCED", False),
                SectionEvidence(14, "EXAMINER_TRAPS", False),
            ),
            practice_attempts=10,
            practice_correct=7,
            recall_score=0.8,
            pyqs=(
                PyqRef(2024, "PRELIMS"),
                PyqRef(2023, "MAINS", 15),
            ),
            mcq_count=15,
        ),
        TopicEvidence(
            node_id=2,
            title="Monsoon",
            mega_topic="Climatology",
            display_order=2,
            sections=(
                SectionEvidence(21, "BASIC", True),
                SectionEvidence(22, "NCERT_LEVEL", False),
                SectionEvidence(23, "ADVANCED", False),
                SectionEvidence(24, "EXAMINER_TRAPS", False),
            ),
            practice_attempts=0,
            practice_correct=0,
            pyqs=(PyqRef(2022, "PRELIMS"),),
            mcq_count=15,
        ),
    ]


def _synthetic_profile() -> ExamProfile:
    return replace(
        UPSC_CSE_PROFILE,
        exam_id="synthetic_exam",
        display_name="Synthetic Entrance Exam",
        prelims_exam_weight=2.0,
        mains_exam_weight=0.5,
        block_questions=30,
        block_marks=120.0,
        correct_marks=4.0,
        wrong_marks=1.0,
        depth_weights={
            "BASIC": 0.60,
            "NCERT_LEVEL": 0.20,
            "ADVANCED": 0.10,
            "CURRENT_AFFAIRS": 0.05,
            "EXAMINER_TRAPS": 0.05,
        },
        marks_per_written_paper=100,
        min_distinct_written_questions=2,
        band_padding_pct=10.0,
        mcq_lab_type_distribution={
            "STATEMENT_BASED": 4,
            "FACTUAL": 2,
        },
        total_mcq_lab_questions=6,
        weakness_threshold=0.6,
        weakness_min_attempts=2,
        recovery_threshold=0.8,
        recovery_window=3,
    )


def _mains_rows() -> list[tuple[SimpleNamespace, SimpleNamespace]]:
    return [
        (
            SimpleNamespace(id=1, pyq_id=101, gs_paper=GsLmsPaperEnum.GS1),
            SimpleNamespace(marks_awarded=5.0, max_marks=10),
        ),
        (
            SimpleNamespace(id=2, pyq_id=102, gs_paper=GsLmsPaperEnum.GS1),
            SimpleNamespace(marks_awarded=7.0, max_marks=10),
        ),
    ]


# ---------------------------------------------------------------------------
# Registry & constant parity
# ---------------------------------------------------------------------------


def test_registry_lookup_and_unknown_exam_raises():
    assert DEFAULT_EXAM_ID == "upsc_cse"
    assert get_exam_profile() is UPSC_CSE_PROFILE
    assert get_exam_profile("upsc_cse") is UPSC_CSE_PROFILE
    assert list_exam_profiles() == (UPSC_CSE_PROFILE,)

    with pytest.raises(ValueError, match="Unknown exam profile"):
        get_exam_profile("unknown_exam")

    with pytest.raises(ValueError, match="Unknown exam profile"):
        get_exam_profile("")


def test_exam_profile_is_immutable():
    with pytest.raises(FrozenInstanceError):
        UPSC_CSE_PROFILE.block_marks = 999.0  # type: ignore[misc]

    with pytest.raises(TypeError):
        UPSC_CSE_PROFILE.depth_weights["BASIC"] = 0.99  # type: ignore[index]

    with pytest.raises(TypeError):
        UPSC_CSE_PROFILE.mcq_lab_type_distribution["FACTUAL"] = 99  # type: ignore[index]


def test_exported_module_constants_match_upsc_cse_profile():
    assert DEMAND_PRIOR == 0.25 == UPSC_CSE_PROFILE.demand_prior
    assert RECENCY_HALF_LIFE_YEARS == 6.0 == UPSC_CSE_PROFILE.recency_half_life_years
    assert PRELIMS_EXAM_WEIGHT == 1.0 == UPSC_CSE_PROFILE.prelims_exam_weight
    assert MAINS_EXAM_WEIGHT == 0.15 == UPSC_CSE_PROFILE.mains_exam_weight
    assert PRIOR_STRENGTH == 6.0 == UPSC_CSE_PROFILE.prior_strength
    assert RECALL_PSEUDO_OBSERVATIONS == 4.0 == UPSC_CSE_PROFILE.recall_pseudo_observations
    assert GEOGRAPHY_BLOCK_QUESTIONS == 20 == UPSC_CSE_PROFILE.block_questions
    assert GEOGRAPHY_BLOCK_MARKS == 40.0 == UPSC_CSE_PROFILE.block_marks
    assert CORRECT_MARKS == 2.0 == UPSC_CSE_PROFILE.correct_marks
    assert WRONG_MARKS == pytest.approx(2.0 / 3.0)
    assert WRONG_MARKS == UPSC_CSE_PROFILE.wrong_marks
    assert BAND_SUPPRESSION_ASSESSED_SHARE == 0.25 == UPSC_CSE_PROFILE.band_suppression_assessed_share
    assert Z_80 == 1.28 == UPSC_CSE_PROFILE.z_80
    assert dict(DEPTH_WEIGHTS) == dict(UPSC_CSE_PROFILE.depth_weights)

    assert MIN_DISTINCT_QUESTIONS == 3 == UPSC_CSE_PROFILE.min_distinct_written_questions
    assert MARKS_PER_GS_PAPER == 250 == UPSC_CSE_PROFILE.marks_per_written_paper
    assert BAND_PADDING_PCT == 5.0 == UPSC_CSE_PROFILE.band_padding_pct

    assert dict(REQUIRED_TYPE_DISTRIBUTION) == dict(UPSC_CSE_PROFILE.mcq_lab_type_distribution)
    assert TOTAL_MCQ_LAB_QUESTIONS == 15 == UPSC_CSE_PROFILE.total_mcq_lab_questions
    assert WEAKNESS_THRESHOLD == 0.5 == UPSC_CSE_PROFILE.weakness_threshold
    assert WEAKNESS_MIN_ATTEMPTS == 3 == UPSC_CSE_PROFILE.weakness_min_attempts
    assert RECOVERY_THRESHOLD == 0.7 == UPSC_CSE_PROFILE.recovery_threshold
    assert RECOVERY_WINDOW == 5 == UPSC_CSE_PROFILE.recovery_window


# ---------------------------------------------------------------------------
# 100% parity between default calls and explicit UPSC_CSE_PROFILE calls
# ---------------------------------------------------------------------------


def test_readiness_default_matches_explicit_upsc_profile():
    topics = _sample_topics()
    default_demand = compute_demand_weights(topics, 2026)
    explicit_demand = compute_demand_weights(topics, 2026, profile=UPSC_CSE_PROFILE)
    assert default_demand == explicit_demand

    default_report = build_readiness_report(topics, AS_OF)
    explicit_report = build_readiness_report(topics, AS_OF, profile=UPSC_CSE_PROFILE)
    assert default_report == explicit_report


def test_mains_outcome_default_matches_explicit_upsc_profile():
    rows = _mains_rows() + [
        (
            SimpleNamespace(id=3, pyq_id=103, gs_paper=GsLmsPaperEnum.GS1),
            SimpleNamespace(marks_awarded=8.0, max_marks=10),
        )
    ]
    default_out = build_mains_outcome(rows, submitted_answers=3, excluded_incomplete=0)
    explicit_out = build_mains_outcome(
        rows,
        submitted_answers=3,
        excluded_incomplete=0,
        profile=UPSC_CSE_PROFILE,
    )
    default_out.pop("generated_at")
    explicit_out.pop("generated_at")
    assert default_out == explicit_out


def test_mcq_lab_default_matches_explicit_upsc_profile():
    attempts = [
        create_attempt(i, "STATEMENT_BASED", "A", "A" if i % 2 == 0 else "B")
        for i in range(15)
    ]
    assert score_mcq_lab(attempts) == score_mcq_lab(attempts, profile=UPSC_CSE_PROFILE)

    pattern = {"STATEMENT_BASED": (1, 3), "FACTUAL": (2, 3)}
    assert get_weak_types(pattern) == get_weak_types(pattern, profile=UPSC_CSE_PROFILE)

    recovery_attempts = [
        create_attempt(i, "STATEMENT_BASED", "A", "A" if i < 4 else "B")
        for i in range(5)
    ]
    assert check_weakness_recovery(recovery_attempts, "STATEMENT_BASED") is check_weakness_recovery(
        recovery_attempts,
        "STATEMENT_BASED",
        profile=UPSC_CSE_PROFILE,
    )

    bank = [
        SimpleNamespace(id=i, question_type=qtype)
        for i, qtype in enumerate(
            ["STATEMENT_BASED"] * 5
            + ["ASSERTION_REASON"] * 3
            + ["MATCH_THE_FOLLOWING"] * 3
            + ["CAUSE_EFFECT"] * 3
            + ["CHRONOLOGICAL"] * 3
            + ["FACTUAL"] * 3
            + ["MAP_BASED"] * 2
        )
    ]
    sel_default = select_mcq_lab_questions(
        bank,
        lambda q: q.question_type,
        rng=random.Random(42),
    )
    sel_explicit = select_mcq_lab_questions(
        bank,
        lambda q: q.question_type,
        profile=UPSC_CSE_PROFILE,
        rng=random.Random(42),
    )
    assert sel_default == sel_explicit
    assert len(sel_default) == TOTAL_MCQ_LAB_QUESTIONS


# ---------------------------------------------------------------------------
# Synthetic second ExamProfile isolation
# ---------------------------------------------------------------------------


def test_synthetic_profile_changes_readiness_without_mutating_upsc():
    topics = _sample_topics()
    upsc_before = build_readiness_report(topics, AS_OF)

    custom = _synthetic_profile()
    custom_report = build_readiness_report(topics, AS_OF, profile=custom)

    # Custom stage weights shift demand share
    assert custom_report.topics[0].demand_share != pytest.approx(
        upsc_before.topics[0].demand_share
    )

    # Custom depth weights (BASIC=0.60, NCERT_LEVEL=0.20, ADVANCED=0.10, EXAMINER_TRAPS=0.05)
    # Topic 1 completed BASIC + NCERT_LEVEL out of {BASIC, NCERT_LEVEL, ADVANCED, EXAMINER_TRAPS}
    expected_depth = (0.60 + 0.20) / (0.60 + 0.20 + 0.10 + 0.05)
    assert custom_report.topics[0].depth == pytest.approx(expected_depth)
    assert custom_report.topics[0].depth != pytest.approx(upsc_before.topics[0].depth)

    # Custom block_marks (120.0) & block_questions (30) & +4/-1 marking
    assert custom_report.topics[0].marks_at_stake == pytest.approx(
        120.0 * custom_report.topics[0].gap_share
    )
    assert custom_report.projection.questions == 30
    p = sum(row.demand_share * row.performance for row in custom_report.topics)
    assert custom_report.projection.net_expected == pytest.approx(
        round(30 * (4.0 * p - 1.0 * (1.0 - p)), 1)
    )

    # Default UPSC behaviour remains untouched
    upsc_after = build_readiness_report(topics, AS_OF)
    assert upsc_after == upsc_before


def test_synthetic_profile_changes_mains_and_mcq_lab_without_mutating_upsc():
    rows = _mains_rows()
    upsc_insufficient = build_mains_outcome(
        rows,
        submitted_answers=2,
        excluded_incomplete=0,
    )
    assert upsc_insufficient["available"] is False

    custom = _synthetic_profile()
    custom_outcome = build_mains_outcome(
        rows,
        submitted_answers=2,
        excluded_incomplete=0,
        profile=custom,
    )
    assert custom_outcome["available"] is True
    assert custom_outcome["minimum_questions"] == 2
    # Scores are 50% and 70%; padding=10 -> low=40.0, expected=60.0, high=80.0
    assert custom_outcome["band"]["low_pct"] == 40.0
    assert custom_outcome["band"]["high_pct"] == 80.0
    assert custom_outcome["projection"]["per_paper"][0]["out_of"] == 100
    assert custom_outcome["projection"]["per_paper"][0]["expected_marks"] == 60.0

    # MCQ lab thresholds & distribution from custom profile
    assert get_weak_types({"FACTUAL": (1, 2)}, profile=custom) == ["FACTUAL"]
    assert get_weak_types({"FACTUAL": (1, 2)}) == []

    recovery_attempts = [
        create_attempt(i, "FACTUAL", "A", "A") for i in range(3)
    ]
    assert check_weakness_recovery(recovery_attempts, "FACTUAL", profile=custom) is True
    assert check_weakness_recovery(recovery_attempts, "FACTUAL") is False

    bank = [
        SimpleNamespace(id=i, question_type=qtype)
        for i, qtype in enumerate(["STATEMENT_BASED"] * 5 + ["FACTUAL"] * 5)
    ]
    selected = select_mcq_lab_questions(
        bank,
        lambda q: q.question_type,
        profile=custom,
        rng=random.Random(7),
    )
    assert len(selected) == 6
    assert sum(1 for q in selected if q.question_type == "STATEMENT_BASED") == 4
    assert sum(1 for q in selected if q.question_type == "FACTUAL") == 2
