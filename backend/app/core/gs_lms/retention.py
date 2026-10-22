"""Retention checks for book chapters: "I finished the chapter, do I remember it?"

A student reads a chapter in their own book, then takes a short test of
REVIEWED questions tied to that chapter. Same safety pattern as the review
checkpoints: the drawn question ids are stored at start, submit must answer
exactly those, and one start allows one submission.

Scores feed the existing spaced-repetition rules (``spaced_repetition``): a weak
result brings the next review sooner. Functions flush but never commit; the
caller owns the transaction.
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Callable, Optional, Sequence

from sqlalchemy.orm import Session

from app.core.gs.models import GsReviewStatusEnum
from app.core.gs_lms.models import (
    GsLmsBook,
    GsLmsBookChapter,
    GsLmsChapterProgress,
    GsLmsChapterStatusEnum,
    GsLmsRetentionQuestion,
)
from app.core.gs_lms.spaced_repetition import (
    SHORT_INTERVAL_MAX,
    compute_initial_interval,
    compute_next_interval,
)

RETENTION_QUESTIONS = 10
RETENTION_MIN_QUESTIONS = 3
RETENTION_PASS = 0.7

_QUALITY_RANK = {"ok": 0, "short": 1, "missing": 2}


class RetentionError(Exception):
    """A rule was broken; ``status_code`` is the HTTP status the API should use."""

    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code, self.detail = status_code, detail


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _naive(dt: datetime) -> datetime:
    return dt.astimezone(timezone.utc).replace(tzinfo=None) if dt.tzinfo else dt


# ---------------------------------------------------------------------------
# Questions
# ---------------------------------------------------------------------------

def answerable_filter():
    """SQL conditions of a question a student may be asked."""
    return (
        GsLmsRetentionQuestion.review_status == GsReviewStatusEnum.REVIEWED,
        GsLmsRetentionQuestion.correct_option.isnot(None),
    )


def eligible_questions(db: Session, chapter_id: int) -> list[GsLmsRetentionQuestion]:
    return (
        db.query(GsLmsRetentionQuestion)
        .filter(GsLmsRetentionQuestion.book_chapter_id == chapter_id, *answerable_filter())
        .order_by(GsLmsRetentionQuestion.id)
        .all()
    )


def pick_questions(
    pool: Sequence[GsLmsRetentionQuestion],
    count: int = RETENTION_QUESTIONS,
    avoid: Optional[set[int]] = None,
    rng: Optional[random.Random] = None,
) -> list[GsLmsRetentionQuestion]:
    """Up to ``count`` questions: not in ``avoid`` while enough others exist,
    explained ones first, question types mixed, in random order."""
    rng = rng or random.Random()
    avoid = avoid or set()
    fresh = [q for q in pool if q.id not in avoid]
    repeats = [q for q in pool if q.id in avoid]

    def mixed(candidates: list[GsLmsRetentionQuestion], n: int) -> list[GsLmsRetentionQuestion]:
        shuffled = list(candidates)
        rng.shuffle(shuffled)
        shuffled.sort(key=lambda q: _QUALITY_RANK.get(q.explanation_quality, 3))  # stable
        by_type: dict[str, list[GsLmsRetentionQuestion]] = {}
        for q in shuffled:
            by_type.setdefault(q.question_type or "FACTUAL", []).append(q)
        groups = list(by_type.values())
        rng.shuffle(groups)
        out: list[GsLmsRetentionQuestion] = []
        while len(out) < n and any(groups):
            for g in groups:
                if g and len(out) < n:
                    out.append(g.pop(0))
        return out

    chosen = mixed(fresh, count)
    if len(chosen) < count:  # not enough new ones: top up with earlier ones
        chosen += mixed(repeats, count - len(chosen))
    rng.shuffle(chosen)
    return chosen


# ---------------------------------------------------------------------------
# Progress rows
# ---------------------------------------------------------------------------

def get_chapter(db: Session, chapter_id: int) -> GsLmsBookChapter:
    chapter = db.get(GsLmsBookChapter, chapter_id)
    if chapter is None:
        raise RetentionError(404, "Chapter not found")
    return chapter


def get_progress(db: Session, student_id: int, chapter_id: int) -> Optional[GsLmsChapterProgress]:
    return (
        db.query(GsLmsChapterProgress)
        .filter(GsLmsChapterProgress.student_id == student_id, GsLmsChapterProgress.chapter_id == chapter_id)
        .one_or_none()
    )


def _ensure_progress(db: Session, student_id: int, chapter_id: int) -> GsLmsChapterProgress:
    progress = get_progress(db, student_id, chapter_id)
    if progress is None:
        progress = GsLmsChapterProgress(
            student_id=student_id, chapter_id=chapter_id,
            status=GsLmsChapterStatusEnum.NOT_STARTED, checks_taken=0,
        )
        db.add(progress)
        db.flush()
    return progress


def set_status(
    db: Session, student_id: int, chapter_id: int, status: GsLmsChapterStatusEnum
) -> GsLmsChapterProgress:
    """Mark a chapter NOT_STARTED / READING / COMPLETED (scores are kept)."""
    get_chapter(db, chapter_id)
    progress = _ensure_progress(db, student_id, chapter_id)
    progress.status = status
    if status == GsLmsChapterStatusEnum.COMPLETED:
        if progress.completed_at is None:
            progress.completed_at = _now()
    elif status == GsLmsChapterStatusEnum.NOT_STARTED:
        progress.completed_at = None
        progress.next_review_at = None
        progress.question_ids = None
    db.flush()
    return progress


# ---------------------------------------------------------------------------
# Start / submit
# ---------------------------------------------------------------------------

def start_check(
    db: Session, student_id: int, chapter_id: int, rng: Optional[random.Random] = None
) -> list[GsLmsRetentionQuestion]:
    """Draw a check for the chapter and remember it. 409 if the chapter has
    fewer than RETENTION_MIN_QUESTIONS answerable questions."""
    get_chapter(db, chapter_id)
    pool = eligible_questions(db, chapter_id)
    if len(pool) < RETENTION_MIN_QUESTIONS:
        raise RetentionError(409, "Not enough reviewed questions for this chapter yet")
    progress = _ensure_progress(db, student_id, chapter_id)
    avoid = set(progress.previous_question_ids or []) | set(progress.question_ids or [])
    questions = pick_questions(pool, RETENTION_QUESTIONS, avoid, rng)
    progress.question_ids = [q.id for q in questions]  # a new start replaces the stored set
    db.flush()
    return questions


@dataclass
class CheckAttempt:
    question_id: int
    selected_option: str
    correct_option: str
    is_correct: bool
    explanation: Optional[str]


@dataclass
class CheckResult:
    chapter_id: int
    total: int
    correct: int
    score: float  # 0.0-1.0
    passed: bool
    attempts: list[CheckAttempt]
    best_score: float
    checks_taken: int
    status: str
    next_review_at: datetime
    next_review_in_days: int


def next_interval_days(
    score: float,
    previous_score: Optional[float],
    last_check_at: Optional[datetime],
    next_review_at: Optional[datetime],
) -> int:
    """Days until the next review, from the spaced-repetition rules.

    First check: the initial interval for the score (weak 1-3 days, strong 5-7).
    Later checks: grow when the score improved, halve when it did not. A score
    below RETENTION_PASS never waits longer than SHORT_INTERVAL_MAX days.
    """
    if previous_score is None or last_check_at is None or next_review_at is None:
        days = compute_initial_interval(score)
    else:
        used = max(1, (_naive(next_review_at) - _naive(last_check_at)).days)
        days = compute_next_interval(used, score, previous_score)
    if score < RETENTION_PASS:
        days = min(days, compute_initial_interval(min(score, 0.59)), SHORT_INTERVAL_MAX)
    return max(1, days)


def submit_check(
    db: Session,
    student_id: int,
    chapter_id: int,
    answers: Sequence[tuple[int, str]],
    on_validated: Optional[Callable[[], None]] = None,
) -> CheckResult:
    """Score a check. ``answers`` are (question_id, selected_option) pairs for
    exactly the stored questions. ``on_validated`` runs after the checks pass
    and before anything is changed (used to charge the MCQ quota)."""
    get_chapter(db, chapter_id)
    progress = get_progress(db, student_id, chapter_id)
    if progress is None or not progress.question_ids:
        raise RetentionError(409, "Start the check before submitting")

    ids = [a[0] for a in answers]
    if len(set(ids)) != len(ids):
        raise RetentionError(422, "Duplicate question in answers")
    if set(ids) != set(progress.question_ids):
        raise RetentionError(422, "Answers must be for exactly the questions you were given")

    questions = {
        q.id: q
        for q in db.query(GsLmsRetentionQuestion)
        .filter(GsLmsRetentionQuestion.id.in_(ids), *answerable_filter())
        .all()
    }
    if len(questions) != len(ids):
        raise RetentionError(409, "Some questions are no longer available; start the check again")

    if on_validated is not None:
        on_validated()

    attempts = []
    for qid, selected in answers:
        q = questions[qid]
        ok = (selected or "").strip().upper() == str(q.correct_option).strip().upper()
        attempts.append(CheckAttempt(qid, selected, q.correct_option, ok, q.explanation))
    total = len(attempts)
    correct = sum(1 for a in attempts if a.is_correct)
    score = correct / total

    now = _now()
    days = next_interval_days(score, progress.last_score, progress.last_check_at, progress.next_review_at)
    progress.last_score = score
    progress.best_score = max(score, progress.best_score or 0.0)
    progress.checks_taken = (progress.checks_taken or 0) + 1
    progress.last_check_at = now
    progress.next_review_at = now + timedelta(days=days)
    if progress.status != GsLmsChapterStatusEnum.COMPLETED:
        progress.status = GsLmsChapterStatusEnum.COMPLETED
        progress.completed_at = progress.completed_at or now
    progress.previous_question_ids = list(progress.question_ids)
    progress.question_ids = None  # one submission per start
    db.flush()

    return CheckResult(
        chapter_id=chapter_id, total=total, correct=correct, score=score,
        passed=score >= RETENTION_PASS, attempts=attempts,
        best_score=progress.best_score, checks_taken=progress.checks_taken,
        status=progress.status.value, next_review_at=progress.next_review_at,
        next_review_in_days=days,
    )


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------

def due_reviews(
    db: Session, student_id: int, now: Optional[datetime] = None
) -> list[tuple[GsLmsChapterProgress, GsLmsBookChapter, GsLmsBook]]:
    """Chapters whose next review date has come, oldest first."""
    now = _naive(now) if now else _now()
    return (
        db.query(GsLmsChapterProgress, GsLmsBookChapter, GsLmsBook)
        .join(GsLmsBookChapter, GsLmsBookChapter.id == GsLmsChapterProgress.chapter_id)
        .join(GsLmsBook, GsLmsBook.id == GsLmsBookChapter.book_id)
        .filter(
            GsLmsChapterProgress.student_id == student_id,
            GsLmsChapterProgress.next_review_at.isnot(None),
            GsLmsChapterProgress.next_review_at <= now,
        )
        .order_by(GsLmsChapterProgress.next_review_at, GsLmsChapterProgress.id)
        .all()
    )


__all__ = [
    "RETENTION_QUESTIONS", "RETENTION_MIN_QUESTIONS", "RETENTION_PASS",
    "RetentionError", "CheckAttempt", "CheckResult",
    "eligible_questions", "pick_questions", "set_status", "start_check",
    "submit_check", "due_reviews", "next_interval_days", "get_progress",
]
