from typing import Any, List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.entitlements import DEFAULT_TIER, ENTITLEMENTS, get_entitlements
from app.core.payments.models import Subscription
from app.db.session import get_db
from app.models.domain import User
from app.schemas.common import StandardResponse
from app.schemas.entitlements import Entitlements

router = APIRouter()


def _resolve_tier(user: User, db: Session) -> str:
    """Resolve the user's active subscription tier, falling back to free."""
    try:
        sub = (
            db.query(Subscription)
            .filter(Subscription.user_id == user.google_uid, Subscription.status == "active")
            .order_by(Subscription.created_at.desc())
            .first()
        )
        if sub and sub.plan_tier:
            return sub.plan_tier or DEFAULT_TIER
    except Exception:
        db.rollback()
    return DEFAULT_TIER


@router.get("/me", response_model=StandardResponse[Entitlements])
def get_my_entitlements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Capabilities/limits for the authenticated user's current tier."""
    tier = _resolve_tier(current_user, db)
    return StandardResponse(data=get_entitlements(tier))


@router.get("/catalog", response_model=StandardResponse[List[Entitlements]])
def get_entitlement_catalog() -> Any:
    """Public catalogue of every tier's capabilities/limits."""
    catalog = [get_entitlements(tier) for tier in ENTITLEMENTS.keys()]
    return StandardResponse(data=catalog)