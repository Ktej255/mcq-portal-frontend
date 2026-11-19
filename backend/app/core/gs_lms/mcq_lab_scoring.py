"""MCQ Lab Scoring Engine — batch scoring for the 15-question simultaneous
MCQ Lab with all-or-nothing per-question evaluation and weakness pattern
computation.

All scoring functions are pure (no I/O). Persistence is handled by the
caller (API router or service layer).

Requirements: 6.2, 6.6, 7.1, 7.4, 7.5
"""

from __future__ import annotations

import random
from dataclasses import dataclass, field
from typing import Callable, Dict, List, Sequence, TypeVar

from app.core.exam_profiles import UPSC_CSE_PROFILE, ExamProfile

T = TypeVar("T")


# ---------------------------------------------------------------------------
# Constants — Required Type Distribution
# ---------------------------------------------------------------------------

# Preferred pattern mix for each MCQ Lab (total = 15), expressed in the same
# question taxonomy that GsLmsMcqQuestion stores and the result screen shows.
# Earlier revisions used a separate taxonomy (MULTI_STATEMENT, DIRECT_RECALL,
# ...) that no stored question ever carried, so the "required distribution"
# was silently never enforced. Selection now prefers these counts and fills
# any deficit from the remaining reviewed bank; the learner is still served
# exactly the topic's reviewed set, never a substituted one.
REQUIRED_TYPE_DISTRIBUTION: Dict[str, int] = dict(
    UPSC_CSE_PROFILE.mcq_lab_type_distribution
)

TOTAL_MCQ_LAB_QUESTIONS = UPSC_CSE_PROFILE.total_mcq_lab_questions

# Weakness thresholds
WEAKNESS_THRESHOLD = UPSC_CSE_PROFILE.weakness_threshold       # Flag as weak below this accuracy
WEAKNESS_MIN_ATTEMPTS = UPSC_CSE_PROFILE.weakness_min_attempts      # Minimum attempts before flagging
RECOVERY_THRESHOLD = UPSC_CSE_PROFILE.recovery_threshold       # Remove flag above this accuracy
RECOVERY_WINDOW = UPSC_CSE_PROFILE.recovery_window            # Look at last N attempts for recovery


# ---------------------------------------------------------------------------
# Data Types
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class McqLabAttempt:
    """A single question attempt within an MCQ Lab session."""
    question_id: int
    question_type: str
    chosen_answer: str
    correct_answer: str
    is_correct: bool
    time_taken_seconds: float | None = None
    # Added with the NEET/JEE question formats (app.core.gs_lms.scoring).
    marks: float | None = None
    answer_format: str = "single"


@dataclass(frozen=True)
class TypeBreakdown:
    """Per-type accuracy breakdown."""
    question_type: str
    total: int
    correct: int
    accuracy: float  # 0.0–1.0


@dataclass(frozen=True)
class McqLabResult:
    """Complete MCQ Lab session result."""
    total_questions: int       # always 15
    correct_count: int
    score: float               # 0.0–1.0
    attempts: List[McqLabAttempt] = field(default_factory=list)
    type_breakdown: List[TypeBreakdown] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Scoring Functions
# ---------------------------------------------------------------------------

def score_mcq_lab(
    attempts: list[McqLabAttempt],
    profile: ExamProfile = UPSC_CSE_PROFILE,
) -> McqLabResult:
    """Score a complete MCQ Lab submission (all ``profile.total_mcq_lab_questions`` answers).

    All-or-nothing per question: correct only when chosen == stored correct.

    Args:
        attempts: List of McqLabAttempt objects.
        profile: Exam profile configuration.

    Returns:
        McqLabResult with overall score and per-type breakdown.
    """
    _ = profile
    total_questions = len(attempts)
    correct_count = sum(1 for a in attempts if a.is_correct)
    score = correct_count / total_questions if total_questions > 0 else 0.0

    # Compute per-type breakdown
    type_stats: Dict[str, tuple[int, int]] = {}  # type -> (correct, total)
    for attempt in attempts:
        qtype = attempt.question_type
        correct, total = type_stats.get(qtype, (0, 0))
        total += 1
        if attempt.is_correct:
            correct += 1
        type_stats[qtype] = (correct, total)

    type_breakdown = [
        TypeBreakdown(
            question_type=qtype,
            total=total,
            correct=correct,
            accuracy=correct / total if total > 0 else 0.0,
        )
        for qtype, (correct, total) in sorted(type_stats.items())
    ]

    return McqLabResult(
        total_questions=total_questions,
        correct_count=correct_count,
        score=score,
        attempts=list(attempts),
        type_breakdown=type_breakdown,
    )


def create_attempt(
    question_id: int,
    question_type: str,
    chosen_answer: str,
    correct_answer: str,
    time_taken_seconds: float | None = None,
) -> McqLabAttempt:
    """Create a McqLabAttempt with all-or-nothing correctness computed.

    Args:
        question_id: The question's database ID.
        question_type: The UPSC question type classification.
        chosen_answer: The student's selected answer.
        correct_answer: The stored correct answer.
        time_taken_seconds: Optional time taken on this question.

    Returns:
        McqLabAttempt with is_correct computed.
    """
    is_correct = chosen_answer.strip().upper() == correct_answer.strip().upper()
    return McqLabAttempt(
        question_id=question_id,
        question_type=question_type,
        chosen_answer=chosen_answer,
        correct_answer=correct_answer,
        is_correct=is_correct,
        time_taken_seconds=time_taken_seconds,
    )


# ---------------------------------------------------------------------------
# Weakness Pattern Functions
# ---------------------------------------------------------------------------

def update_weakness_pattern(
    existing_pattern: Dict[str, tuple[int, int]],
    new_session: McqLabResult,
) -> Dict[str, tuple[int, int]]:
    """Merge new session results into the running weakness pattern.

    For each question type: accumulates (correct, total) across all sessions.

    Args:
        existing_pattern: Current pattern as {type: (correct_count, total_count)}
        new_session: The MCQ Lab result to merge in.

    Returns:
        Updated pattern dict.
    """
    pattern = dict(existing_pattern)

    for breakdown in new_session.type_breakdown:
        existing_correct, existing_total = pattern.get(breakdown.question_type, (0, 0))
        pattern[breakdown.question_type] = (
            existing_correct + breakdown.correct,
            existing_total + breakdown.total,
        )

    return pattern


def select_mcq_lab_questions(
    all_questions: Sequence[T],
    type_getter: Callable[[T], str],
    profile: ExamProfile = UPSC_CSE_PROFILE,
    rng: random.Random | None = None,
) -> list[T]:
    """Select an MCQ Lab question batch following ``profile.mcq_lab_type_distribution``.

    Prefers the configured per-type counts up to ``profile.total_mcq_lab_questions``
    and fills any deficit from the remaining questions without duplicating items.
    """
    target_total = profile.total_mcq_lab_questions
    if len(all_questions) < target_total:
        raise ValueError(
            f"Need at least {target_total} questions for MCQ Lab, got {len(all_questions)}"
        )

    sampler = rng if rng is not None else random
    by_type: Dict[str, list[T]] = {}
    for q in all_questions:
        by_type.setdefault(type_getter(q), []).append(q)

    selected: list[T] = []
    for required_type, count in profile.mcq_lab_type_distribution.items():
        if len(selected) >= target_total or count <= 0:
            continue
        take = min(count, target_total - len(selected))
        available = by_type.get(required_type, [])
        if len(available) >= take:
            selected.extend(sampler.sample(available, take))
        else:
            selected.extend(available)

    if len(selected) < target_total:
        remaining_needed = target_total - len(selected)
        selected_ids = {id(q) for q in selected}
        extras = [q for q in all_questions if id(q) not in selected_ids]
        sampler.shuffle(extras)
        selected.extend(extras[:remaining_needed])

    sampler.shuffle(selected)
    return selected


def get_weak_types(
    pattern: Dict[str, tuple[int, int]],
    weakness_threshold: float | None = None,
    min_attempts: int | None = None,
    profile: ExamProfile = UPSC_CSE_PROFILE,
) -> list[str]:
    """Return question types flagged as weaknesses.

    A type is weak if: accuracy < threshold AND total >= min_attempts.

    Args:
        pattern: Pattern as {type: (correct_count, total_count)}
        weakness_threshold: Accuracy below which a type is weak.
        min_attempts: Minimum attempts before flagging.
        profile: Exam profile supplying default thresholds when omitted.

    Returns:
        List of weak question type strings.
    """
    threshold = (
        profile.weakness_threshold
        if weakness_threshold is None
        else weakness_threshold
    )
    min_att = (
        profile.weakness_min_attempts
        if min_attempts is None
        else min_attempts
    )
    weak_types: list[str] = []

    for qtype, (correct, total) in pattern.items():
        if total >= min_att:
            accuracy = correct / total if total > 0 else 0.0
            if accuracy < threshold:
                weak_types.append(qtype)

    return weak_types


def check_weakness_recovery(
    recent_attempts: list[McqLabAttempt],
    question_type: str,
    recovery_threshold: float | None = None,
    recent_window: int | None = None,
    profile: ExamProfile = UPSC_CSE_PROFILE,
) -> bool:
    """Check if a question type has recovered from weakness status.

    Recovered if accuracy >= recovery_threshold across the most recent
    `recent_window` attempts of that type.

    Args:
        recent_attempts: List of recent attempts (should be pre-filtered to type).
        question_type: The type to check recovery for.
        recovery_threshold: Accuracy threshold for recovery.
        recent_window: Number of recent attempts to consider.
        profile: Exam profile supplying default recovery rules when omitted.

    Returns:
        True if the type has recovered.
    """
    threshold = (
        profile.recovery_threshold
        if recovery_threshold is None
        else recovery_threshold
    )
    window = (
        profile.recovery_window
        if recent_window is None
        else recent_window
    )
    type_attempts = [
        a for a in recent_attempts
        if a.question_type == question_type
    ]

    # Take the most recent N
    recent = type_attempts[-window:] if len(type_attempts) > window else type_attempts

    if len(recent) < window:
        return False

    correct = sum(1 for a in recent if a.is_correct)
    accuracy = correct / len(recent) if recent else 0.0

    return accuracy >= threshold


# ---------------------------------------------------------------------------
# Exports
# ---------------------------------------------------------------------------

__all__ = [
    "REQUIRED_TYPE_DISTRIBUTION",
    "TOTAL_MCQ_LAB_QUESTIONS",
    "WEAKNESS_THRESHOLD",
    "WEAKNESS_MIN_ATTEMPTS",
    "RECOVERY_THRESHOLD",
    "RECOVERY_WINDOW",
    "McqLabAttempt",
    "TypeBreakdown",
    "McqLabResult",
    "score_mcq_lab",
    "select_mcq_lab_questions",
    "create_attempt",
    "update_weakness_pattern",
    "get_weak_types",
    "check_weakness_recovery",
]
