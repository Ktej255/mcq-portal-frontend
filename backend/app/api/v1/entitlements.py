from typing import Any, List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import math
from datetime import datetime, timezone

from app.api.dependencies import get_current_user, mcqs_answered_today, resolve_access
from app.core.config import settings
from app.core.entitlements import ENTITLEMENTS, get_entitlements
from app.db.session import get_db
from app.models.domain import User
from app.schemas.common import StandardResponse
from app.schemas.entitlements import Entitlements

router = APIRouter()


@router.get("/me", response_model=StandardResponse[Entitlements])
def get_my_entitlements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """The signed-in student's plan, trial status, limits and usage today."""
    access = resolve_access(current_user, db)
    data = dict(access.entitlements)
    data.update(
        source=access.source,
        paywall_enabled=settings.PAYWALL_ENABLED,
        trial_ends_at=access.trial_ends_at,
        mcqs_used_today=mcqs_answered_today(db, current_user) if settings.PAYWALL_ENABLED else 0,
    )
    if access.trial_ends_at is not None:
        seconds = (access.trial_ends_at - datetime.now(timezone.utc)).total_seconds()
        data["trial_days_left"] = max(0, math.ceil(seconds / 86400))
    return StandardResponse(data=data)


@router.get("/catalog", response_model=StandardResponse[List[Entitlements]])
def get_entitlement_catalog() -> Any:
    """Public catalogue of every tier's capabilities/limits."""
    catalog = [get_entitlements(tier) for tier in ENTITLEMENTS.keys()]
    return StandardResponse(data=catalog)