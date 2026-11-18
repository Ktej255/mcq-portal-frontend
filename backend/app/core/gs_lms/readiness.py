"""Pure readiness engine for the GS revision platform.

The engine answers five separate questions and refuses to collapse them into a
single unqualified number:

* demand   -- what does UPSC ask, based on reviewed PYQs and a prior?
* coverage -- how much of the required content is complete?
* depth    -- how deeply did the learner go?
* evidence -- how did the learner perform when tested?
* outcome  -- what range does the current evidence support?

No database access lives here. Every function is deterministic for a given
evidence set and ``as_of_year``. That makes the formulas auditable and lets the
API, planner, and tests share one implementation.

Design rules enforced by this module:

* A topic with no assessment evidence is never labelled weak or strong.
* A small sample is shrunk toward a preparation-based prior.
* Zero mapped PYQs never means "low demand"; it means low demand confidence.
* A headline band is suppressed when less than 25% of demand has evidence.
* Projections are ranges with stated assumptions, never score guarantees.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field, replace
from datetime import date
from typing import Iterable, Mapping, Sequence


# ---------------------------------------------------------------------------
# Constants (documented in DOCS/beta-2027/PRODUCTION_BLUEPRINT.md)
# ---------------------------------------------------------------------------

DEMAND_PRIOR = 0.25
RECENCY_HALF_LIFE_YEARS = 6.0
PRELIMS_EXAM_WEIGHT = 1.0
MAINS_EXAM_WEIGHT = 0.15
PRIOR_STRENGTH = 6.0
RECALL_PSEUDO_OBSERVATIONS = 4.0
GEOGRAPHY_BLOCK_QUESTIONS = 20
GEOGRAPHY_BLOCK_MARKS = 40.0
CORRECT_MARKS = 2.0
WRONG_MARKS = 2.0 / 3.0
BAND_SUPPRESSION_ASSESSED_SHARE = 0.25
Z_80 = 1.28

DEPTH_WEIGHTS: Mapping[str, float] = {
    "BASIC": 0.10,
    "NCERT_LEVEL": 0.20,
    "ADVANCED": 0.30,
    "CURRENT_AFFAIRS": 0.15,
    "EXAMINER_TRAPS": 0.25,
}

STATUS_UNTOUCHED = "UNTOUCHED"
STATUS_IN_PROGRESS = "IN_PROGRESS"
STATUS_UNVERIFIED = "UNVERIFIED"
STATUS_WEAK = "WEAK"
STATUS_DEVELOPING = "DEVELOPING"
STATUS_SECURE = "SECURE"
STATUS_STRONG = "STRONG"

BAND_INSUFFICIENT = "INSUFFICIENT_EVIDENCE"
BAND_FOUNDATION = "FOUNDATION"
BAND_DEVELOPING = "DEVELOPING"
BAND_COMPETITIVE = "COMPETITIVE"
BAND_STRONG = "STRONG"


# ---------------------------------------------------------------------------
# Inputs
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class SectionEvidence:
    """One reviewed section and whether the learner completed it."""

    id: int
    label: str
    completed: bool
    title: str = ""


@dataclass(frozen=True)
class PyqRef:
    """A reviewed previous-year question attached to a leaf topic."""

    year: int
    exam_type: str  # "PRELIMS" | "MAINS"
    marks: int | None = None


@dataclass(frozen=True)
class TopicEvidence:
    """All evidence for one reviewed leaf topic."""

    node_id: int
    title: str
    mega_topic: str = ""
    display_order: int = 0
    sections: tuple[SectionEvidence, ...] = ()
    skippable_section_ids: frozenset[int] = field(default_factory=frozenset)
    practice_attempts: int = 0
    practice_correct: int = 0
    recall_score: float | None = None  # 0.0-1.0, latest completed session
    completed_due_revisits: int = 0
    pyqs: tuple[PyqRef, ...] = ()
    mcq_count: int = 0


@dataclass(frozen=True)
class DemandWeight:
    node_id: int
    raw: float
    share: float
    score: float
    pyq_count: int
    weighted_pyq: float
    distinct_years: int
    last_pyq_year: int | None
    mains_count: int
    last_mains_year: int | None
    confidence: float
    components: tuple[dict, ...] = ()


# ---------------------------------------------------------------------------
# Outputs
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Projection:
    questions: int
    correct_low: float
    correct_expected: float
    correct_high: float
    net_low: float
    net_expected: float
    net_high: float
    assumptions: tuple[str, ...] = (
        "20 Geography-attributable questions",
        "All questions attempted",
        "+2 for correct, -0.667 for wrong",
        "Estimate, not a UPSC score guarantee",
    )


@dataclass(frozen=True)
class TopicReadiness:
    node_id: int
    title: str
    mega_topic: str
    display_order: int
    demand_share: float
    demand_score: float
    demand_confidence: float
    pyq_count: int
    last_pyq_year: int | None
    mains_pyq_count: int
    last_mains_year: int | None
    coverage: float
    depth: float
    prep: float
    performance: float
    confidence: float
    status: str
    gap_share: float
    marks_at_stake: float
    has_evidence: bool
    practice_attempts: int
    practice_correct: int
    recall_score: float | None
    mcq_count: int
    next_action: str
    next_section: str | None
    reason: str


@dataclass(frozen=True)
class ReadinessReport:
    as_of: date
    readiness_score: float
    band: str
    band_suppressed: bool
    confidence_level: str
    assessed_demand_pct: float
    coverage_pct: float
    depth_pct: float
    demand_mapping_pct: float
    projection: Projection
    topics: tuple[TopicReadiness, ...]
    next_actions: tuple[dict, ...]
    data_quality: dict
    weighted_confidence: float


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def _safe_ratio(numerator: float, denominator: float) -> float:
    return numerator / denominator if denominator else 0.0


def _is_prelims(exam_type: str) -> bool:
    return str(exam_type).upper() == "PRELIMS"


def _recency_weight(year: int, as_of_year: int) -> float:
    age = max(0, as_of_year - int(year))
    return 0.5 ** (age / RECENCY_HALF_LIFE_YEARS)


def _required_sections(
    sections: Sequence[SectionEvidence],
    skippable_section_ids: Iterable[int],
) -> list[SectionEvidence]:
    skip = set(skippable_section_ids)
    return [section for section in sections if section.id not in skip]


# ---------------------------------------------------------------------------
# Demand
# ---------------------------------------------------------------------------

def compute_demand_weights(
    topics: Sequence[TopicEvidence],
    as_of_year: int,
) -> dict[int, DemandWeight]:
    """Compute normalised demand weights for a set of leaf topics.

    ``demand_share`` sums to one across the supplied topics. ``demand_score``
    is display-only and sets the maximum topic to 100.
    """
    raw_by_topic: dict[int, dict] = {}

    for topic in topics:
        prelims_count = 0
        mains_count = 0
        weighted = 0.0
        prelims_years: set[int] = set()
        last_prelims_year: int | None = None
        last_mains_year: int | None = None
        components: list[dict] = []

        for pyq in topic.pyqs:
            year = int(pyq.year)
            prelims = _is_prelims(pyq.exam_type)
            if prelims:
                prelims_count += 1
                prelims_years.add(year)
                last_prelims_year = (
                    year
                    if last_prelims_year is None
                    else max(last_prelims_year, year)
                )
            else:
                # Mains PYQs contribute to demand share at a lower weight, so
                # they must be reported alongside the Prelims count instead of
                # being silently folded into the share.
                mains_count += 1
                last_mains_year = (
                    year
                    if last_mains_year is None
                    else max(last_mains_year, year)
                )

            marks = pyq.marks if pyq.marks is not None else 10
            if prelims:
                exam_weight = PRELIMS_EXAM_WEIGHT
                marks_factor = 1.0
            else:
                exam_weight = MAINS_EXAM_WEIGHT
                marks_factor = min(3.0, max(0.0, marks / 10.0))

            contribution = _recency_weight(year, as_of_year) * exam_weight * marks_factor
            weighted += contribution
            components.append({
                "year": year,
                "exam_type": "PRELIMS" if prelims else "MAINS",
                "marks": pyq.marks,
                "contribution": round(contribution, 6),
            })

        raw = weighted + DEMAND_PRIOR
        confidence = min(
            0.90,
            0.25 + 0.25 * prelims_count + 0.15 * len(prelims_years),
        )
        raw_by_topic[topic.node_id] = {
            "raw": raw,
            "pyq_count": prelims_count,
            "mains_count": mains_count,
            "weighted": weighted,
            "distinct_years": len(prelims_years),
            "last_pyq_year": last_prelims_year,
            "last_mains_year": last_mains_year,
            "confidence": confidence,
            "components": tuple(components),
        }

    total_raw = sum(item["raw"] for item in raw_by_topic.values())
    shares = {
        node_id: (item["raw"] / total_raw if total_raw > 0 else 0.0)
        for node_id, item in raw_by_topic.items()
    }
    max_share = max(shares.values()) if shares else 0.0

    result: dict[int, DemandWeight] = {}
    for node_id, item in raw_by_topic.items():
        share = shares[node_id]
        result[node_id] = DemandWeight(
            node_id=node_id,
            raw=item["raw"],
            share=share,
            score=(100.0 * share / max_share) if max_share > 0 else 0.0,
            pyq_count=item["pyq_count"],
            weighted_pyq=item["weighted"],
            distinct_years=item["distinct_years"],
            last_pyq_year=item["last_pyq_year"],
            mains_count=item["mains_count"],
            last_mains_year=item["last_mains_year"],
            confidence=item["confidence"],
            components=item["components"],
        )
    return result


# ---------------------------------------------------------------------------
# Topic readiness
# ---------------------------------------------------------------------------

def _coverage_and_depth(topic: TopicEvidence) -> tuple[float, float, list[SectionEvidence]]:
    required = _required_sections(topic.sections, topic.skippable_section_ids)
    if not required:
        if topic.sections:
            # Every section is skippable for this learner; content is complete
            # by policy, but there is no required depth to measure.
            return 1.0, 0.0, required
        return 0.0, 0.0, required

    completed = sum(1 for section in required if section.completed)
    coverage = completed / len(required)
    weight_total = sum(DEPTH_WEIGHTS.get(section.label, 0.10) for section in required)
    depth = (
        sum(
            DEPTH_WEIGHTS.get(section.label, 0.10)
            for section in required
            if section.completed
        )
        / weight_total
        if weight_total
        else 0.0
    )
    return coverage, depth, required


def _status(
    coverage: float,
    performance: float,
    has_evidence: bool,
) -> str:
    if has_evidence:
        if performance < 0.55:
            return STATUS_WEAK
        if performance < 0.70:
            return STATUS_DEVELOPING
        if performance < 0.85:
            return STATUS_SECURE
        return STATUS_STRONG
    if coverage <= 0:
        return STATUS_UNTOUCHED
    if coverage < 0.50:
        return STATUS_IN_PROGRESS
    return STATUS_UNVERIFIED


def _next_action(
    status: str,
    next_section: SectionEvidence | None,
    demand_score: float,
) -> str:
    if status == STATUS_UNTOUCHED:
        return "Start the basic section"
    if status == STATUS_IN_PROGRESS:
        if next_section is not None:
            label = next_section.title or next_section.label.replace("_", " ").title()
            return f"Complete {label}"
        return "Finish the remaining sections"
    if status == STATUS_UNVERIFIED:
        return "Take a 10-question diagnostic"
    if status == STATUS_WEAK:
        return "Revise and re-test" if demand_score >= 60 else "Re-study and practise"
    if status == STATUS_DEVELOPING:
        return "Targeted practice on this topic"
    if status == STATUS_SECURE:
        return "Spaced revisit"
    return "Maintain with a revisit"


def _reason(
    demand: DemandWeight,
    coverage: float,
    depth: float,
    performance: float,
    has_evidence: bool,
    practice_attempts: int,
    practice_correct: int,
) -> str:
    if demand.pyq_count:
        demand_text = (
            f"{demand.pyq_count} reviewed Prelims PYQ"
            f"{'s' if demand.pyq_count != 1 else ''}"
        )
        if demand.last_pyq_year:
            demand_text += f", latest {demand.last_pyq_year}"
    else:
        demand_text = "no reviewed Prelims PYQ mapped; prior only"
    if demand.mains_count:
        demand_text += (
            f"; {demand.mains_count} Mains PYQ"
            f"{'s' if demand.mains_count != 1 else ''}"
        )

    if has_evidence:
        return (
            f"{practice_correct}/{practice_attempts} practice correct"
            if practice_attempts
            else "recall evidence only"
        ) + f"; projected {performance:.0%}; {demand_text}"
    return (
        f"{coverage:.0%} covered, {depth:.0%} depth; no test evidence yet; "
        f"{demand_text}"
    )


def compute_topic_readiness(
    topic: TopicEvidence,
    demand: DemandWeight,
) -> TopicReadiness:
    coverage, depth, required = _coverage_and_depth(topic)
    prep = 0.50 * coverage + 0.50 * depth

    attempts = max(0, int(topic.practice_attempts))
    correct = max(0, min(int(topic.practice_correct), attempts))
    recall = None if topic.recall_score is None else clamp(float(topic.recall_score))

    n_eff = float(attempts)
    k_eff = float(correct)
    if recall is not None:
        n_eff += RECALL_PSEUDO_OBSERVATIONS
        k_eff += RECALL_PSEUDO_OBSERVATIONS * recall

    prior = 0.35 + 0.25 * prep
    performance = (k_eff + PRIOR_STRENGTH * prior) / (n_eff + PRIOR_STRENGTH)
    has_evidence = attempts > 0 or recall is not None

    if has_evidence:
        confidence = min(
            0.95,
            1.0 - math.exp(
                -(
                    attempts / 10.0
                    + (2.0 if recall is not None else 0.0)
                    + topic.completed_due_revisits / 3.0
                )
            ),
        )
    else:
        confidence = 0.0

    status = _status(coverage, performance, has_evidence)
    next_section = next((section for section in required if not section.completed), None)
    gap_share = demand.share * (1.0 - performance)

    return TopicReadiness(
        node_id=topic.node_id,
        title=topic.title,
        mega_topic=topic.mega_topic,
        display_order=topic.display_order,
        demand_share=demand.share,
        demand_score=demand.score,
        demand_confidence=demand.confidence,
        pyq_count=demand.pyq_count,
        last_pyq_year=demand.last_pyq_year,
        mains_pyq_count=demand.mains_count,
        last_mains_year=demand.last_mains_year,
        coverage=coverage,
        depth=depth,
        prep=prep,
        performance=performance,
        confidence=confidence,
        status=status,
        gap_share=gap_share,
        marks_at_stake=GEOGRAPHY_BLOCK_MARKS * gap_share,
        has_evidence=has_evidence,
        practice_attempts=attempts,
        practice_correct=correct,
        recall_score=recall,
        mcq_count=topic.mcq_count,
        next_action=_next_action(status, next_section, demand.score),
        next_section=(
            next_section.title or next_section.label.replace("_", " ").title()
            if next_section is not None
            else None
        ),
        reason=_reason(
            demand,
            coverage,
            depth,
            performance,
            has_evidence,
            attempts,
            correct,
        ),
    )


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

def _band(score: float, assessed_share: float) -> tuple[str, bool]:
    if assessed_share < BAND_SUPPRESSION_ASSESSED_SHARE:
        return BAND_INSUFFICIENT, True
    if score < 45.0:
        return BAND_FOUNDATION, False
    if score < 60.0:
        return BAND_DEVELOPING, False
    if score < 75.0:
        return BAND_COMPETITIVE, False
    return BAND_STRONG, False


def _confidence_level(assessed_share: float, weighted_confidence: float) -> str:
    # Coverage of demand is necessary but not sufficient: two correct answers
    # must not raise confidence to MEDIUM merely because they sit on a popular
    # topic. The weighted evidence confidence has to clear a floor too.
    if assessed_share >= 0.70 and weighted_confidence >= 0.50:
        return "HIGH"
    if assessed_share >= 0.40 and weighted_confidence >= 0.25:
        return "MEDIUM"
    return "LOW"


def _projection(
    topics: Sequence[TopicReadiness],
    assessed_share: float,
) -> Projection:
    expected_accuracy = sum(t.demand_share * t.performance for t in topics)
    variance = 0.0
    for topic in topics:
        n_eff = float(topic.practice_attempts)
        if topic.recall_score is not None:
            n_eff += RECALL_PSEUDO_OBSERVATIONS
        p = clamp(topic.performance)
        variance += (topic.demand_share ** 2) * p * (1.0 - p) / (n_eff + 7.0)

    se = math.sqrt(max(0.0, variance))
    if assessed_share < 0.40:
        se *= 1.5

    low = clamp(expected_accuracy - Z_80 * se)
    high = clamp(expected_accuracy + Z_80 * se)

    def correct(accuracy: float) -> float:
        return round(GEOGRAPHY_BLOCK_QUESTIONS * accuracy, 1)

    def net(accuracy: float) -> float:
        per_question = CORRECT_MARKS * accuracy - WRONG_MARKS * (1.0 - accuracy)
        return round(GEOGRAPHY_BLOCK_QUESTIONS * per_question, 1)

    return Projection(
        questions=GEOGRAPHY_BLOCK_QUESTIONS,
        correct_low=correct(low),
        correct_expected=correct(expected_accuracy),
        correct_high=correct(high),
        net_low=net(low),
        net_expected=net(expected_accuracy),
        net_high=net(high),
    )


def build_readiness_report(
    topics: Sequence[TopicEvidence],
    as_of: date,
    as_of_year: int | None = None,
) -> ReadinessReport:
    """Build the full demand-weighted readiness report."""
    year = as_of_year if as_of_year is not None else as_of.year
    demands = compute_demand_weights(topics, year)

    rows = tuple(
        compute_topic_readiness(topic, demands[topic.node_id])
        for topic in topics
    )

    total_share = sum(row.demand_share for row in rows)
    if total_share > 0:
        normalised = tuple(
            replace(row, demand_share=row.demand_share / total_share)
            for row in rows
        )
    else:
        normalised = rows

    readiness_score = 100.0 * sum(
        row.demand_share * row.performance for row in normalised
    )
    assessed_share = sum(
        row.demand_share for row in normalised if row.has_evidence
    )
    weighted_confidence = sum(
        row.demand_share * row.confidence for row in normalised
    )
    coverage_pct = 100.0 * sum(
        row.demand_share * row.coverage for row in normalised
    )
    depth_pct = 100.0 * sum(
        row.demand_share * row.depth for row in normalised
    )

    band, suppressed = _band(readiness_score, assessed_share)
    confidence_level = _confidence_level(assessed_share, weighted_confidence)
    projection = _projection(normalised, assessed_share)

    topics_with_pyq = sum(1 for row in normalised if row.pyq_count > 0)
    topics_with_mcq = sum(1 for row in normalised if row.mcq_count > 0)
    total = len(normalised)
    demand_mapping_pct = 100.0 * _safe_ratio(topics_with_pyq, total)

    data_quality = {
        "topics_total": total,
        "topics_with_pyq": topics_with_pyq,
        "topics_without_pyq": total - topics_with_pyq,
        "topics_with_mcq": topics_with_mcq,
        "topics_without_mcq": total - topics_with_mcq,
        "demand_mapping_pct": round(demand_mapping_pct, 1),
        "notes": [],
    }
    if total - topics_with_pyq > 0:
        data_quality["notes"].append(
            f"{total - topics_with_pyq} topics have no reviewed Prelims PYQ "
            "mapping; their demand uses a documented prior."
        )
    if total - topics_with_mcq > 0:
        data_quality["notes"].append(
            f"{total - topics_with_mcq} topics have no reviewed MCQ, so they "
            "cannot produce practice evidence yet."
        )

    ranked = sorted(
        normalised,
        key=lambda row: (row.marks_at_stake, row.demand_score),
        reverse=True,
    )
    next_actions = tuple(
        {
            "node_id": row.node_id,
            "title": row.title,
            "action": row.next_action,
            "reason": row.reason,
            "status": row.status,
            "marks_at_stake": round(row.marks_at_stake, 1),
            "demand_score": round(row.demand_score, 1),
        }
        for row in ranked
        if row.status != STATUS_STRONG
    )[:5]

    return ReadinessReport(
        as_of=as_of,
        readiness_score=round(readiness_score, 1),
        band=band,
        band_suppressed=suppressed,
        confidence_level=confidence_level,
        assessed_demand_pct=round(100.0 * assessed_share, 1),
        coverage_pct=round(coverage_pct, 1),
        depth_pct=round(depth_pct, 1),
        demand_mapping_pct=round(demand_mapping_pct, 1),
        projection=projection,
        topics=normalised,
        next_actions=next_actions,
        data_quality=data_quality,
        weighted_confidence=round(weighted_confidence, 3),
    )


__all__ = [
    "BAND_COMPETITIVE",
    "BAND_DEVELOPING",
    "BAND_FOUNDATION",
    "BAND_INSUFFICIENT",
    "BAND_STRONG",
    "DemandWeight",
    "Projection",
    "PyqRef",
    "ReadinessReport",
    "SectionEvidence",
    "STATUS_DEVELOPING",
    "STATUS_IN_PROGRESS",
    "STATUS_SECURE",
    "STATUS_STRONG",
    "STATUS_UNTOUCHED",
    "STATUS_UNVERIFIED",
    "STATUS_WEAK",
    "TopicEvidence",
    "TopicReadiness",
    "build_readiness_report",
    "compute_demand_weights",
    "compute_topic_readiness",
]
