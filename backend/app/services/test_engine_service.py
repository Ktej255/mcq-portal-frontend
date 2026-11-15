from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timezone
from app.models.domain import Test, Attempt, AttemptStatusEnum, Question, AttemptAnswer, Topic, Subject, Report, WorkflowStatusEnum
from app.schemas.test_engine import StartAttemptRequest, SaveAnswerRequest
from app.services.domain_contracts import normalize_option_id

def variation_enabled() -> bool:
    """Whether per-attempt MCQ variation (option shuffle, wording inversion) is on.

    One switch for both sides of the exam: the questions served for an attempt
    and the remapping of the option a student saves. They must always agree,
    otherwise the stored answer is not the option the student clicked.
    """
    from app.core.config import settings

    return bool(settings.MCQ_VARIATION_ENABLED)


def published_question_query(db: Session, test_id: int):
    return db.query(Question).filter(
        Question.test_id == test_id,
        Question.is_deleted == False,
        Question.status == WorkflowStatusEnum.PUBLISHED,
    )

def count_published_questions(db: Session, test_id: int) -> int:
    return published_question_query(db, test_id).count()

def start_attempt(db: Session, user_id: int, request: StartAttemptRequest) -> Attempt:
    test = db.query(Test).filter(Test.id == request.test_id, Test.is_active == True).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found or inactive")

    if count_published_questions(db, request.test_id) == 0:
        raise HTTPException(
            status_code=409,
            detail={
                "code": "TEST_HAS_NO_PUBLISHED_QUESTIONS",
                "message": "This test has no published questions yet.",
            },
        )
    
    # Check if an in-progress attempt already exists
    existing_attempt = db.query(Attempt).filter(
        Attempt.user_id == user_id, 
        Attempt.test_id == request.test_id,
        Attempt.status == AttemptStatusEnum.IN_PROGRESS
    ).first()
    
    if existing_attempt:
        from app.services.attempt_lock_manager import AttemptLockManager

        if not AttemptLockManager.is_timer_expired(existing_attempt, db):
            return existing_attempt
        # Its clock ran out while the student was away. Close it with whatever
        # was saved, so it gets a report, and start a fresh attempt.
        close_expired_attempt(db, existing_attempt)

    attempt = Attempt(
        user_id=user_id,
        test_id=request.test_id,
        status=AttemptStatusEnum.IN_PROGRESS
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt

def close_expired_attempt(db: Session, attempt: Attempt):
    """Submit an attempt whose time is over, using the answers already saved."""
    from app.services.report_service import generate_report, run_cognitive_pipeline

    generate_report(db, attempt.id, attempt.user_id)
    run_cognitive_pipeline(db, attempt.id, attempt.user_id)


def get_attempt_questions(db: Session, attempt_id: int, user_id: int):
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id, Attempt.user_id == user_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    questions = db.query(Question, Topic.name.label("topic_name"), Subject.id.label("subject_id"), Subject.name.label("subject_name"))\
        .join(Topic, Question.topic_id == Topic.id)\
        .join(Subject, Topic.subject_id == Subject.id)\
        .filter(
            Question.test_id == attempt.test_id,
            Question.is_deleted == False,
            Question.status == WorkflowStatusEnum.PUBLISHED,
        )\
        .order_by(Question.question_number.asc()).all()

    if not questions:
        raise HTTPException(
            status_code=409,
            detail={
                "code": "ATTEMPT_HAS_NO_PUBLISHED_QUESTIONS",
                "message": "This attempt's test has no published questions available.",
            },
        )
        
    apply_variation = variation_enabled()

    from app.services.mcq_variation_engine import MCQVariationEngine

    result = []
    for idx, (q, topic_name, subject_id, subject_name) in enumerate(questions):
        if apply_variation:
            mutated = MCQVariationEngine.mutate_question(
                question_id=q.id,
                attempt_id=attempt_id,
                text_en=q.text_en,
                text_hi=q.text_hi,
                options_en=q.options_en,
                options_hi=q.options_hi,
                correct_option=q.correct_option,
                explanation_en=q.explanation_en,
                explanation_hi=q.explanation_hi,
                statements_en=q.statements_en,
            )
            text_en_val = mutated["text_en"]
            text_hi_val = mutated["text_hi"]
            options_en_val = mutated["options_en"]
            options_hi_val = mutated["options_hi"]
        else:
            text_en_val = q.text_en
            text_hi_val = q.text_hi
            options_en_val = q.options_en
            options_hi_val = q.options_hi

        result.append({
            "id": q.id,
            "test_id": q.test_id,
            "topic_id": q.topic_id,
            "subject_id": subject_id,
            "topic_name": topic_name,
            "subject_name": subject_name,
            "text_en": text_en_val,
            "text_hi": text_hi_val,
            "options_en": options_en_val,
            "options_hi": options_hi_val,
            "difficulty": q.difficulty,
            "question_number": q.question_number if q.question_number else idx + 1
        })
    return result

def _published_question(db: Session, attempt: Attempt, question_id: int):
    # The question must belong to this attempt's test and remain published.
    # Without this check a caller could attach an unrelated question ID to an
    # otherwise valid owned attempt, corrupting scoring and report provenance.
    return db.query(Question).filter(
        Question.id == question_id,
        Question.test_id == attempt.test_id,
        Question.is_deleted == False,
        Question.status == WorkflowStatusEnum.PUBLISHED,
    ).first()


def _apply_answer(db: Session, attempt: Attempt, question: Question, request: SaveAnswerRequest) -> None:
    """Stage one answer on the session. The caller commits."""
    selected_option = normalize_option_id(request.selected_option)

    if selected_option is not None and variation_enabled():
        from app.services.mcq_variation_engine import MCQVariationEngine
        q = question
        mutated = MCQVariationEngine.mutate_question(
            question_id=q.id,
            attempt_id=attempt.id,
            text_en=q.text_en,
            text_hi=q.text_hi,
            options_en=q.options_en,
            options_hi=q.options_hi,
            correct_option=q.correct_option,
            explanation_en=q.explanation_en,
            explanation_hi=q.explanation_hi,
            statements_en=q.statements_en,
        )
        key_mapping = mutated.get("key_mapping", {})
        selected_option = key_mapping.get(selected_option, selected_option)

    answer = db.query(AttemptAnswer).filter(
        AttemptAnswer.attempt_id == attempt.id,
        AttemptAnswer.question_id == request.question_id
    ).first()

    if answer:
        if selected_option is None and request.is_skipped and not request.clear_response:
            answer.time_taken_seconds = request.time_taken_seconds
            answer.marked_for_review = request.marked_for_review
            return
        if answer.selected_option != selected_option:
            answer.is_changed = True
        answer.selected_option = selected_option
        answer.time_taken_seconds = request.time_taken_seconds
        answer.confidence_level = request.confidence_level
        answer.is_skipped = request.is_skipped
        answer.marked_for_review = request.marked_for_review
    else:
        if selected_option is None and request.is_skipped and not request.clear_response:
            return
        db.add(AttemptAnswer(
            attempt_id=attempt.id,
            question_id=request.question_id,
            selected_option=selected_option,
            time_taken_seconds=request.time_taken_seconds,
            confidence_level=request.confidence_level,
            is_skipped=request.is_skipped,
            marked_for_review=request.marked_for_review
        ))


def _writable_attempt(db: Session, attempt_id: int, user_id: int) -> Attempt:
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id, Attempt.user_id == user_id).first()
    if not attempt or attempt.status != AttemptStatusEnum.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Attempt not valid or already submitted")
    return attempt


def save_answer(db: Session, attempt_id: int, user_id: int, request: SaveAnswerRequest):
    attempt = _writable_attempt(db, attempt_id, user_id)
    question = _published_question(db, attempt, request.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found for this attempt")

    _apply_answer(db, attempt, question, request)
    db.commit()
    return True


def save_answers(db: Session, attempt_id: int, user_id: int, requests: list[SaveAnswerRequest]) -> int:
    """Save many answers in one transaction: all of them, or none.

    Used for the final sync before submit, where one request per answer is too
    slow to finish inside the grace period on a hundred-question paper.
    """
    attempt = _writable_attempt(db, attempt_id, user_id)
    for request in requests:
        question = _published_question(db, attempt, request.question_id)
        if not question:
            db.rollback()
            raise HTTPException(status_code=404, detail="Question not found for this attempt")
        _apply_answer(db, attempt, question, request)
        # The session does not autoflush everywhere; a repeated question in one
        # batch must see the row staged just before it.
        db.flush()
    db.commit()
    return len(requests)
