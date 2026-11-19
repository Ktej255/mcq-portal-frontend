from __future__ import annotations

import logging
import math
from datetime import date, datetime, timedelta, timezone
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.core.gs_lms.spaced_repetition import (
    MAX_INTERVAL_DAYS,
    MIN_INTERVAL_DAYS,
    compute_initial_interval,
    compute_next_interval,
    handle_missed_session,
)
from app.models.domain import Attempt, AttemptAnswer, ConfidenceEnum, Question, RevisionQueue

logger = logging.getLogger(__name__)

_OVERCONFIDENT_LEVELS = {
    ConfidenceEnum.HUNDRED_PERCENT,
    ConfidenceEnum.FAIRLY_SURE,
    ConfidenceEnum.HUNDRED_PERCENT.value,
    ConfidenceEnum.FAIRLY_SURE.value,
}


def _ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def append_retention_snapshot(
    item: RevisionQueue,
    mastery: float,
    event: str,
    now: Optional[datetime] = None,
    is_overconfident: Optional[bool] = None,
    rating: Optional[str] = None,
) -> None:
    """Append a mastery snapshot to ``item.retention_history``, keeping the last 25 entries."""
    history = list(item.retention_history) if isinstance(item.retention_history, list) else []
    ts = _ensure_utc(now or datetime.now(timezone.utc))
    entry: dict[str, Any] = {
        "timestamp": ts.isoformat(),
        "mastery": round(max(0.0, min(1.0, float(mastery))), 4),
        "event": event,
    }
    if rating is not None:
        entry["rating"] = rating
    if is_overconfident is not None:
        entry["is_overconfident"] = bool(is_overconfident)
    history.append(entry)
    item.retention_history = history[-25:]


def populate_revision_queue_from_attempt(db: Session, attempt_id: int, user_id: int):
    """
    Analyzes an attempt and populates the revision queue with incorrect,
    overconfidence-trap, or flagged questions.
    """
    logger.info(f"FORENSIC | Populating Revision Queue for Attempt {attempt_id}")

    answers = db.query(AttemptAnswer).filter(AttemptAnswer.attempt_id == attempt_id).all()

    for ans in answers:
        if ans.question is None:
            continue

        # 1. Handle Incorrect Answers (distinguish Overconfidence Traps)
        if ans.is_correct == False and not ans.is_skipped:
            conf_val = ans.confidence_level.value if hasattr(ans.confidence_level, "value") else ans.confidence_level
            is_overconfident = (
                ans.confidence_level in _OVERCONFIDENT_LEVELS
                or conf_val in _OVERCONFIDENT_LEVELS
            )
            if is_overconfident:
                _upsert_revision_item(
                    db,
                    user_id,
                    ans.question.topic_id,
                    ans.question_id,
                    reason="OVERCONFIDENCE_TRAP",
                    category="OVERCONFIDENCE_TRAP",
                    priority=1.5,
                    is_overconfident=True,
                )
            else:
                _upsert_revision_item(
                    db,
                    user_id,
                    ans.question.topic_id,
                    ans.question_id,
                    reason="INCORRECT_ANSWER",
                    category="MISTAKE",
                    priority=1.0,
                    is_overconfident=False,
                )

        # 2. Handle Marked for Review
        elif ans.marked_for_review:
            _upsert_revision_item(
                db,
                user_id,
                ans.question.topic_id,
                ans.question_id,
                reason="MARKED_FOR_REVIEW",
                category="WEAKNESS",
                priority=0.5,
                is_overconfident=False,
            )


def _upsert_revision_item(
    db: Session,
    user_id: int,
    topic_id: int,
    question_id: int,
    reason: str,
    category: str,
    priority: float,
    is_overconfident: bool = False,
):
    now = datetime.now(timezone.utc)
    # Check if already in queue
    existing = db.query(RevisionQueue).filter(
        RevisionQueue.user_id == user_id,
        RevisionQueue.question_id == question_id,
    ).first()

    if existing:
        existing.priority_score = max(float(existing.priority_score or 0.0), priority)
        if is_overconfident:
            existing.is_overconfident = True
            existing.category = "OVERCONFIDENCE_TRAP"
            existing.reason = reason
        elif existing.category != "OVERCONFIDENCE_TRAP":
            existing.category = category
            existing.reason = reason

        if category in {"OVERCONFIDENCE_TRAP", "MISTAKE"}:
            existing.forgetting_count = int(existing.forgetting_count or 0) + 1
            current_decay = float(existing.decay_rate if existing.decay_rate is not None else 1.0)
            existing.decay_rate = round(min(3.0, current_decay + 0.2), 4)

        append_retention_snapshot(
            existing,
            mastery=float(existing.mastery_level or 0.0),
            event="repeat_miss" if category in {"OVERCONFIDENCE_TRAP", "MISTAKE"} else "flagged_again",
            now=now,
            is_overconfident=bool(existing.is_overconfident),
        )
        # If they got it wrong again, move it to the front of the queue
        existing.next_review_at = now
        logger.info(f"FORENSIC | Updated Revision Item for Q{question_id}")
    else:
        new_item = RevisionQueue(
            user_id=user_id,
            topic_id=topic_id,
            question_id=question_id,
            reason=reason,
            category=category,
            priority_score=priority,
            forgetting_count=0,
            decay_rate=1.0,
            is_overconfident=bool(is_overconfident),
            retention_history=[
                {
                    "timestamp": now.isoformat(),
                    "mastery": 0.0,
                    "event": "created",
                    "is_overconfident": bool(is_overconfident),
                }
            ],
            next_review_at=now,
            mastery_level=0.0,
            review_count=0,
        )
        db.add(new_item)
        logger.info(f"FORENSIC | Created Revision Item for Q{question_id}")

    db.commit()


def compute_adaptive_revision_schedule(
    current_mastery: float,
    new_mastery: float,
    review_count: int,
    last_reviewed_at: Optional[datetime],
    next_review_at: Optional[datetime],
    now: datetime,
    is_correct: bool = True,
    rating: Optional[str] = None,
) -> tuple[int, datetime]:
    """Compute adaptive spaced-repetition interval in [1, 90] days and next review timestamp.

    Delegates interval math to ``app.core.gs_lms.spaced_repetition``.
    """
    now_utc = _ensure_utc(now)
    prev_score = max(0.0, min(1.0, float(current_mastery or 0.0)))
    curr_score = max(0.0, min(1.0, float(new_mastery or 0.0)))
    normalized_rating = rating.strip().lower() if isinstance(rating, str) else None

    missed_entry = None
    if next_review_at is not None:
        scheduled_date = (
            next_review_at.date()
            if isinstance(next_review_at, datetime)
            else next_review_at
        )
        missed_entry = handle_missed_session(scheduled_date, now_utc.date())

    if not is_correct or normalized_rating == "blank":
        interval_days = compute_initial_interval(0.0)
    elif review_count <= 1 or last_reviewed_at is None:
        interval_days = compute_initial_interval(curr_score)
    else:
        last_utc = _ensure_utc(last_reviewed_at)
        if next_review_at is not None:
            next_utc = _ensure_utc(next_review_at)
            current_interval = max(1, (next_utc - last_utc).days)
        else:
            current_interval = max(1, (now_utc - last_utc).days)

        effective_prev_score = (
            None if (is_correct and curr_score >= 1.0 and prev_score >= 1.0) else prev_score
        )
        interval_days = compute_next_interval(
            current_interval=current_interval,
            current_score=curr_score,
            previous_score=effective_prev_score,
        )

    if normalized_rating == "shaky" and is_correct:
        interval_days = min(interval_days, 3)

    if missed_entry is not None:
        interval_days = min(interval_days, missed_entry.recall_interval_days)

    interval_days = max(MIN_INTERVAL_DAYS, min(MAX_INTERVAL_DAYS, int(interval_days)))
    next_review_dt = now_utc + timedelta(days=interval_days)
    return interval_days, next_review_dt


def compute_exam_countdown_pacing(
    total_due: int,
    estimated_minutes_today: int,
    exam_date_str: Optional[str],
    daily_minutes: int,
) -> dict[str, Any]:
    """Compute honest exam-countdown pacing metrics.

    Returns ``None`` for ``days_remaining`` and ``projected_cycles_before_exam``
    whenever ``exam_date_str`` is omitted, invalid, or in the past.
    """
    safe_total_due = max(0, int(total_due or 0))
    safe_estimated_minutes = max(0, int(estimated_minutes_today or 0))
    safe_daily_minutes = max(1, int(daily_minutes or 25))

    parsed_exam_date: Optional[date] = None
    if isinstance(exam_date_str, str) and exam_date_str.strip():
        try:
            parsed_exam_date = date.fromisoformat(exam_date_str.strip())
        except ValueError:
            parsed_exam_date = None

    today = date.today()
    days_remaining: Optional[int] = None
    projected_cycles: Optional[float] = None

    if parsed_exam_date is not None:
        delta_days = (parsed_exam_date - today).days
        if delta_days > 0:
            days_remaining = delta_days
            if safe_total_due == 0:
                projected_cycles = 0.0
            else:
                cycle_minutes = (
                    safe_estimated_minutes
                    if safe_estimated_minutes > 0
                    else safe_total_due * 3
                )
                days_per_cycle = max(1.0, cycle_minutes / safe_daily_minutes)
                projected_cycles = round(days_remaining / days_per_cycle, 2)

    capacity_items = max(1, safe_daily_minutes // 3)
    if safe_total_due == 0:
        recommended_daily_items = 0
    elif days_remaining is not None and days_remaining > 0:
        needed_per_day = math.ceil(safe_total_due / days_remaining)
        recommended_daily_items = min(safe_total_due, max(capacity_items, needed_per_day))
    else:
        recommended_daily_items = min(safe_total_due, capacity_items)

    return {
        "exam_date": parsed_exam_date.isoformat() if parsed_exam_date is not None else None,
        "days_remaining": days_remaining,
        "daily_minutes": safe_daily_minutes,
        "estimated_minutes_today": safe_estimated_minutes,
        "recommended_daily_items": recommended_daily_items,
        "projected_cycles_before_exam": projected_cycles,
    }
