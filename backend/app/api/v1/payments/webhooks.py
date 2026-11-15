"""
Cashfree Webhook Handler.

POST /webhooks/cashfree — Receives asynchronous payment/refund notifications
from Cashfree. Validated by webhook signature (no auth header required).

Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4.1, 4.2, 4.3, 7.4, 7.7
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.core.payments.models import (
    PaymentOrder,
    PaymentWebhookLog,
    Subscription,
)
from app.core.payments.pricing import BILLING_CYCLES
from app.core.payments.service import CashfreePaymentService
from app.api.v1.payments.dependencies import get_payment_service
from app.db.session import get_db

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_cycle_months(billing_cycle: str) -> int:
    """Return the number of months for a billing cycle."""
    cycle_info = BILLING_CYCLES.get(billing_cycle)
    if cycle_info:
        return cycle_info["months"]
    # Fallback: 1 month if unknown cycle
    logger.warning("Unknown billing_cycle '%s', defaulting to 1 month", billing_cycle)
    return 1


def _create_subscription(
    db: Session,
    order: PaymentOrder,
    now: datetime,
) -> Subscription:
    """Create a new active subscription and supersede any previous ones."""
    # Supersede any previous active subscriptions for this user
    active_subs = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == order.user_id,
            Subscription.status == "active",
        )
        .all()
    )
    for sub in active_subs:
        sub.status = "superseded"
        sub.updated_at = now

    # Compute end_date based on billing cycle
    months = _get_cycle_months(order.billing_cycle)
    end_date = now + relativedelta(months=months)

    # Create new subscription
    subscription = Subscription(
        user_id=order.user_id,
        plan_tier=order.plan_tier,
        billing_cycle=order.billing_cycle,
        order_id=order.order_id,
        start_date=now,
        end_date=end_date,
        status="active",
    )
    db.add(subscription)
    return subscription


def _log_webhook(
    db: Session,
    event_type: str | None,
    order_id: str | None,
    cashfree_order_id: str | None,
    payment_status: str | None,
    raw_payload: dict | None,
    signature_valid: bool,
    processing_outcome: str,
    source_ip: str | None,
) -> PaymentWebhookLog:
    """Store webhook in audit log."""
    log_entry = PaymentWebhookLog(
        event_type=event_type,
        order_id=order_id,
        cashfree_order_id=cashfree_order_id,
        payment_status=payment_status,
        raw_payload=raw_payload,
        signature_valid=signature_valid,
        processing_outcome=processing_outcome,
        source_ip=source_ip,
    )
    db.add(log_entry)
    return log_entry


# ---------------------------------------------------------------------------
# Webhook Endpoint
# ---------------------------------------------------------------------------

@router.post("/webhooks/cashfree")
async def cashfree_webhook(
    request: Request,
    db: Session = Depends(get_db),
    payment_service: CashfreePaymentService = Depends(get_payment_service),
):
    """Handle Cashfree payment/refund webhook notifications.

    This endpoint does NOT require an auth header. It is validated
    solely by the Cashfree webhook signature (HMAC-SHA256).

    Always returns 200 for valid signatures to acknowledge receipt.
    Returns 401 only for invalid signatures.
    """
    # 1. Read raw body
    raw_body = await request.body()
    raw_body_str = raw_body.decode("utf-8")

    # 2. Extract signature headers
    timestamp = request.headers.get("x-webhook-timestamp", "")
    signature = request.headers.get("x-webhook-signature", "")

    # Source IP for logging
    source_ip = request.client.host if request.client else None

    # 3. Verify webhook signature
    is_valid = payment_service.verify_webhook_signature(
        timestamp=timestamp,
        raw_body=raw_body_str,
        signature=signature,
    )

    if not is_valid:
        logger.warning(
            "Invalid webhook signature from IP=%s, timestamp=%s",
            source_ip,
            timestamp,
        )
        _log_webhook(
            db=db,
            event_type=None,
            order_id=None,
            cashfree_order_id=None,
            payment_status=None,
            raw_payload=None,
            signature_valid=False,
            processing_outcome="invalid_signature",
            source_ip=source_ip,
        )
        db.commit()
        return Response(status_code=401, content="Invalid signature")

    # 4. Parse the webhook payload
    try:
        payload = json.loads(raw_body_str)
    except (json.JSONDecodeError, ValueError):
        logger.error("Failed to parse webhook payload from IP=%s", source_ip)
        _log_webhook(
            db=db,
            event_type=None,
            order_id=None,
            cashfree_order_id=None,
            payment_status=None,
            raw_payload=None,
            signature_valid=True,
            processing_outcome="parse_error",
            source_ip=source_ip,
        )
        db.commit()
        return Response(status_code=200, content="OK")

    # Extract event type and relevant data
    event_type = payload.get("type") or payload.get("event_type")
    data = payload.get("data", {})

    # Determine if this is a refund webhook or payment webhook
    is_refund_event = "refund" in (event_type or "").lower()

    # --- Refund webhook handling ---
    if is_refund_event:
        return _handle_refund_webhook(
            db=db,
            payload=payload,
            data=data,
            event_type=event_type,
            source_ip=source_ip,
        )

    # --- Payment webhook handling ---
    return _handle_payment_webhook(
        db=db,
        payload=payload,
        data=data,
        event_type=event_type,
        source_ip=source_ip,
    )


# ---------------------------------------------------------------------------
# Payment Webhook Processing
# ---------------------------------------------------------------------------

def _handle_payment_webhook(
    db: Session,
    payload: dict,
    data: dict,
    event_type: str | None,
    source_ip: str | None,
) -> Response:
    """Process one payment status event with monotonic order transitions.

    ``failed -> paid`` is a valid recovery transition. Once an order is paid,
    later failure events are stale and must never downgrade it. The current
    webhook log row is mutated directly so a replay cannot relabel another
    event that is still pending.
    """
    order_data = data.get("order", {})
    payment_data = data.get("payment", {})
    order_id = order_data.get("order_id") or data.get("order_id")
    cashfree_order_id = order_data.get("order_id")
    payment_status = (
        payment_data.get("payment_status")
        or order_data.get("order_status")
        or data.get("payment_status")
        or ""
    ).upper()
    webhook_log = _log_webhook(
        db=db,
        event_type=event_type,
        order_id=order_id,
        cashfree_order_id=cashfree_order_id,
        payment_status=payment_status,
        raw_payload=payload,
        signature_valid=True,
        processing_outcome="pending",
        source_ip=source_ip,
    )

    if not order_id:
        logger.warning(
            "Webhook received without order_id, event_type=%s, IP=%s",
            event_type,
            source_ip,
        )
        webhook_log.processing_outcome = "missing_order"
        db.commit()
        return Response(status_code=200, content="OK")

    # The lock is effective on databases that support row-level locking and is
    # intentionally harmless for the in-memory SQLite regression database.
    order = (
        db.query(PaymentOrder)
        .filter(PaymentOrder.order_id == order_id)
        .with_for_update()
        .first()
    )
    if order is None:
        logger.warning(
            "Webhook for unknown order_id=%s, event_type=%s, IP=%s",
            order_id,
            event_type,
            source_ip,
        )
        webhook_log.processing_outcome = "unknown_order"
        db.commit()
        return Response(status_code=200, content="OK")

    paid_statuses = {"PAID", "SUCCESS"}
    failed_statuses = {"FAILED", "CANCELLED", "USER_DROPPED"}

    if order.status == "paid":
        webhook_log.processing_outcome = (
            "stale_status" if payment_status in failed_statuses else "duplicate"
        )
        logger.info(
            "Ignoring payment event for already-paid order_id=%s status=%s",
            order_id,
            payment_status,
        )
        db.commit()
        return Response(status_code=200, content="OK")

    if order.status == "failed" and payment_status not in paid_statuses:
        webhook_log.processing_outcome = (
            "duplicate" if payment_status in failed_statuses else "unhandled_status"
        )
        db.commit()
        return Response(status_code=200, content="OK")

    now = datetime.now(timezone.utc)

    if payment_status in paid_statuses:
        order.status = "paid"
        order.webhook_received_at = now
        order.updated_at = now
        order.payment_method = payment_data.get("payment_method")
        order.cashfree_payment_id = payment_data.get("cf_payment_id")
        _create_subscription(db=db, order=order, now=now)
        webhook_log.processing_outcome = "processed"
        logger.info(
            "Order %s marked as paid, subscription created for user %s",
            order_id,
            order.user_id,
        )
        db.commit()
        return Response(status_code=200, content="OK")

    if payment_status in failed_statuses:
        order.status = "failed"
        order.webhook_received_at = now
        order.updated_at = now
        webhook_log.processing_outcome = "processed"
        logger.info("Order %s marked as failed (status=%s)", order_id, payment_status)
        db.commit()
        return Response(status_code=200, content="OK")

    logger.info(
        "Webhook with unhandled payment_status='%s' for order_id=%s",
        payment_status,
        order_id,
    )
    webhook_log.processing_outcome = "unhandled_status"
    db.commit()
    return Response(status_code=200, content="OK")


# ---------------------------------------------------------------------------
# Refund Webhook Processing
# ---------------------------------------------------------------------------

def _handle_refund_webhook(
    db: Session,
    payload: dict,
    data: dict,
    event_type: str | None,
    source_ip: str | None,
) -> Response:
    """Process a refund status event and update only its audit row."""
    refund_data = data.get("refund", {})
    order_id = (
        refund_data.get("order_id")
        or data.get("order", {}).get("order_id")
        or data.get("order_id")
    )
    refund_status = (refund_data.get("refund_status") or "").upper()
    refund_amount = refund_data.get("refund_amount")
    webhook_log = _log_webhook(
        db=db,
        event_type=event_type,
        order_id=order_id,
        cashfree_order_id=order_id,
        payment_status=f"REFUND_{refund_status}",
        raw_payload=payload,
        signature_valid=True,
        processing_outcome="pending",
        source_ip=source_ip,
    )

    if not order_id:
        logger.warning(
            "Refund webhook without order_id, event_type=%s, IP=%s",
            event_type,
            source_ip,
        )
        webhook_log.processing_outcome = "missing_order"
        db.commit()
        return Response(status_code=200, content="OK")

    order = (
        db.query(PaymentOrder)
        .filter(PaymentOrder.order_id == order_id)
        .with_for_update()
        .first()
    )
    if order is None:
        logger.warning(
            "Refund webhook for unknown order_id=%s, IP=%s", order_id, source_ip
        )
        webhook_log.processing_outcome = "unknown_order"
        db.commit()
        return Response(status_code=200, content="OK")

    now = datetime.now(timezone.utc)

    if refund_status == "SUCCESS":
        order.refund_status = "refunded"
        order.updated_at = now
        is_full_refund = (
            refund_amount is not None and float(refund_amount) >= order.amount
        )
        if is_full_refund:
            subscription = (
                db.query(Subscription)
                .filter(
                    Subscription.order_id == order.order_id,
                    Subscription.status == "active",
                )
                .first()
            )
            if subscription:
                subscription.status = "cancelled"
                subscription.updated_at = now
                logger.info(
                    "Subscription cancelled for order %s (full refund)",
                    order_id,
                )
        webhook_log.processing_outcome = "processed"
        logger.info(
            "Refund SUCCESS for order %s (amount=%s, full=%s)",
            order_id,
            refund_amount,
            is_full_refund,
        )
        db.commit()
        return Response(status_code=200, content="OK")

    if refund_status == "FAILED":
        order.refund_status = "refund_failed"
        order.updated_at = now
        webhook_log.processing_outcome = "processed"
        logger.info("Refund FAILED for order %s", order_id)
        db.commit()
        return Response(status_code=200, content="OK")

    logger.info(
        "Refund webhook with unhandled status='%s' for order_id=%s",
        refund_status,
        order_id,
    )
    webhook_log.processing_outcome = "unhandled_status"
    db.commit()
    return Response(status_code=200, content="OK")
