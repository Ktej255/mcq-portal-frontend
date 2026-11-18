from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.domain import Test, Attempt, AttemptStatusEnum, ExamEvent
from app.api.dependencies import get_current_user
from app.services.test_engine_service import count_published_questions
from datetime import datetime, timezone

router = APIRouter()

@router.post("/start/{test_id}")
async def start_simulation(
    test_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # A simulation can only target an active test with published questions.
    test = db.query(Test).filter(Test.id == test_id, Test.is_active == True).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found or inactive")

    if count_published_questions(db, test_id) == 0:
        raise HTTPException(
            status_code=409,
            detail={
                "code": "TEST_HAS_NO_PUBLISHED_QUESTIONS",
                "message": "This test has no published questions yet.",
            },
        )

    # Resume only this student's in-progress simulation for this selected test.
    existing = db.query(Attempt).filter(
        Attempt.user_id == current_user.id,
        Attempt.test_id == test_id,
        Attempt.status == AttemptStatusEnum.IN_PROGRESS,
        Attempt.is_simulation == True,
    ).first()

    if existing:
        return {
            "status": "RESUMED",
            "attempt_id": existing.id,
            "message": "Resuming active simulation. Pausing was not permitted, timer continued."
        }

    # 3. Create Simulation Attempt
    # Simulation mode enforces fixed time and no pausing
    new_attempt = Attempt(
        user_id=current_user.id,
        test_id=test_id,
        status=AttemptStatusEnum.IN_PROGRESS,
        is_simulation=True,
        start_time=datetime.now(timezone.utc)
    )
    db.add(new_attempt)
    db.flush()
    
    # 4. Log Simulation Start Event
    event = ExamEvent(
        attempt_id=new_attempt.id,
        event_type="SIMULATION_START",
        payload={
            "enforced_duration_minutes": test.duration_minutes or 120,
            "negative_marking": test.negative_marking_value,
            "interruption_tolerance": "ZERO"
        }
    )
    db.add(event)
    db.commit()
    
    return {
        "status": "STARTED",
        "attempt_id": new_attempt.id,
        "config": {
            "duration": test.duration_minutes or 120,
            "mode": "STRICT_SIMULATION",
            "is_pausable": False
        }
    }

@router.post("/{attempt_id}/heartbeat")
async def simulation_heartbeat(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Fetch by ID first so a real attempt owned by another user remains a
    # denied session rather than being confused with a missing attempt.
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id).first()
    if not attempt or attempt.user_id != current_user.id or not attempt.is_simulation:
        raise HTTPException(status_code=403, detail="Invalid simulation session")

    # Heartbeats are only valid for an active simulation.  Do not expose
    # terminal-state details or attempt data to the client.
    if attempt.status != AttemptStatusEnum.IN_PROGRESS:
        raise HTTPException(
            status_code=409,
            detail={
                "code": "SIMULATION_NOT_ACTIVE",
                "message": "This simulation is no longer active.",
            },
        )

    test = db.query(Test).filter(Test.id == attempt.test_id).first()
    if not test:
        raise HTTPException(
            status_code=409,
            detail={
                "code": "SIMULATION_UNAVAILABLE",
                "message": "This simulation is unavailable.",
            },
        )

    start_time = attempt.start_time
    if not isinstance(start_time, datetime):
        raise HTTPException(
            status_code=409,
            detail={
                "code": "SIMULATION_INVALID_STATE",
                "message": "This simulation cannot continue in its current state.",
            },
        )

    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    else:
        start_time = start_time.astimezone(timezone.utc)

    duration = test.duration_minutes or 120
    elapsed = (datetime.now(timezone.utc) - start_time).total_seconds() / 60

    if elapsed > duration + 5:  # 5 min grace for network
        # SUBMITTED is the existing persisted terminal state.  Updating only
        # from IN_PROGRESS makes repeated heartbeats safely terminal/idempotent.
        attempt.status = AttemptStatusEnum.SUBMITTED
        attempt.end_time = datetime.now(timezone.utc)
        db.commit()
        return {"status": "AUTO_TERMINATED", "reason": "TIME_EXCEEDED"}

    return {"status": "ACTIVE", "elapsed_minutes": round(elapsed, 2)}
