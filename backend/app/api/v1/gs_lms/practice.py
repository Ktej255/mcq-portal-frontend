"""MCQ Practice endpoints for the GS LMS Platform.

Routes (mounted under /api/v1/gs-lms/{subject_slug}; auth-gated at the package router):
* GET /practice/{session_id} — Retrieve active practice session
* POST /practice/start — Create a practice session for a topic
* POST /practice/{session_id}/answer — Record answer for current question
* POST /practice/{session_id}/skip — Skip current question
* POST /practice/{session_id}/submit — Finalize and score session

Design properties enforced:
* Property 10 (Sequential MCQ access control): only the current question is
  exposed; advance only after answer/skip.
* Property 11 (MCQ scoring and per-type accuracy): total_score and per-type
  accuracy computed on submission.
* Property 19 (review-gate): only REVIEWED MCQ questions are presented.

Requirements traced: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 9.1, 9.2
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.domain import User
from app.api.dependencies import get_current_user, mcq_quota
from app.schemas.common import StandardResponse
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.models import (
    GsLmsSyllabusNode,
    GsLmsMcqQuestion,
)
from app.core.gs_lms.student_models import (
    GsLmsPracticeSession,
    GsLmsPracticeAttempt,
    GsLmsPracticeSessionStatusEnum,
)
from app.core.gs_lms.mcq_scoring import (
    Attempt,
    compute_score,
    compute_type_accuracy,
)
from app.core.gs_lms.coverage import create_gap_snapshot
from app.api.v1.gs_lms.dependencies import ensure_beta_topic, resolve_subject
from app.api.v1.gs_lms.schemas import (
    GsLmsPracticeStartIn,
    GsLmsPracticeSessionOut,
    GsLmsPracticeAnswerIn,
    GsLmsPracticeResultOut,
    GsLmsMcqQuestionOut,
    GsLmsMcqOptionOut,
    GsLmsQuestionTypeAccuracyOut,
    GsLmsPracticeAttemptResultOut,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_session_owned_by(
    db: Session, session_id: int, student_id: int, subject_id: int
) -> GsLmsPracticeSession:
    """Retrieve a student's practice session under the requested subject."""
    session = (
        db.query(GsLmsPracticeSession)
        .join(
            GsLmsSyllabusNode,
            GsLmsSyllabusNode.id == GsLmsPracticeSession.syllabus_node_id,
        )
        .filter(
            GsLmsPracticeSession.id == session_id,
            GsLmsPracticeSession.student_id == student_id,
            GsLmsSyllabusNode.subject_id == subject_id,
        )
        .one_or_none()
    )
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )
    return session


def _get_questions_for_session(
    db: Session, syllabus_node_id: int
) -> list[GsLmsMcqQuestion]:
    """Get all REVIEWED MCQ questions for a topic in display order."""
    return (
        db.query(GsLmsMcqQuestion)
        .filter(
            GsLmsMcqQuestion.syllabus_node_id == syllabus_node_id,
            GsLmsMcqQuestion.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .order_by(GsLmsMcqQuestion.display_order)
        .all()
    )


def _question_to_out(question: GsLmsMcqQuestion) -> GsLmsMcqQuestionOut:
    """Convert a GsLmsMcqQuestion model to the output schema."""
    question_type_val = (
        question.question_type.value
        if hasattr(question.question_type, "value")
        else str(question.question_type)
    )
    options = question.options or []
    options_out = [
        GsLmsMcqOptionOut(label=opt["label"], text=opt["text"])
        for opt in options
    ]
    return GsLmsMcqQuestionOut(
        question_id=question.id,
        question_text=question.question_text,
        question_type=question_type_val,
        options=options_out,
        display_order=question.display_order,
    )


def _build_practice_result(
    db: Session, practice_session: GsLmsPracticeSession
) -> GsLmsPracticeResultOut:
    """Rebuild the authoritative result for a completed practice session."""
    attempts_db = (
        db.query(GsLmsPracticeAttempt)
        .filter(GsLmsPracticeAttempt.session_id == practice_session.id)
        .all()
    )
    questions = _get_questions_for_session(db, practice_session.syllabus_node_id)
    question_map = {q.id: q for q in questions}

    scoring_attempts = [
        Attempt(
            question_id=a.question_id,
            question_type=a.question_type,
            chosen_answer=a.chosen_answer,
            correct_answer=question_map.get(a.question_id).correct_option
            if question_map.get(a.question_id)
            else "",
            is_correct=a.is_correct,
            time_taken_seconds=a.time_taken_seconds,
        )
        for a in attempts_db
    ]
    score = compute_score(scoring_attempts)
    type_accuracies = compute_type_accuracy(scoring_attempts)

    attempts_out = []
    for attempt in attempts_db:
        question = question_map.get(attempt.question_id)
        question_type = (
            attempt.question_type.value
            if attempt.question_type and hasattr(attempt.question_type, "value")
            else str(attempt.question_type) if attempt.question_type else ""
        )
        attempts_out.append(
            GsLmsPracticeAttemptResultOut(
                question_id=attempt.question_id,
                chosen_answer=attempt.chosen_answer,
                correct_answer=question.correct_option if question else "",
                is_correct=attempt.is_correct,
                question_type=question_type,
                explanation=question.explanation if question else None,
                time_taken_seconds=attempt.time_taken_seconds,
            )
        )

    type_accuracy_out = [
        GsLmsQuestionTypeAccuracyOut(
            question_type=accuracy.question_type.value,
            total=accuracy.total,
            correct=accuracy.correct,
            accuracy=accuracy.accuracy,
        )
        for accuracy in type_accuracies
    ]
    submitted_at = practice_session.submitted_at or datetime.now(timezone.utc)

    return GsLmsPracticeResultOut(
        session_id=practice_session.id,
        total_questions=practice_session.total_questions,
        correct_count=sum(1 for attempt in attempts_db if attempt.is_correct is True),
        score=score,
        attempts=attempts_out,
        type_accuracy=type_accuracy_out,
        submitted_at=submitted_at.isoformat(),
    )


def _build_session_out(
    session: GsLmsPracticeSession,
    current_question: GsLmsMcqQuestion | None,
) -> GsLmsPracticeSessionOut:
    """Build the session output schema including the current question if any."""
    status_val = (
        session.status.value
        if hasattr(session.status, "value")
        else str(session.status)
    )
    current_q_out = _question_to_out(current_question) if current_question else None
    return GsLmsPracticeSessionOut(
        session_id=session.id,
        syllabus_node_id=session.syllabus_node_id,
        status=status_val,
        total_questions=session.total_questions,
        current_index=session.current_index,
        current_question=current_q_out,
        started_at=session.started_at.isoformat(),
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/practice/{session_id}")
def get_practice_session(
    session_id: int,
    subject: GsSubject = Depends(resolve_subject),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve an active practice session by ID.

    Returns the current session state with the current question exposed.
    Used by the frontend to recover session state after a page refresh.

    Raises 404 if session not found, not owned by student, or already SUBMITTED.
    """
    practice_session = _get_session_owned_by(
        db, session_id, current_user.id, subject.id
    )

    # Don't expose submitted sessions — they are finalized
    if practice_session.status == GsLmsPracticeSessionStatusEnum.SUBMITTED:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    # Get current question if session is still active
    current_question = None
    if practice_session.current_index < practice_session.total_questions:
        questions = _get_questions_for_session(db, practice_session.syllabus_node_id)
        if practice_session.current_index < len(questions):
            current_question = questions[practice_session.current_index]

    session_out = _build_session_out(practice_session, current_question)

    return StandardResponse(
        success=True,
        message="Practice session retrieved",
        data=session_out,
    )


@router.post("/practice/start")
def start_practice_session(
    body: GsLmsPracticeStartIn,
    subject: GsSubject = Depends(resolve_subject),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a practice session for a topic.

    Queries all REVIEWED MCQ questions for the specified syllabus node,
    creates a GsLmsPracticeSession, and returns the session state with
    the first question exposed.

    Raises 404 if the syllabus node doesn't exist or isn't REVIEWED.
    Raises 422 if no REVIEWED MCQ questions exist for the topic.
    """
    # Validate the syllabus node
    node = (
        db.query(GsLmsSyllabusNode)
        .filter(
            GsLmsSyllabusNode.id == body.syllabus_node_id,
            GsLmsSyllabusNode.subject_id == subject.id,
            GsLmsSyllabusNode.review_status == GsReviewStatusEnum.REVIEWED,
        )
        .one_or_none()
    )
    if node is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found",
        )
    ensure_beta_topic(db, subject.id, node.id)

    # Get REVIEWED questions for the topic
    questions = _get_questions_for_session(db, body.syllabus_node_id)
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No MCQ questions available for this topic",
        )

    # Create session
    practice_session = GsLmsPracticeSession(
        student_id=current_user.id,
        syllabus_node_id=body.syllabus_node_id,
        status=GsLmsPracticeSessionStatusEnum.IN_PROGRESS,
        total_questions=len(questions),
        current_index=0,
    )
    db.add(practice_session)
    db.commit()
    db.refresh(practice_session)

    # Build output with first question
    first_question = questions[0]
    session_out = _build_session_out(practice_session, first_question)

    return StandardResponse(
        success=True,
        message="Practice session started",
        data=session_out,
    )


@router.post("/practice/{session_id}/answer", dependencies=[Depends(mcq_quota(1))])
def answer_question(
    session_id: int,
    body: GsLmsPracticeAnswerIn,
    subject: GsSubject = Depends(resolve_subject),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Record the answer for the current question in a practice session.

    Validates session ownership and sequential access (Property 10).
    Records the attempt, checks correctness, and advances the session.

    Raises 404 if session not found or not owned by student.
    Raises 409 if session is already SUBMITTED.
    Raises 422 if session is already COMPLETED (all questions traversed).
    """
    practice_session = _get_session_owned_by(
        db, session_id, current_user.id, subject.id
    )

    # Check session status
    if practice_session.status == GsLmsPracticeSessionStatusEnum.SUBMITTED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Session already submitted",
        )

    if practice_session.status == GsLmsPracticeSessionStatusEnum.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="All questions have been answered. Please submit the session.",
        )

    # Get the current question
    questions = _get_questions_for_session(db, practice_session.syllabus_node_id)
    current_index = practice_session.current_index

    if current_index >= len(questions):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="All questions have been answered. Please submit the session.",
        )

    current_question = questions[current_index]

    # Check correctness
    is_correct = body.chosen_answer.upper() == current_question.correct_option.upper()

    # Determine question type
    question_type = current_question.question_type

    # Record the attempt
    attempt = GsLmsPracticeAttempt(
        session_id=practice_session.id,
        question_id=current_question.id,
        student_id=current_user.id,
        chosen_answer=body.chosen_answer,
        is_correct=is_correct,
        time_taken_seconds=body.time_taken_seconds,
        question_type=question_type,
    )
    db.add(attempt)

    # Advance session
    practice_session.current_index += 1

    # If all questions traversed, mark COMPLETED
    if practice_session.current_index >= practice_session.total_questions:
        practice_session.status = GsLmsPracticeSessionStatusEnum.COMPLETED

    db.commit()
    db.refresh(practice_session)

    # Build attempt result
    question_type_val = (
        question_type.value if hasattr(question_type, "value") else str(question_type)
    )
    attempt_result = GsLmsPracticeAttemptResultOut(
        question_id=current_question.id,
        chosen_answer=body.chosen_answer,
        correct_answer=current_question.correct_option,
        is_correct=is_correct,
        question_type=question_type_val,
        explanation=current_question.explanation,
        time_taken_seconds=body.time_taken_seconds,
    )

    # Build session output with next question (if any)
    next_question = None
    if practice_session.current_index < len(questions):
        next_question = questions[practice_session.current_index]

    session_out = _build_session_out(practice_session, next_question)

    return StandardResponse(
        success=True,
        message="Answer recorded",
        data={
            "session": session_out.model_dump(),
            "attempt_result": attempt_result.model_dump(),
        },
    )


@router.post("/practice/{session_id}/skip")
def skip_question(
    session_id: int,
    subject: GsSubject = Depends(resolve_subject),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Skip the current question in a practice session.

    Similar to answer but sets chosen_answer=None, is_correct=None.
    Validates session ownership and sequential access (Property 10).

    Raises 404 if session not found or not owned by student.
    Raises 409 if session is already SUBMITTED.
    Raises 422 if session is already COMPLETED.
    """
    practice_session = _get_session_owned_by(
        db, session_id, current_user.id, subject.id
    )

    # Check session status
    if practice_session.status == GsLmsPracticeSessionStatusEnum.SUBMITTED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Session already submitted",
        )

    if practice_session.status == GsLmsPracticeSessionStatusEnum.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="All questions have been answered. Please submit the session.",
        )

    # Get the current question
    questions = _get_questions_for_session(db, practice_session.syllabus_node_id)
    current_index = practice_session.current_index

    if current_index >= len(questions):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="All questions have been answered. Please submit the session.",
        )

    current_question = questions[current_index]

    # Determine question type
    question_type = current_question.question_type

    # Record skip attempt (chosen_answer=None, is_correct=None)
    attempt = GsLmsPracticeAttempt(
        session_id=practice_session.id,
        question_id=current_question.id,
        student_id=current_user.id,
        chosen_answer=None,
        is_correct=None,
        time_taken_seconds=None,
        question_type=question_type,
    )
    db.add(attempt)

    # Advance session
    practice_session.current_index += 1

    # If all questions traversed, mark COMPLETED
    if practice_session.current_index >= practice_session.total_questions:
        practice_session.status = GsLmsPracticeSessionStatusEnum.COMPLETED

    db.commit()
    db.refresh(practice_session)

    # Build session output with next question (if any)
    next_question = None
    if practice_session.current_index < len(questions):
        next_question = questions[practice_session.current_index]

    session_out = _build_session_out(practice_session, next_question)

    return StandardResponse(
        success=True,
        message="Question skipped",
        data=session_out,
    )


@router.post("/practice/{session_id}/submit")
def submit_session(
    session_id: int,
    subject: GsSubject = Depends(resolve_subject),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Finalize and score a completed practice session.

    Only works if session status is COMPLETED (all questions traversed).
    Scores the session using the mcq_scoring engine, returns results with
    per-type accuracy breakdown. Repeated calls replay the persisted result.

    Raises 404 if session not found or not owned by student.
    Raises 422 if not all questions have been answered/skipped yet.
    """
    practice_session = _get_session_owned_by(
        db, session_id, current_user.id, subject.id
    )

    # A committed submission may be retried after a lost response or a
    # post-commit side-effect failure. Rebuild the persisted result instead of
    # turning an already-authoritative submission into a terminal conflict.
    if practice_session.status == GsLmsPracticeSessionStatusEnum.SUBMITTED:
        return StandardResponse(
            success=True,
            message="Session already submitted; result replayed",
            data=_build_practice_result(db, practice_session),
        )

    if practice_session.status == GsLmsPracticeSessionStatusEnum.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Not all questions have been answered or skipped",
        )

    # Mark session as SUBMITTED before the downstream gap update. If the
    # downstream update fails after this commit, a retry can still replay the
    # authoritative result through the branch above.
    now = datetime.now(timezone.utc)
    practice_session.status = GsLmsPracticeSessionStatusEnum.SUBMITTED
    practice_session.submitted_at = now
    db.commit()
    db.refresh(practice_session)

    # Update gap profile after practice submission (R6.5)
    create_gap_snapshot(db, current_user.id)
    db.commit()

    return StandardResponse(
        success=True,
        message="Session submitted and scored",
        data=_build_practice_result(db, practice_session),
    )
