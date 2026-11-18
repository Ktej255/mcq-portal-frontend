"""Unit tests for the pure readiness engine.

These tests lock the honesty rules, not just arithmetic:

* no evidence is never weak or strong;
* two correct answers do not produce a strong badge;
* zero mapped PYQs keeps demand confidence low instead of declaring low demand;
* a headline band is suppressed without enough assessed demand;
* marks at stake use a 40-mark Geography block, not the whole paper;
* skippable sections do not create a false coverage gap.
"""

from __future__ import annotations

from datetime import date

import pytest

from app.core.gs_lms.readiness import (
    BAND_DEVELOPING,
    BAND_INSUFFICIENT,
    GEOGRAPHY_BLOCK_MARKS,
    STATUS_DEVELOPING,
    STATUS_IN_PROGRESS,
    STATUS_SECURE,
    STATUS_STRONG,
    STATUS_UNTOUCHED,
    STATUS_UNVERIFIED,
    STATUS_WEAK,
    PyqRef,
    SectionEvidence,
    TopicEvidence,
    build_readiness_report,
    compute_demand_weights,
)

AS_OF = date(2026, 10, 27)
LABELS = ("BASIC", "NCERT_LEVEL", "ADVANCED", "EXAMINER_TRAPS")


def make_topic(
    node_id: int,
    *,
    completed: int = 0,
    attempts: int = 0,
    correct: int = 0,
    recall: float | None = None,
    pyqs: tuple[PyqRef, ...] = (),
    mcq: int = 0,
    skippable: frozenset[int] = frozenset(),
    title: str | None = None,
) -> TopicEvidence:
    sections = tuple(
        SectionEvidence(
            id=node_id * 10 + index,
            label=label,
            completed=index < completed,
            title=label.replace("_", " ").title(),
        )
        for index, label in enumerate(LABELS)
    )
    return TopicEvidence(
        node_id=node_id,
        title=title or f"Topic {node_id}",
        mega_topic="Geomorphology",
        display_order=node_id,
        sections=sections,
        skippable_section_ids=skippable,
        practice_attempts=attempts,
        practice_correct=correct,
        recall_score=recall,
        pyqs=pyqs,
        mcq_count=mcq,
    )


# ---------------------------------------------------------------------------
# Demand
# ---------------------------------------------------------------------------

def test_demand_shares_sum_to_one_and_prior_is_explicit():
    topics = [
        make_topic(1, pyqs=(PyqRef(2023, "PRELIMS"),)),
        make_topic(2),
        make_topic(3, pyqs=(PyqRef(2011, "PRELIMS"),)),
    ]
    demands = compute_demand_weights(topics, 2026)

    assert sum(demand.share for demand in demands.values()) == pytest.approx(1.0)
    assert demands[1].share > demands[3].share  # recency matters
    assert demands[3].share > demands[2].share  # prior still beats zero evidence
    assert demands[2].pyq_count == 0
    assert demands[2].confidence == pytest.approx(0.25)
    assert demands[1].confidence > demands[2].confidence
    assert max(demand.score for demand in demands.values()) == pytest.approx(100.0)


def test_demand_never_treats_zero_pyq_as_zero_share():
    topics = [make_topic(1), make_topic(2)]
    demands = compute_demand_weights(topics, 2026)
    assert all(demand.share > 0 for demand in demands.values())
    assert all(demand.pyq_count == 0 for demand in demands.values())


def test_mains_contributes_less_than_prelims():
    prelims = make_topic(1, pyqs=(PyqRef(2023, "PRELIMS", 2),))
    mains = make_topic(2, pyqs=(PyqRef(2023, "MAINS", 15),))
    demands = compute_demand_weights([prelims, mains], 2026)
    assert demands[1].weighted_pyq > demands[2].weighted_pyq


# ---------------------------------------------------------------------------
# Status honesty
# ---------------------------------------------------------------------------

def test_zero_evidence_is_never_weak_or_strong():
    topics = [make_topic(1), make_topic(2, completed=4)]
    report = build_readiness_report(topics, AS_OF)

    assert report.band == BAND_INSUFFICIENT
    assert report.band_suppressed is True
    assert report.assessed_demand_pct == 0.0
    assert {row.status for row in report.topics} == {
        STATUS_UNTOUCHED,
        STATUS_UNVERIFIED,
    }
    assert all(row.confidence == 0 for row in report.topics)
    assert all("Great work" not in row.reason for row in report.topics)


def test_full_coverage_without_testing_is_unverified_not_strong():
    topics = [make_topic(1, completed=4, attempts=0)]
    report = build_readiness_report(topics, AS_OF)
    row = report.topics[0]
    assert row.coverage == pytest.approx(1.0)
    assert row.status == STATUS_UNVERIFIED
    assert row.has_evidence is False
    assert row.confidence == 0.0
    assert report.band == BAND_INSUFFICIENT


def test_two_correct_answers_do_not_produce_strong_status():
    topics = [make_topic(1, completed=4, attempts=2, correct=2)]
    report = build_readiness_report(topics, AS_OF)
    row = report.topics[0]
    assert row.status != STATUS_STRONG
    assert row.performance < 1.0
    assert row.confidence < 0.30
    assert report.confidence_level == "LOW"


def test_consistent_evidence_can_reach_strong():
    topics = [
        make_topic(
            1,
            completed=4,
            attempts=20,
            correct=20,
            recall=1.0,
        )
    ]
    report = build_readiness_report(topics, AS_OF)
    row = report.topics[0]
    assert row.status == STATUS_STRONG
    assert row.confidence > 0.80
    assert report.band_suppressed is False


def test_weak_requires_evidence():
    topics = [
        make_topic(1, completed=4, attempts=10, correct=1),
        make_topic(2, completed=1, attempts=0),
    ]
    report = build_readiness_report(topics, AS_OF)
    by_id = {row.node_id: row for row in report.topics}
    assert by_id[1].status == STATUS_WEAK
    assert by_id[2].status == STATUS_IN_PROGRESS
    assert by_id[2].has_evidence is False


# ---------------------------------------------------------------------------
# Gap ranking
# ---------------------------------------------------------------------------

def test_high_demand_gap_outranks_low_demand_gap():
    topics = [
        make_topic(1, completed=4, attempts=10, correct=4, pyqs=(
            PyqRef(2023, "PRELIMS"),
            PyqRef(2022, "PRELIMS"),
            PyqRef(2021, "PRELIMS"),
        )),
        make_topic(2, completed=4, attempts=10, correct=1, pyqs=()),
    ]
    report = build_readiness_report(topics, AS_OF)
    by_id = {row.node_id: row for row in report.topics}
    assert by_id[1].demand_share > by_id[2].demand_share
    assert by_id[1].marks_at_stake > by_id[2].marks_at_stake
    assert report.next_actions[0]["node_id"] == 1


def test_marks_at_stake_uses_geography_block_not_whole_paper():
    topics = [make_topic(1, completed=0, attempts=0)]
    report = build_readiness_report(topics, AS_OF)
    row = report.topics[0]
    assert row.gap_share == pytest.approx(row.demand_share * (1 - row.performance))
    assert row.marks_at_stake == pytest.approx(GEOGRAPHY_BLOCK_MARKS * row.gap_share)
    assert row.marks_at_stake <= GEOGRAPHY_BLOCK_MARKS


# ---------------------------------------------------------------------------
# Coverage/depth policy
# ---------------------------------------------------------------------------

def test_skippable_sections_do_not_count_against_coverage():
    sections = (
        SectionEvidence(11, "BASIC", False),
        SectionEvidence(12, "NCERT_LEVEL", True),
        SectionEvidence(13, "ADVANCED", True),
        SectionEvidence(14, "EXAMINER_TRAPS", True),
    )
    topic = TopicEvidence(
        node_id=1,
        title="Skippable basics",
        sections=sections,
        skippable_section_ids=frozenset({11}),
    )
    report = build_readiness_report([topic], AS_OF)
    row = report.topics[0]
    assert row.coverage == pytest.approx(1.0)
    assert row.depth == pytest.approx(1.0)


def test_depth_weights_advanced_and_traps_more_than_basics():
    shallow = make_topic(1, completed=1)
    deep = make_topic(2, completed=3)
    report = build_readiness_report([shallow, deep], AS_OF)
    by_id = {row.node_id: row for row in report.topics}
    assert by_id[2].depth > by_id[1].depth


# ---------------------------------------------------------------------------
# Projection and bands
# ---------------------------------------------------------------------------

def test_projection_matches_negative_marking_formula():
    topics = [
        make_topic(1, completed=4, attempts=10, correct=5),
        make_topic(2, completed=4, attempts=10, correct=5),
    ]
    report = build_readiness_report(topics, AS_OF)
    p = sum(row.demand_share * row.performance for row in report.topics)
    expected_correct = 20 * p
    expected_net = 20 * (2 * p - (2 / 3) * (1 - p))
    assert report.projection.correct_expected == pytest.approx(expected_correct, abs=0.1)
    assert report.projection.net_expected == pytest.approx(expected_net, abs=0.1)
    assert 0 <= report.projection.correct_low <= report.projection.correct_high <= 20


def test_band_suppressed_below_25_percent_assessed_demand():
    topics = [
        make_topic(1, completed=4, attempts=20, correct=20, pyqs=(PyqRef(2023, "PRELIMS"),)),
        *[make_topic(node_id) for node_id in range(2, 22)],
    ]
    report = build_readiness_report(topics, AS_OF)
    assert report.assessed_demand_pct < 25
    assert report.band == BAND_INSUFFICIENT
    assert report.band_suppressed is True


def test_band_not_suppressed_when_enough_demand_assessed():
    topics = [
        make_topic(1, completed=4, attempts=20, correct=14, pyqs=(PyqRef(2023, "PRELIMS"),)),
        make_topic(2, completed=4, attempts=20, correct=14, pyqs=(PyqRef(2022, "PRELIMS"),)),
    ]
    report = build_readiness_report(topics, AS_OF)
    assert report.assessed_demand_pct == pytest.approx(100.0)
    assert report.band_suppressed is False
    assert report.band in {BAND_DEVELOPING, "COMPETITIVE", "STRONG", "FOUNDATION"}


def test_empty_subject_is_not_a_crash_or_a_false_success():
    report = build_readiness_report([], AS_OF)
    assert report.readiness_score == 0
    assert report.band == BAND_INSUFFICIENT
    assert report.projection.correct_expected == 0
    assert report.topics == ()
    assert report.next_actions == ()
