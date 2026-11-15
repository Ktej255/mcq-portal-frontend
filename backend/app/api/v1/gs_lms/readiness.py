"""Readiness endpoints for the GS revision platform.

Routes (mounted under /api/v1/gs-lms/{subject}):

* GET  /readiness          -- demand-weighted readiness, topic rows, actions
* GET  /readiness/trend    -- daily snapshot history
* POST /readiness/recompute -- admin-only demand cache and snapshot refresh

The response always separates coverage, depth, tested performance, demand
confidence, and outcome uncertainty. It never turns "no evidence" into
"great work".
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin, get_current_user
from app.api.v1.gs_lms.dependencies import resolve_subject
from app.core.gs.models import GsSubject
from app.core.gs_lms.readiness_service import (
    get_readiness,
    get_readiness_trend,
    rebuild_demand_weights,
)
from app.core.gs_lms.mains_outcome import get_mains_outcome
from app.db.session import get_db
from app.models.domain import User
from app.schemas.common import StandardResponse

router = APIRouter()


@router.get("/readiness")
def read_readiness(
    subject: GsSubject = Depends(resolve_subject),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    persist: bool = Query(
        default=True,
        description="Persist today's snapshot for trend history",
    ),
) -> Any:
    """Return the learner's evidence-based readiness report.

    The headline band is suppressed when less than 25% of demand-weighted
    topics have assessment evidence. Unassessed topics are returned with
    status ``UNVERIFIED`` or ``UNTOUCHED``, never ``WEAK``.
    """
    data = get_readiness(
        db,
        student_id=current_user.id,
        subject_id=subject.id,
        subject_slug=subject.slug,
        persist=persist,
    )
    return StandardResponse(
        success=True,
        message="Readiness computed",
        data=data,
    )


@router.get("/readiness/mains")
def read_mains_outcome(
    subject: GsSubject = Depends(resolve_subject),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Return the learner's Mains outcome estimate for this subject.

    Built only from complete evaluation reports on this subject's PYQs.
    Fewer than three distinct scored answers returns ``available: false`` with
    the reason and next step — never a zero-mark band. The projection covers
    only GS papers with evidence and never predicts selection, rank, or a
    cut-off.
    """
    data = get_mains_outcome(
        db,
        student_id=current_user.id,
        subject_id=subject.id,
    )
    return StandardResponse(
        success=True,
        message="Mains outcome estimate computed",
        data=data,
    )


@router.get("/readiness/trend")
def read_readiness_trend(
    subject: GsSubject = Depends(resolve_subject),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(default=30, ge=1, le=180),
) -> Any:
    """Return daily readiness snapshots, oldest first."""
    data = get_readiness_trend(
        db,
        student_id=current_user.id,
        subject_id=subject.id,
        limit=limit,
    )
    return StandardResponse(
        success=True,
        message="Readiness trend retrieved",
        data=data,
    )


@router.post("/readiness/recompute")
def recompute_readiness(
    subject: GsSubject = Depends(resolve_subject),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> Any:
    """Admin-only: rebuild the demand cache and today's snapshot."""
    demand_rows = rebuild_demand_weights(db, subject.id)
    data = get_readiness(
        db,
        student_id=current_user.id,
        subject_id=subject.id,
        subject_slug=subject.slug,
        persist=True,
    )
    return StandardResponse(
        success=True,
        message=f"Readiness recomputed; {demand_rows} demand rows refreshed",
        data=data,
    )
