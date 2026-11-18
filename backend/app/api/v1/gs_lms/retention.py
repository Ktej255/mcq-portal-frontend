"""Book-chapter progress and retention checks for the GS LMS.

Routes (not under a subject; auth-gated at the package router):
* GET  /books/{book_id}/progress                     — the book with the student's progress per chapter
* PUT  /books/chapters/{chapter_id}/status           — NOT_STARTED / READING / COMPLETED
* POST /books/chapters/{chapter_id}/retention/start  — a check of REVIEWED questions, no answers
* POST /books/chapters/{chapter_id}/retention/submit — score it; schedules the next review
* GET  /books/reviews/due                            — chapters whose review date has come

Scores are percentages (0-100), like the review checkpoints. Only REVIEWED questions with a correct option are ever served. The rules live in
``app.core.gs_lms.retention``.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.dependencies import consume_mcq_quota, get_current_user
from app.core.gs_lms.models import (
    GsLmsBook,
    GsLmsChapterProgress,
    GsLmsChapterStatusEnum,
    GsLmsRetentionQuestion,
)
from app.core.gs_lms.retention import (
    RETENTION_PASS,
    RetentionError,
    answerable_filter,
    due_reviews,
    set_status,
    start_check,
    submit_check,
)
from app.db.session import get_db
from app.models.domain import User
from app.schemas.common import StandardResponse

router = APIRouter()


class ChapterStatusIn(BaseModel):
    status: GsLmsChapterStatusEnum


class AnswerIn(BaseModel):
    question_id: int
    selected_option: str = Field(..., max_length=8)


class SubmitIn(BaseModel):
    answers: list[AnswerIn]


class ChapterProgressOut(BaseModel):
    chapter_id: int
    number: int
    title: str
    status: str = "NOT_STARTED"
    best_score: Optional[float] = None
    last_score: Optional[float] = None
    checks_taken: int = 0
    next_review_at: Optional[str] = None
    question_count: int = 0


class BookProgressOut(BaseModel):
    book_id: int
    slug: str
    title: str
    author: str
    edition: str
    chapters: list[ChapterProgressOut]


class RetentionQuestionOut(BaseModel):
    question_id: int
    question_type: str
    question_text: str
    options: list[dict[str, Any]]
    display_order: int


class RetentionStartOut(BaseModel):
    chapter_id: int
    total_questions: int
    pass_score: float
    questions: list[RetentionQuestionOut]


class RetentionAttemptOut(BaseModel):
    question_id: int
    selected_option: str
    correct_option: str
    is_correct: bool
    explanation: Optional[str] = None


class RetentionResultOut(BaseModel):
    chapter_id: int
    total_questions: int
    correct_count: int
    score: float  # percent, like checkpoints
    passed: bool
    pass_score: float
    best_score: float
    checks_taken: int
    status: str
    next_review_at: str
    next_review_in_days: int
    attempts: list[RetentionAttemptOut]


class DueReviewOut(BaseModel):
    chapter_id: int
    number: int
    title: str
    book_id: int
    book_title: str
    book_edition: str
    last_score: Optional[float] = None
    next_review_at: str


def _iso(dt: Optional[datetime]) -> Optional[str]:
    return dt.isoformat() if isinstance(dt, datetime) else None


def _pct(score: Optional[float]) -> Optional[float]:
    return None if score is None else round(score * 100, 1)


def _fail(err: RetentionError) -> HTTPException:
    return HTTPException(status_code=err.status_code, detail=err.detail)


@router.get("/books/reviews/due")
def get_due_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    rows = due_reviews(db, current_user.id)
    return StandardResponse(
        success=True,
        message="Reviews due",
        data=[
            DueReviewOut(
                chapter_id=ch.id, number=ch.number, title=ch.title,
                book_id=book.id, book_title=book.title, book_edition=book.edition,
                last_score=_pct(p.last_score), next_review_at=_iso(p.next_review_at),
            )
            for p, ch, book in rows
        ],
    )


@router.get("/books/{book_id}/progress")
def get_book_progress(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    book = db.get(GsLmsBook, book_id)
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    chapter_ids = [c.id for c in book.chapters]
    progress = {
        p.chapter_id: p
        for p in db.query(GsLmsChapterProgress)
        .filter(GsLmsChapterProgress.student_id == current_user.id, GsLmsChapterProgress.chapter_id.in_(chapter_ids))
        .all()
    } if chapter_ids else {}
    counts = dict(
        db.query(GsLmsRetentionQuestion.book_chapter_id, func.count(GsLmsRetentionQuestion.id))
        .filter(GsLmsRetentionQuestion.book_chapter_id.in_(chapter_ids), *answerable_filter())
        .group_by(GsLmsRetentionQuestion.book_chapter_id)
        .all()
    ) if chapter_ids else {}
    chapters = []
    for c in book.chapters:
        p = progress.get(c.id)
        chapters.append(ChapterProgressOut(
            chapter_id=c.id, number=c.number, title=c.title,
            status=p.status.value if p else "NOT_STARTED",
            best_score=_pct(p.best_score) if p else None,
            last_score=_pct(p.last_score) if p else None,
            checks_taken=(p.checks_taken or 0) if p else 0,
            next_review_at=_iso(p.next_review_at) if p else None,
            question_count=int(counts.get(c.id, 0)),
        ))
    return StandardResponse(
        success=True,
        message="Book progress",
        data=BookProgressOut(
            book_id=book.id, slug=book.slug, title=book.title, author=book.author,
            edition=book.edition, chapters=chapters,
        ),
    )


@router.put("/books/chapters/{chapter_id}/status")
def put_chapter_status(
    chapter_id: int,
    body: ChapterStatusIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    try:
        p = set_status(db, current_user.id, chapter_id, body.status)
    except RetentionError as err:
        raise _fail(err)
    db.commit()
    return StandardResponse(
        success=True,
        message="Chapter status saved",
        data={
            "chapter_id": chapter_id,
            "status": p.status.value,
            "completed_at": _iso(p.completed_at),
            "next_review_at": _iso(p.next_review_at),
        },
    )


@router.post("/books/chapters/{chapter_id}/retention/start")
def start_retention_check(
    chapter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Draw the check: REVIEWED questions of this chapter, without answers."""
    try:
        questions = start_check(db, current_user.id, chapter_id)
    except RetentionError as err:
        raise _fail(err)
    db.commit()
    return StandardResponse(
        success=True,
        message="Retention check",
        data=RetentionStartOut(
            chapter_id=chapter_id,
            total_questions=len(questions),
            pass_score=round(RETENTION_PASS * 100, 1),
            questions=[
                RetentionQuestionOut(
                    question_id=q.id, question_type=q.question_type, question_text=q.question_text,
                    options=[{"label": o["label"], "text": o["text"]} for o in (q.options or [])],
                    display_order=i + 1,
                )
                for i, q in enumerate(questions)
            ],
        ),
    )


@router.post("/books/chapters/{chapter_id}/retention/submit")
def submit_retention_check(
    chapter_id: int,
    body: SubmitIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Score the check. The MCQ quota is charged for len(answers) only once the
    answers are known to match the started check, so a rejected submit costs nothing."""
    try:
        result = submit_check(
            db, current_user.id, chapter_id,
            [(a.question_id, a.selected_option) for a in body.answers],
            on_validated=lambda: consume_mcq_quota(db, current_user, len(body.answers)),
        )
    except RetentionError as err:
        db.rollback()
        raise _fail(err)
    db.commit()
    return StandardResponse(
        success=True,
        message="Retention check result",
        data=RetentionResultOut(
            chapter_id=chapter_id,
            total_questions=result.total,
            correct_count=result.correct,
            score=round(result.score * 100, 1),
            passed=result.passed,
            pass_score=round(RETENTION_PASS * 100, 1),
            best_score=round(result.best_score * 100, 1),
            checks_taken=result.checks_taken,
            status=result.status,
            next_review_at=_iso(result.next_review_at),
            next_review_in_days=result.next_review_in_days,
            attempts=[
                RetentionAttemptOut(
                    question_id=a.question_id, selected_option=a.selected_option,
                    correct_option=a.correct_option, is_correct=a.is_correct, explanation=a.explanation,
                )
                for a in result.attempts
            ],
        ),
    )
