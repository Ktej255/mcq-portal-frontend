"""Shared read-only subscription resolution helpers."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.core.payments.models import Subscription


def utc_now() -> datetime:
    """Return the timezone-aware instant used for subscription expiry checks."""
    return datetime.now(timezone.utc)


def get_current_active_subscription(
    db: Session,
    google_uid: str,
    *,
    now: Optional[datetime] = None,
) -> Optional[Subscription]:
    """Return the latest non-expired active subscription for a Google UID."""
    effective_now = now or utc_now()
    if effective_now.tzinfo is None or effective_now.utcoffset() is None:
        raise ValueError("Subscription resolution requires a timezone-aware instant")

    return (
        db.query(Subscription)
        .filter(
            Subscription.user_id == google_uid,
            Subscription.status == "active",
            Subscription.end_date > effective_now,
        )
        .order_by(Subscription.created_at.desc(), Subscription.id.desc())
        .first()
    )


def as_utc(value: datetime) -> datetime:
    """Treat legacy naive persisted timestamps as UTC for response arithmetic."""
    if value.tzinfo is None or value.utcoffset() is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)
