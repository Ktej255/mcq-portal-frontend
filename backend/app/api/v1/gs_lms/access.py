"""Cohort access enforcement for the GS LMS beta.

The GS LMS is a private paid beta. Authentication alone is not authorization:
a signed-in account must either be staff (ADMIN/EDUCATOR) or hold an active
``gs_lms_beta_access`` grant for the current instant.

Enforcement is controlled by ``settings.GS_LMS_ENFORCE_ACCESS`` so that local
datasets and existing automated tests keep working while the founder
provisions the beta cohort. Production startup refuses to boot with the flag
off, so a paid cohort can never be served unguarded.

Access grants are intentionally independent of payment subscriptions
(``GsLmsBetaAccess`` documents the comp/support path). Paid-tier mapping is a
separate, explicit decision that must be made when payments are switched on,
not an implicit side effect of an unrelated capability flag.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.core.gs_lms.readiness_models import GsLmsBetaAccess
from app.db.session import get_db
from app.models.domain import RoleEnum, User

ACTIVE_STATUS = "ACTIVE"
STAFF_ROLES = {RoleEnum.ADMIN, RoleEnum.EDUCATOR, "ADMIN", "EDUCATOR"}


def enforcement_enabled() -> bool:
    """Return whether cohort access is enforced for this deployment."""
    return bool(settings.GS_LMS_ENFORCE_ACCESS)


def _as_utc(value: Optional[datetime]) -> Optional[datetime]:
    """Treat legacy naive persisted timestamps as UTC."""
    if value is None:
        return None
    if value.tzinfo is None or value.utcoffset() is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def grant_is_active(
    grant: GsLmsBetaAccess,
    *,
    now: Optional[datetime] = None,
) -> bool:
    """Whether a persisted grant is active at ``now`` (default: this instant)."""
    effective_now = now or datetime.now(timezone.utc)
    if grant.status != ACTIVE_STATUS:
        return False

    starts_at = _as_utc(grant.starts_at)
    if starts_at is not None and starts_at > effective_now:
        return False

    ends_at = _as_utc(grant.ends_at)
    if ends_at is not None and ends_at <= effective_now:
        return False

    return True


def user_has_gs_lms_access(
    db: Session,
    user: User,
    *,
    now: Optional[datetime] = None,
) -> bool:
    """Staff roles pass; everyone else needs an active cohort grant."""
    if getattr(user, "role", None) in STAFF_ROLES:
        return True

    user_id = getattr(user, "id", None)
    if user_id is None:
        return False

    grant = (
        db.query(GsLmsBetaAccess)
        .filter(GsLmsBetaAccess.user_id == user_id)
        .one_or_none()
    )
    return grant is not None and grant_is_active(grant, now=now)


def require_gs_lms_access(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency guarding every GS LMS route.

    Returns the authenticated user when access is allowed. Raises 403 with an
    operationally actionable message when the cohort grant is missing or no
    longer active. Authentication failures still surface as 401 upstream.
    """
    if not enforcement_enabled():
        return current_user

    if user_has_gs_lms_access(db, current_user):
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=(
            "GS LMS beta access is not active for this account. "
            "Ask the program team to activate your cohort access."
        ),
    )


__all__ = [
    "ACTIVE_STATUS",
    "STAFF_ROLES",
    "enforcement_enabled",
    "grant_is_active",
    "user_has_gs_lms_access",
    "require_gs_lms_access",
]
