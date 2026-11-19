"""Honest Mains outcome estimate from scored descriptive answers.

The founder decision for the paid beta is to show a Mains band, but only as an
estimate: a range, its evidence base, and an explicit confidence label. The
rules that keep it honest:

* Only complete evaluation reports with marks and max marks are used.
* One data point per distinct question: repeat attempts never inflate
  confidence, and the latest attempt wins.
* Fewer than ``MIN_DISTINCT_QUESTIONS`` scored answers means **no band**, not a
  zero and not a placeholder. "Insufficient evidence" is the result.
* The band is the observed score range widened by a small margin, not a model
  fitted to a handful of answers.
* Marks are projected only onto GS papers that actually have evidence. A
  learner with GS1 answers gets a GS1 projection, not a fabricated 1000-mark
  forecast.
* Nothing here predicts selection, rank, or a cut-off.

The result is scoped to one subject through the PYQ the answer was written on.
"""

from __future__ import annotations

from datetime import datetime, timezone
from statistics import fmean, stdev
from typing import Any

from sqlalchemy.orm import Session

from app.core.exam_profiles import UPSC_CSE_PROFILE, ExamProfile
from app.core.gs_lms.models import (
    GsLmsAnswerAttempt,
    GsLmsAnswerAttemptStatusEnum,
    GsLmsEvaluationReport,
    GsLmsPaperEnum,
    GsLmsPyq,
)

MIN_DISTINCT_QUESTIONS = UPSC_CSE_PROFILE.min_distinct_written_questions

# UPSC Mains GS papers carry 250 marks each (GS1–GS4). Essay (250) is a separate
# paper and is not evaluated by this platform, so it is never projected.
MARKS_PER_GS_PAPER = UPSC_CSE_PROFILE.marks_per_written_paper

# Small-sample padding applied to each side of the observed score range.
BAND_PADDING_PCT = UPSC_CSE_PROFILE.band_padding_pct

_CONFIDENCE_LABELS: dict[str, str] = {
    "moderate": "Moderate — still an estimate",
    "low": "Low — add more answers",
    "very_low": "Very low — early signal only",
    "insufficient": "Insufficient evidence",
}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _band_from_scores(
    scores: list[float],
    band_padding_pct: float = BAND_PADDING_PCT,
) -> dict[str, float]:
    """Observed range widened by ``band_padding_pct`` on each side."""
    low = max(0.0, min(scores) - band_padding_pct)
    high = min(100.0, max(scores) + band_padding_pct)
    expected = max(low, min(high, fmean(scores)))
    return {
        "low_pct": round(low, 1),
        "expected_pct": round(expected, 1),
        "high_pct": round(high, 1),
        "observed_min_pct": round(min(scores), 1),
        "observed_max_pct": round(max(scores), 1),
    }


def _confidence(
    distinct_questions: int,
    papers_with_evidence: int,
    spread_pct: float,
) -> str:
    if (
        distinct_questions >= 10
        and papers_with_evidence >= 2
        and spread_pct <= 20.0
    ):
        return "moderate"
    if distinct_questions >= 6:
        return "low"
    return "very_low"


def build_mains_outcome(
    rows: list[tuple[GsLmsAnswerAttempt, GsLmsEvaluationReport]],
    *,
    submitted_answers: int,
    excluded_incomplete: int,
    profile: ExamProfile = UPSC_CSE_PROFILE,
) -> dict[str, Any]:
    """Build the outcome payload from (attempt, report) pairs.

    ``rows`` must already be scoped to one student and subject. Duplicate
    attempts on the same PYQ are reduced to the latest one here.
    """
    # Latest attempt per question. A learner repeating one question should not
    # look more confident than a learner who wrote many different answers.
    latest_by_question: dict[int, tuple[GsLmsAnswerAttempt, GsLmsEvaluationReport]] = {}
    free_form: list[tuple[GsLmsAnswerAttempt, GsLmsEvaluationReport]] = []
    for attempt, report in rows:
        if attempt.pyq_id is None:
            free_form.append((attempt, report))
            continue
        current = latest_by_question.get(attempt.pyq_id)
        if current is None or attempt.id > current[0].id:
            latest_by_question[attempt.pyq_id] = (attempt, report)

    selected = list(latest_by_question.values()) + free_form
    excluded_duplicates = max(0, len(rows) - len(selected))

    scored: list[tuple[str | None, float, int]] = []
    for attempt, report in selected:
        if report.marks_awarded is None or not report.max_marks:
            continue
        percentage = 100.0 * float(report.marks_awarded) / float(report.max_marks)
        paper = attempt.gs_paper.value if attempt.gs_paper else None
        scored.append((paper, max(0.0, min(100.0, percentage)), report.max_marks))

    distinct_questions = len(scored)
    papers: dict[str, list[float]] = {}
    unknown_paper_answers = 0
    for paper, percentage, _max_marks in scored:
        if paper in {member.value for member in GsLmsPaperEnum}:
            papers.setdefault(paper, []).append(percentage)
        else:
            unknown_paper_answers += 1

    papers_with_evidence = len(papers)
    caveats: list[str] = []
    if distinct_questions:
        caveats.append(
            f"Based on {distinct_questions} distinct scored Mains answer"
            f"{'' if distinct_questions == 1 else 's'}. Repeated attempts on the "
            "same question count once, using the latest attempt."
        )
    caveats.append(
        "Scored by the platform's marking-scheme evaluator, not a UPSC "
        "examiner. Handwriting, presentation, and exam-day judgement are not "
        "measured."
    )
    caveats.append(
        "The band is the observed score range widened by "
        f"{profile.band_padding_pct:.0f} percentage points each side to reflect "
        "small-sample uncertainty."
    )
    caveats.append(
        "Marks are projected only onto GS papers with scored answers. This is "
        "not a full 1000-mark Mains forecast."
    )
    caveats.append("No selection, rank, or cut-off outcome is predicted.")

    base: dict[str, Any] = {
        "generated_at": _utcnow().isoformat(),
        "available": False,
        "minimum_questions": profile.min_distinct_written_questions,
        "answers_evaluated": distinct_questions,
        "submitted_answers": submitted_answers,
        "excluded_incomplete_reports": excluded_incomplete,
        "excluded_duplicate_attempts": excluded_duplicates,
        "papers_with_evidence": papers_with_evidence,
        "unknown_paper_answers": unknown_paper_answers,
        "band": None,
        "projection": None,
        "confidence": {
            "level": "insufficient",
            "label": _CONFIDENCE_LABELS["insufficient"],
            "distinct_questions": distinct_questions,
            "papers_with_evidence": papers_with_evidence,
            "spread_pct": None,
        },
        "caveats": caveats,
    }

    min_questions = profile.min_distinct_written_questions
    if distinct_questions < min_questions:
        remaining = min_questions - distinct_questions
        base["reason"] = (
            "No outcome band is shown yet. "
            f"{remaining} more scored Mains answer"
            f"{'' if remaining == 1 else 's'} on different questions would "
            "reach the minimum evidence threshold. Insufficient evidence is "
            "reported as such — never as zero marks."
        )
        min_word = "three" if min_questions == 3 else str(min_questions)
        base["next_step"] = (
            f"Write full answers to at least {min_word} different Mains questions on "
            "this subject and submit them for evaluation."
        )
        return base

    percentages = [percentage for _paper, percentage, _max_marks in scored]
    spread_pct = stdev(percentages) if len(percentages) >= 2 else 0.0
    band = _band_from_scores(percentages, profile.band_padding_pct)

    per_paper: list[dict[str, Any]] = []
    covered_marks = 0
    for paper in sorted(papers):
        scores = papers[paper]
        paper_band = _band_from_scores(scores, profile.band_padding_pct)
        out_of = profile.marks_per_written_paper
        covered_marks += out_of
        per_paper.append(
            {
                "paper": paper,
                "answers": len(scores),
                "out_of": out_of,
                "low_marks": round(paper_band["low_pct"] * out_of / 100.0, 1),
                "expected_marks": round(
                    paper_band["expected_pct"] * out_of / 100.0, 1
                ),
                "high_marks": round(paper_band["high_pct"] * out_of / 100.0, 1),
            }
        )

    projection = None
    if per_paper:
        projection = {
            "covered_papers": [row["paper"] for row in per_paper],
            "covered_marks": covered_marks,
            "low_marks": round(
                sum(row["low_marks"] for row in per_paper), 1
            ),
            "expected_marks": round(
                sum(row["expected_marks"] for row in per_paper), 1
            ),
            "high_marks": round(
                sum(row["high_marks"] for row in per_paper), 1
            ),
            "per_paper": per_paper,
        }
        if unknown_paper_answers:
            caveats.append(
                f"{unknown_paper_answers} scored answer"
                f"{'' if unknown_paper_answers == 1 else 's'} not tied to a GS "
                "paper still inform the percentage band but are excluded from "
                "the marks projection."
            )

    level = _confidence(distinct_questions, papers_with_evidence, spread_pct)
    next_step = {
        "very_low": (
            "Add scored answers on another GS paper. Three answers are enough "
            "to show a direction, not a stable level."
        ),
        "low": (
            "Keep writing across papers; around ten distinct answers across at "
            "least two papers makes this band materially more stable."
        ),
        "moderate": (
            "Keep adding answers across papers. This remains an estimate, not "
            "a selection forecast."
        ),
    }[level]

    base.update(
        {
            "available": True,
            "reason": None,
            "band": band,
            "projection": projection,
            "confidence": {
                "level": level,
                "label": _CONFIDENCE_LABELS[level],
                "distinct_questions": distinct_questions,
                "papers_with_evidence": papers_with_evidence,
                "spread_pct": round(spread_pct, 1),
            },
            "next_step": next_step,
        }
    )
    return base


def get_mains_outcome(
    db: Session,
    student_id: int,
    subject_id: int,
    profile: ExamProfile = UPSC_CSE_PROFILE,
) -> dict[str, Any]:
    """Return the learner's Mains outcome estimate for one subject."""
    rows = (
        db.query(GsLmsAnswerAttempt, GsLmsEvaluationReport)
        .join(
            GsLmsEvaluationReport,
            GsLmsEvaluationReport.attempt_id == GsLmsAnswerAttempt.id,
        )
        .join(GsLmsPyq, GsLmsPyq.id == GsLmsAnswerAttempt.pyq_id)
        .filter(
            GsLmsAnswerAttempt.student_id == student_id,
            GsLmsAnswerAttempt.status == GsLmsAnswerAttemptStatusEnum.EVALUATED,
            GsLmsAnswerAttempt.is_deleted == False,  # noqa: E712
            GsLmsPyq.subject_id == subject_id,
            GsLmsEvaluationReport.marks_awarded.isnot(None),
            GsLmsEvaluationReport.max_marks.isnot(None),
            GsLmsEvaluationReport.max_marks > 0,
        )
        .order_by(GsLmsAnswerAttempt.id.asc())
        .all()
    )

    complete: list[tuple[GsLmsAnswerAttempt, GsLmsEvaluationReport]] = []
    excluded_incomplete = 0
    for attempt, report in rows:
        if report.incomplete_sections:
            excluded_incomplete += 1
            continue
        complete.append((attempt, report))

    return build_mains_outcome(
        complete,
        submitted_answers=len(rows),
        excluded_incomplete=excluded_incomplete,
        profile=profile,
    )


__all__ = [
    "BAND_PADDING_PCT",
    "MARKS_PER_GS_PAPER",
    "MIN_DISTINCT_QUESTIONS",
    "build_mains_outcome",
    "get_mains_outcome",
]
