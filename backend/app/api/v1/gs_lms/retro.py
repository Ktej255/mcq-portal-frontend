"""Weekly retrospective endpoints for the GS LMS Platform.

Routes (mounted under /api/v1/gs-lms/{subject_slug}):
* GET  /retro/current  — Return current week's retro (or create it)
* POST /retro/complete — Submit reflection and mark retro done

Requirements traced: 7.1, 7.2, 7.3, 7.4
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.domain import User
from app.api.dependencies import get_current_user
from app.schemas.common import StandardResponse
from app.core.gs.models import GsSubject
from app.core.gs_lms.student_models import (
    GsLmsWeeklyRetro,
    GsLmsDailyPlan,
    GsLmsGapSnapshot,
)
from app.api.v1.gs_lms.dependencies import resolve_subject

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class RetroStatusOut(BaseModel):
    id: int
    week_number: int
    plan_date: str
    topics_completed: Optional[list] = None
    gap_summary: Optional[list] = None
    reflection_text: Optional[str] = None
    completed: bool
    completed_at: Optional[str] = None


class RetroCompleteIn(BaseModel):
    reflection_text: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_current_week_number(db: Session, student_id: int) -> int:
    """Compute the current week number from the student's first plan date.

    Counting plan rows made the seventh study day open week 2, so week 1's
    retrospective could never be shown. Anchoring to the first plan date keeps
    days 1–7 in week 1 regardless of how many plans were created.
    """
    from sqlalchemy import func

    first_plan_date = (
        db.query(func.min(GsLmsDailyPlan.plan_date))
        .filter(GsLmsDailyPlan.student_id == student_id)
        .scalar()
    )
    anchor = first_plan_date or date.today()
    return max(1, ((date.today() - anchor).days // 7) + 1)


def _get_completed_topics_this_week(db: Session, student_id: int) -> list[dict]:
    """Get topics whose reviewed sections were all completed in the last 7 days.

    A topic is only claimed as completed when every reviewed section is done,
    and the final section was completed inside the window. Requiring all
    sections is deliberately conservative for learners with skip allowances:
    the retro may omit a topic, but it will never claim a half-read topic is
    finished.
    """
    from datetime import timedelta

    from app.core.gs.models import GsReviewStatusEnum
    from app.core.gs_lms.models import (
        GsLmsContentSection,
        GsLmsNodeTypeEnum,
        GsLmsSyllabusNode,
    )
    from app.core.gs_lms.student_models import GsLmsStudentSectionProgress

    cutoff = datetime.combine(date.today() - timedelta(days=7), datetime.min.time())
    candidate_ids = [
        row[0]
        for row in db.query(GsLmsStudentSectionProgress.syllabus_node_id)
        .filter(
            GsLmsStudentSectionProgress.student_id == student_id,
            GsLmsStudentSectionProgress.completed == True,  # noqa: E712
            GsLmsStudentSectionProgress.completed_at >= cutoff,
        )
        .distinct()
        .all()
    ]

    result: list[dict] = []
    for node_id in candidate_ids:
        node = (
            db.query(GsLmsSyllabusNode)
            .filter(GsLmsSyllabusNode.id == node_id)
            .one_or_none()
        )
        if node is None or node.node_type != GsLmsNodeTypeEnum.LEAF_TOPIC:
            continue

        reviewed_section_ids = [
            row[0]
            for row in db.query(GsLmsContentSection.id)
            .filter(
                GsLmsContentSection.syllabus_node_id == node_id,
                GsLmsContentSection.review_status == GsReviewStatusEnum.REVIEWED,
            )
            .all()
        ]
        if not reviewed_section_ids:
            continue

        completion_rows = (
            db.query(
                GsLmsStudentSectionProgress.section_id,
                GsLmsStudentSectionProgress.completed_at,
            )
            .filter(
                GsLmsStudentSectionProgress.student_id == student_id,
                GsLmsStudentSectionProgress.syllabus_node_id == node_id,
                GsLmsStudentSectionProgress.completed == True,  # noqa: E712
            )
            .all()
        )
        completed_at = {
            section_id: completed
            for section_id, completed in completion_rows
            if completed is not None
        }
        if not all(section_id in completed_at for section_id in reviewed_section_ids):
            continue
        last_completed = max(
            completed_at[section_id] for section_id in reviewed_section_ids
        )
        if last_completed < cutoff:
            continue

        result.append({"node_id": node.id, "title": node.title})
    return result


def _get_latest_gap_summary(db: Session, student_id: int) -> list[dict]:
    """Get the latest gap snapshot summary for the student."""
    snapshot = (
        db.query(GsLmsGapSnapshot)
        .filter(GsLmsGapSnapshot.student_id == student_id)
        .order_by(GsLmsGapSnapshot.computed_at.desc())
        .first()
    )
    if not snapshot:
        return []
    weak_types = snapshot.weak_question_types or []
    return [{"type": w.get("type", ""), "accuracy": w.get("accuracy", 0)} for w in weak_types[:3]]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/retro/current")
def get_current_retro(
    subject: GsSubject = Depends(resolve_subject),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Return or create the current week's retro for the student."""
    week_number = _get_current_week_number(db, current_user.id)

    retro = (
        db.query(GsLmsWeeklyRetro)
        .filter(
            GsLmsWeeklyRetro.student_id == current_user.id,
            GsLmsWeeklyRetro.week_number == week_number,
        )
        .one_or_none()
    )

    if retro is None:
        topics = _get_completed_topics_this_week(db, current_user.id)
        gap_summary = _get_latest_gap_summary(db, current_user.id)
        retro = GsLmsWeeklyRetro(
            student_id=current_user.id,
            week_number=week_number,
            plan_date=date.today(),
            topics_completed=topics,
            gap_summary=gap_summary,
            completed=False,
        )
        db.add(retro)
        db.commit()
        db.refresh(retro)
    elif not retro.completed:
        # The week is still open, so the evidence shown must reflect everything
        # completed since the first visit — not a snapshot frozen on day one.
        retro.topics_completed = _get_completed_topics_this_week(db, current_user.id)
        retro.gap_summary = _get_latest_gap_summary(db, current_user.id)
        db.commit()
        db.refresh(retro)

    return StandardResponse(
        success=True,
        message="Weekly retro retrieved",
        data=RetroStatusOut(
            id=retro.id,
            week_number=retro.week_number,
            plan_date=retro.plan_date.isoformat(),
            topics_completed=retro.topics_completed,
            gap_summary=retro.gap_summary,
            reflection_text=retro.reflection_text,
            completed=retro.completed,
            completed_at=retro.completed_at.isoformat() if retro.completed_at else None,
        ),
    )


@router.post("/retro/complete")
def complete_retro(
    body: RetroCompleteIn,
    subject: GsSubject = Depends(resolve_subject),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Submit reflection and mark the current retro as done."""
    week_number = _get_current_week_number(db, current_user.id)

    retro = (
        db.query(GsLmsWeeklyRetro)
        .filter(
            GsLmsWeeklyRetro.student_id == current_user.id,
            GsLmsWeeklyRetro.week_number == week_number,
        )
        .one_or_none()
    )

    now = datetime.now(timezone.utc)

    if retro is None:
        topics = _get_completed_topics_this_week(db, current_user.id)
        gap_summary = _get_latest_gap_summary(db, current_user.id)
        retro = GsLmsWeeklyRetro(
            student_id=current_user.id,
            week_number=week_number,
            plan_date=date.today(),
            topics_completed=topics,
            gap_summary=gap_summary,
            reflection_text=body.reflection_text,
            completed=True,
            completed_at=now,
        )
        db.add(retro)
    else:
        retro.reflection_text = body.reflection_text
        retro.completed = True
        retro.completed_at = now

    db.commit()
    db.refresh(retro)

    return StandardResponse(
        success=True,
        message="Retro completed",
        data=RetroStatusOut(
            id=retro.id,
            week_number=retro.week_number,
            plan_date=retro.plan_date.isoformat(),
            topics_completed=retro.topics_completed,
            gap_summary=retro.gap_summary,
            reflection_text=retro.reflection_text,
            completed=retro.completed,
            completed_at=retro.completed_at.isoformat() if retro.completed_at else None,
        ),
    )
