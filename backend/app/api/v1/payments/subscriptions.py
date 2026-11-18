"""Subscription query endpoint.

Returns the current active subscription for the authenticated student.

Requirements: 4.4, 4.5, 4.6, 4.7
"""

import math

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.v1.payments.schemas import SubscriptionResponse
from app.core.payments.subscriptions import (
    as_utc,
    get_current_active_subscription,
    utc_now,
)
from app.db.session import get_db
from app.models.domain import User

router = APIRouter()


@router.get("/subscription", response_model=SubscriptionResponse)
def get_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SubscriptionResponse:
    """Return the current active subscription for the authenticated student.

    Queries for a subscription where status='active' and end_date > now().
    If found, returns full subscription details with remaining_days.
    If not found (no active subscription or expired), returns inactive status.
    """
    now = utc_now()
    subscription = get_current_active_subscription(
        db,
        current_user.google_uid,
        now=now,
    )

    if not subscription:
        return SubscriptionResponse(status="inactive", plan_tier=None)

    remaining_days = math.ceil(
        (as_utc(subscription.end_date) - now).total_seconds() / 86400
    )

    return SubscriptionResponse(
        status="active",
        plan_tier=subscription.plan_tier,
        billing_cycle=subscription.billing_cycle,
        start_date=subscription.start_date,
        end_date=subscription.end_date,
        remaining_days=remaining_days,
        order_id=subscription.order_id,
    )
