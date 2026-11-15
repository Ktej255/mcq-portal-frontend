"""Operator endpoints for GS LMS beta cohort access.

Mounted at ``/api/v1/admin/gs-lms/beta-access`` and gated by
``get_current_admin`` at the router level.

These endpoints are the only sanctioned way to provision or revoke cohort
access. They never touch payment subscriptions and never elevate a user's
role; they write the institutional audit trail on ``gs_lms_beta_access``.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin
from app.api.v1.gs_lms.access import ACTIVE_STATUS
from app.core.gs_lms.readiness_models import GsLmsBetaAccess
from app.db.session import get_db
from app.models.domain import User
from app.schemas.common import StandardResponse

router = APIRouter(dependencies=[Depends(get_current_admin)])

REVOKED_STATUS = "REVOKED"


class BetaAccessUpsertIn(BaseModel):
    """Grant or reactivate cohort access for an existing learner account."""

    user_email: str = Field(min_length=3, max_length=320)
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    status: Literal["ACTIVE", "SUSPENDED"] = "ACTIVE"
    reason: Optional[str] = Field(default=None, max_length=256)

    @model_validator(mode="after")
    def _validate_window(self) -> "BetaAccessUpsertIn":
        if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
            raise ValueError("ends_at must be later than starts_at")
        return self


class BetaAccessOut(BaseModel):
    user_id: int
    email: str
    access_type: str
    starts_at: datetime
    ends_at: Optional[datetime]
    status: str
    reason: Optional[str]
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


def _serialize(grant: GsLmsBetaAccess, user: User) -> BetaAccessOut:
    return BetaAccessOut(
        user_id=user.id,
        email=user.email,
        access_type=grant.access_type,
        starts_at=grant.starts_at,
        ends_at=grant.ends_at,
        status=grant.status,
        reason=grant.reason,
        updated_at=grant.updated_at,
    )


def _find_user(db: Session, email: str) -> Optional[User]:
    return (
        db.query(User)
        .filter(func.lower(User.email) == email.strip().lower())
        .one_or_none()
    )


@router.get("", response_model=StandardResponse[List[BetaAccessOut]])
def list_beta_access(
    db: Session = Depends(get_db),
    limit: int = Query(default=100, ge=1, le=500),
) -> Any:
    """List every cohort grant, newest activity first."""
    rows = (
        db.query(GsLmsBetaAccess, User)
        .join(User, User.id == GsLmsBetaAccess.user_id)
        .order_by(GsLmsBetaAccess.updated_at.desc(), GsLmsBetaAccess.id.desc())
        .limit(limit)
        .all()
    )
    return StandardResponse(
        success=True,
        message="Beta access grants retrieved",
        data=[_serialize(grant, user) for grant, user in rows],
    )


@router.post("", response_model=StandardResponse[BetaAccessOut])
def upsert_beta_access(
    body: BetaAccessUpsertIn,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
) -> Any:
    """Grant or update cohort access. The learner account must already exist."""
    user = _find_user(db, str(body.user_email))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No learner account exists for this email. The learner must "
                "sign in once before cohort access can be granted."
            ),
        )

    actor = f"admin:{current_admin.id}"
    now = datetime.now(timezone.utc)
    grant = (
        db.query(GsLmsBetaAccess)
        .filter(GsLmsBetaAccess.user_id == user.id)
        .one_or_none()
    )
    if grant is None:
        grant = GsLmsBetaAccess(
            user_id=user.id,
            access_type="COMP",
            starts_at=body.starts_at or now,
            ends_at=body.ends_at,
            status=body.status,
            reason=body.reason,
            created_by=actor,
            updated_by=actor,
        )
        db.add(grant)
    else:
        grant.starts_at = body.starts_at or grant.starts_at or now
        grant.ends_at = body.ends_at
        grant.status = body.status
        grant.reason = body.reason
        grant.updated_by = actor

    db.commit()
    db.refresh(grant)
    return StandardResponse(
        success=True,
        message="Beta access updated",
        data=_serialize(grant, user),
    )


@router.delete("/{user_id}", response_model=StandardResponse[BetaAccessOut])
def revoke_beta_access(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
) -> Any:
    """Revoke cohort access without deleting the institutional record."""
    grant = (
        db.query(GsLmsBetaAccess)
        .filter(GsLmsBetaAccess.user_id == user_id)
        .one_or_none()
    )
    if grant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No cohort access grant exists for this user.",
        )

    user = db.query(User).filter(User.id == user_id).one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The learner account no longer exists.",
        )

    grant.status = REVOKED_STATUS
    grant.ends_at = datetime.now(timezone.utc)
    grant.reason = "Revoked by operator"
    grant.updated_by = f"admin:{current_admin.id}"
    db.commit()
    db.refresh(grant)
    return StandardResponse(
        success=True,
        message="Beta access revoked",
        data=_serialize(grant, user),
    )


__all__ = ["router", "ACTIVE_STATUS"]
