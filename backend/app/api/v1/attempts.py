from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from app.db.session import get_db
from app.models.domain import User, Attempt, AttemptStatusEnum, Question, WorkflowStatusEnum
from app.api.dependencies import get_current_user
from app.schemas.test_engine import (
    StartAttemptRequest, StartAttemptResponse, QuestionResponse, 
    SaveAnswerRequest, SaveAnswerResponse, ReportResponse, HistoryItemResponse,
    EventBatchRequest
)
from app.schemas.common import StandardResponse
from app.services.test_engine_service import start_attempt, get_attempt_questions, save_answer, count_published_questions
from app.services.report_service import generate_report
from app.services.event_auditor import event_auditor
from app.services.domain_contracts import CanonicalExamEvent
from app.services.attempt_lock_manager import AttemptLockManager, AttemptLockError
from app.services.attempt_reconciliation_engine import AttemptReconciliationEngine
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

ALLOWED_EXAM_EVENTS = {event.value for event in CanonicalExamEvent}


def _get_owned_attempt(db: Session, attempt_id: int, user_id: int) -> Attempt:
    attempt = db.query(Attempt).filter(
        Attempt.id == attempt_id,
        Attempt.user_id == user_id,
        Attempt.is_deleted.is_(False),
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    return attempt

@router.get("/history", response_model=StandardResponse[List[HistoryItemResponse]])
def get_attempt_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.domain import Attempt, Report
    attempts = db.query(Attempt).filter(
        Attempt.user_id == current_user.id,
        Attempt.is_deleted.is_(False),
    ).order_by(Attempt.start_time.desc()).all()
    result = []
    for att in attempts:
        report = db.query(Report).filter(
            Report.attempt_id == att.id,
            Report.is_deleted.is_(False),
        ).first()
        
        # Defensive check for test existence
        test_title = att.test.title if att.test else "Unknown Test"
        correct_marks = att.test.correct_marks if att.test else 1.0
        
        # Match the published question set used to start and load the attempt.
        max_questions = count_published_questions(db, att.test_id) if att.test else len(att.answers)
        max_score = max_questions * correct_marks
        
        accuracy_val = report.accuracy if report and report.accuracy is not None else 0.0
        accuracy_str = f"{accuracy_val:.1f}%"
        
        result.append({
            "attemptId": str(att.id),
            "title": test_title,
            "date": att.start_time.isoformat(),
            "status": att.status.value,
            "score": report.total_score if report else None,
            "maxScore": max_score,
            "accuracy": accuracy_str
        })
    return StandardResponse(success=True, message="History retrieved", data=result)

@router.post("/start", response_model=StandardResponse[StartAttemptResponse])
def start_test_attempt(
    request: StartAttemptRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    attempt = start_attempt(db, current_user.id, request)
    if attempt.is_deleted:
        raise HTTPException(status_code=404, detail="Attempt not found")
    test = attempt.test
    total_questions = count_published_questions(db, test.id)
    return StandardResponse(success=True, message="Attempt started successfully", data={
        "attempt_id": attempt.id,
        "test": {
            "id": test.id,
            "title": test.title,
            "description": test.description,
            "duration_minutes": test.duration_minutes,
            "correct_marks": test.correct_marks,
            "negative_marking_value": test.negative_marking_value,
            "total_questions": total_questions,
        },
        "start_time": attempt.start_time,
        "status": attempt.status
    })

@router.get("/{attempt_id}/questions", response_model=StandardResponse[List[QuestionResponse]])
def fetch_questions(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _get_owned_attempt(db, attempt_id, current_user.id)
    questions = get_attempt_questions(db, attempt_id, current_user.id)
    return StandardResponse(success=True, message="Questions retrieved successfully", data=questions)

@router.put("/{attempt_id}/answers", response_model=StandardResponse[SaveAnswerResponse])
def save_test_answer(
    attempt_id: int,
    request: SaveAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _get_owned_attempt(db, attempt_id, current_user.id)
    # Priority 2: Lock governance before any write
    try:
        AttemptLockManager.lock_for_save(db, attempt_id, current_user.id)
    except AttemptLockError as e:
        raise HTTPException(status_code=409, detail={"code": e.code, "message": e.detail})

    success = save_answer(db, attempt_id, current_user.id, request)
    return StandardResponse(success=True, message="Answer saved successfully", data={"success": success, "message": "Answer saved successfully"})

@router.post("/{attempt_id}/submit", response_model=StandardResponse[ReportResponse])
def submit_test(
    attempt_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _get_owned_attempt(db, attempt_id, current_user.id)
    from app.services.report_service import generate_report, run_async_cognitive_pipeline
    
    # Priority 2: Idempotent submit — if already submitted, return existing report
    try:
        locked_attempt = AttemptLockManager.lock_for_submit(db, attempt_id, current_user.id)
    except AttemptLockError as e:
        raise HTTPException(status_code=409, detail={"code": e.code, "message": e.detail})
    
    from app.models.domain import Report, AttemptStatusEnum
    if locked_attempt.status == AttemptStatusEnum.SUBMITTED:
        existing_report = db.query(Report).filter(
            Report.attempt_id == attempt_id,
            Report.is_deleted.is_(False),
        ).first()
        if existing_report:
            logger.info(f"Idempotent submit: attempt {attempt_id} already submitted, returning existing report")
            return StandardResponse(success=True, message="Already submitted — returning existing report.", data=existing_report)
    
    # Priority 1: Run reconciliation as background audit before pipeline
    def reconcile_and_pipeline(attempt_id: int, user_id: int):
        from app.db.session import SessionLocal
        _db = SessionLocal()
        try:
            rec = AttemptReconciliationEngine.reconcile(_db, attempt_id)
            if rec.status == "FORENSIC_DIVERGENCE":
                logger.warning(
                    f"FORENSIC_DIVERGENCE on attempt {attempt_id}: "
                    f"{len(rec.divergences)} divergences detected. "
                    f"Summary: {rec.summary} | "
                    f"Divergences: {rec.divergences}"
                )
            elif rec.status == "INSUFFICIENT_DATA":
                logger.info(
                    f"Reconciliation INSUFFICIENT_DATA for attempt {attempt_id}: {rec.summary}"
                )
            else:
                logger.info(
                    f"Reconciliation CLEAN for attempt {attempt_id}: {rec.summary}"
                )
            run_async_cognitive_pipeline(attempt_id, user_id)
        except Exception as exc:
            logger.error(f"reconcile_and_pipeline failed for attempt {attempt_id}: {exc}")
        finally:
            _db.close()

    
    report = generate_report(db, attempt_id, current_user.id)
    if report.is_deleted:
        raise HTTPException(status_code=404, detail="Report not found")
    background_tasks.add_task(reconcile_and_pipeline, attempt_id, current_user.id)
    
    return StandardResponse(success=True, message="Test submitted. Primary analysis complete. AI Insight is being generated.", data=report)

@router.post("/{attempt_id}/events", response_model=StandardResponse[dict])
def record_exam_events(
    attempt_id: int,
    request: EventBatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.domain import ExamEvent
    # Verify current-user ownership and that the attempt is still writable.
    attempt = _get_owned_attempt(db, attempt_id, current_user.id)
    if attempt.status != AttemptStatusEnum.IN_PROGRESS:
        raise HTTPException(status_code=409, detail="Attempt not valid or already submitted")

    invalid_events = sorted({event.event_type for event in request.events if event.event_type not in ALLOWED_EXAM_EVENTS})
    if invalid_events:
        raise HTTPException(status_code=422, detail={"invalid_event_types": invalid_events})

    question_ids = {event.question_id for event in request.events if event.question_id is not None}
    if question_ids:
        valid_question_ids = {
            question_id for (question_id,) in db.query(Question.id).filter(
                Question.id.in_(question_ids),
                Question.test_id == attempt.test_id,
                Question.is_deleted.is_(False),
                Question.status == WorkflowStatusEnum.PUBLISHED,
            ).all()
        }
        invalid_question_ids = sorted(question_ids - valid_question_ids)
        if invalid_question_ids:
            raise HTTPException(status_code=404, detail="Question not found for this attempt")

    # Audit events for integrity
    audit_results = event_auditor.validate_sequence(request.events)
    if not audit_results["is_valid"]:
        logger.warning(f"Event Audit Violations for Attempt {attempt_id}: {audit_results['violations']}")

    db_events = []
    for e in request.events:
        db_events.append(ExamEvent(
            attempt_id=attempt_id,
            event_type=e.event_type,
            question_id=e.question_id,
            payload=e.payload,
            timestamp=e.timestamp or datetime.now(timezone.utc)
        ))
    
    db.add_all(db_events)
    db.commit()
    ordered_timestamps = sorted(event.timestamp for event in db_events if event.timestamp)
    return StandardResponse(
        success=True, 
        message=f"{len(db_events)} events recorded", 
        data={
            "count": len(db_events),
            "audit": audit_results["audit_summary"],
            "firstTimestamp": ordered_timestamps[0].isoformat() if ordered_timestamps else None,
            "lastTimestamp": ordered_timestamps[-1].isoformat() if ordered_timestamps else None,
            "eventTypes": [event.event_type for event in db_events],
        }
    )
