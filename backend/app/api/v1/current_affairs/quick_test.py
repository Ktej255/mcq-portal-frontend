"""CA Quick Test endpoints — "Test Anytime" feature.

Students can trigger on-demand quizzes at any time:
- Test today's CA
- Test this week's CA
- Test by subject
- Test random mix

Requirements: Enhancement 3 (Test Anytime)
"""

from __future__ import annotations

import random
from datetime import date, timedelta
from typing import Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.domain import User
from app.api.dependencies import get_current_user
from app.core.current_affairs.ca_models import CAItem, CAMcq

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class QuickTestMcqOut(BaseModel):
    id: int
    question_text: str
    question_type: str
    options: list
    item_title: str
    item_date: str


class QuickTestOut(BaseModel):
    quiz_label: str
    mcqs: List[QuickTestMcqOut]
    total_count: int


class QuickTestSubmitIn(BaseModel):
    question_ids: List[int] = Field(..., min_length=1, max_length=30)
    answers: Dict[int, str]


class QuickTestAttemptOut(BaseModel):
    question_id: int
    chosen_answer: str
    is_correct: bool
    question_type: str
    explanation: Optional[str] = None


class QuickTestResultOut(BaseModel):
    total_questions: int
    correct_count: int
    score: float
    persistence_status: Literal["not_persisted"] = "not_persisted"
    attempt_id: Literal[None] = None
    attempts: List[QuickTestAttemptOut]


def _option_labels(question: CAMcq) -> Optional[set[str]]:
    """Return normalized option labels only for a complete published MCQ."""
    if not isinstance(question.question_text, str) or not question.question_text.strip():
        return None
    if not isinstance(question.question_type, str) or not question.question_type.strip():
        return None
    if not isinstance(question.options, list) or not question.options:
        return None

    labels: set[str] = set()
    for option in question.options:
        if not isinstance(option, dict):
            return None
        label = option.get("label")
        text = option.get("text")
        if (
            not isinstance(label, str)
            or not label.strip()
            or not isinstance(text, str)
            or not text.strip()
        ):
            return None
        normalized_label = label.strip().casefold()
        if normalized_label in labels:
            return None
        labels.add(normalized_label)

    if not isinstance(question.correct_answer, str) or not question.correct_answer.strip():
        return None
    if question.correct_answer.strip().casefold() not in labels:
        return None
    return labels


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/quick-test", response_model=QuickTestOut)
def get_quick_test(
    scope: str = Query("today", regex="^(today|this_week|this_month|subject)$"),
    subject: Optional[str] = Query(None),
    count: int = Query(10, ge=5, le=30),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate an on-demand quiz from CA items.

    Scopes:
    - today: MCQs from today's published items
    - this_week: MCQs from the last 7 days
    - this_month: MCQs from the last 30 days
    - subject: MCQs filtered by subject (requires subject param)
    """
    today = date.today()

    # Build item filter based on scope
    item_query = db.query(CAItem).filter(
        CAItem.review_status == "PUBLISHED",
        CAItem.is_deleted == False,
    )

    if scope == "today":
        item_query = item_query.filter(CAItem.publish_date == today)
        label = "Today's Current Affairs"
    elif scope == "this_week":
        week_ago = today - timedelta(days=7)
        item_query = item_query.filter(CAItem.publish_date >= week_ago)
        label = "This Week's Current Affairs"
    elif scope == "this_month":
        month_ago = today - timedelta(days=30)
        item_query = item_query.filter(CAItem.publish_date >= month_ago)
        label = "Last 30 Days"
    elif scope == "subject":
        if not subject:
            raise HTTPException(status_code=422, detail="subject parameter required for scope=subject")
        item_query = item_query.filter(CAItem.subject == subject)
        label = f"{subject.replace('-', ' ').title()} Current Affairs"
    else:
        label = "Quick Test"

    # Get item IDs
    item_ids = [row[0] for row in item_query.with_entities(CAItem.id).all()]

    if not item_ids:
        return QuickTestOut(quiz_label=label, mcqs=[], total_count=0)

    # Get MCQs from those items. Do not issue malformed published data to the client;
    # it cannot be scored honestly from the stored answer/options contract.
    mcqs = (
        db.query(CAMcq)
        .filter(CAMcq.ca_item_id.in_(item_ids))
        .all()
    )
    mcqs = [mcq for mcq in mcqs if _option_labels(mcq) is not None]

    if not mcqs:
        return QuickTestOut(quiz_label=label, mcqs=[], total_count=0)

    # Random sample up to count
    selected = random.sample(mcqs, min(count, len(mcqs)))

    # Build response with item context
    item_map = {
        row.id: row for row in
        db.query(CAItem).filter(CAItem.id.in_([m.ca_item_id for m in selected])).all()
    }

    result_mcqs = []
    for mcq in selected:
        item = item_map.get(mcq.ca_item_id)
        if item is None:
            continue
        result_mcqs.append(
            QuickTestMcqOut(
                id=mcq.id,
                question_text=mcq.question_text,
                question_type=mcq.question_type,
                options=mcq.options,
                item_title=item.title,
                item_date=item.publish_date.isoformat(),
            )
        )

    return QuickTestOut(
        quiz_label=label,
        mcqs=result_mcqs,
        total_count=len(result_mcqs),
    )


@router.post("/quick-test/submit", response_model=QuickTestResultOut)
def submit_quick_test(
    body: QuickTestSubmitIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Score a submitted quick-test set against published CA questions.

    This is intentionally stateless until an approved quick-test attempt schema
    exists. The server remains authoritative for the score, but the result is
    not a durable attempt or reloadable history record.
    """
    if not body.question_ids:
        raise HTTPException(status_code=422, detail="At least one question is required")
    if len(body.question_ids) != len(set(body.question_ids)):
        raise HTTPException(status_code=422, detail="Question IDs must be unique")
    if set(body.answers) != set(body.question_ids):
        raise HTTPException(status_code=422, detail="Answers must cover the submitted question set")
    if any(not isinstance(answer, str) or not answer.strip() for answer in body.answers.values()):
        raise HTTPException(status_code=422, detail="Answers must be non-empty option labels")

    questions = (
        db.query(CAMcq)
        .join(CAItem, CAMcq.ca_item_id == CAItem.id)
        .filter(
            CAMcq.id.in_(body.question_ids),
            CAItem.review_status == "PUBLISHED",
            CAItem.is_deleted == False,
        )
        .all()
    )
    question_map = {question.id: question for question in questions}
    if len(question_map) != len(body.question_ids):
        raise HTTPException(status_code=409, detail="One or more questions are no longer available")

    option_labels_by_id: dict[int, set[str]] = {}
    for question in questions:
        labels = _option_labels(question)
        if labels is None:
            raise HTTPException(status_code=409, detail="One or more published questions have incomplete data")
        option_labels_by_id[question.id] = labels

    attempts = []
    correct_count = 0
    for question_id in body.question_ids:
        question = question_map[question_id]
        chosen_answer = body.answers[question_id].strip()
        normalized_answer = chosen_answer.casefold()
        if normalized_answer not in option_labels_by_id[question_id]:
            raise HTTPException(status_code=422, detail="Each answer must match an available option label")
        is_correct = normalized_answer == question.correct_answer.strip().casefold()
        if is_correct:
            correct_count += 1
        attempts.append(
            QuickTestAttemptOut(
                question_id=question_id,
                chosen_answer=chosen_answer,
                is_correct=is_correct,
                question_type=question.question_type,
                explanation=question.explanation,
            )
        )

    total_questions = len(attempts)
    return QuickTestResultOut(
        total_questions=total_questions,
        correct_count=correct_count,
        score=round(correct_count / total_questions * 100, 1),
        persistence_status="not_persisted",
        attempt_id=None,
        attempts=attempts,
    )
