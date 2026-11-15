"""Hermetic regressions for payment webhook state transitions."""
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from fastapi import Response

from app.api.v1.payments.webhooks import _handle_payment_webhook
from app.core.payments.models import PaymentOrder, PaymentWebhookLog, Subscription
from app.core.payments.subscriptions import get_current_active_subscription
from app.db.session import Base


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(
        engine,
        tables=[PaymentOrder.__table__, Subscription.__table__, PaymentWebhookLog.__table__],
    )
    session = Session(engine)
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def _payload(order_id: str, status: str) -> dict:
    return {"type": "PAYMENT_STATUS", "data": {"order": {"order_id": order_id, "order_status": status}}}


def _order(db: Session, order_id: str, status: str = "pending") -> PaymentOrder:
    value = PaymentOrder(
        order_id=order_id,
        user_id="student-1",
        user_email="student@example.com",
        plan_tier="plus",
        billing_cycle="monthly",
        amount=699,
        status=status,
    )
    db.add(value)
    db.commit()
    return value


def test_failed_to_paid_creates_one_subscription(db: Session):
    _order(db, "ORDER-FAILED-PAID", status="failed")
    response = _handle_payment_webhook(
        db, _payload("ORDER-FAILED-PAID", "PAID"), _payload("ORDER-FAILED-PAID", "PAID")["data"], "PAYMENT_STATUS", "127.0.0.1"
    )
    assert isinstance(response, Response)
    assert response.status_code == 200
    assert db.query(PaymentOrder).one().status == "paid"
    assert db.query(Subscription).count() == 1
    assert db.query(PaymentWebhookLog).one().processing_outcome == "processed"


def test_duplicate_paid_is_noop_and_logs_current_event(db: Session):
    _order(db, "ORDER-DUPLICATE")
    payload = _payload("ORDER-DUPLICATE", "PAID")
    _handle_payment_webhook(db, payload, payload["data"], "PAYMENT_STATUS", "127.0.0.1")
    _handle_payment_webhook(db, payload, payload["data"], "PAYMENT_STATUS", "127.0.0.1")
    assert db.query(Subscription).count() == 1
    outcomes = [
        row.processing_outcome
        for row in db.query(PaymentWebhookLog).order_by(PaymentWebhookLog.id).all()
    ]
    assert outcomes == ["processed", "duplicate"]


def test_paid_to_failed_does_not_downgrade(db: Session):
    _order(db, "ORDER-STALE-FAILED")
    paid = _payload("ORDER-STALE-FAILED", "PAID")
    failed = _payload("ORDER-STALE-FAILED", "FAILED")
    _handle_payment_webhook(db, paid, paid["data"], "PAYMENT_STATUS", "127.0.0.1")
    _handle_payment_webhook(db, failed, failed["data"], "PAYMENT_STATUS", "127.0.0.1")
    assert db.query(PaymentOrder).one().status == "paid"
    assert db.query(Subscription).count() == 1
    assert db.query(PaymentWebhookLog).order_by(PaymentWebhookLog.id).all()[-1].processing_outcome == "stale_status"


def test_expired_active_subscription_is_not_current(db: Session):
    now = datetime.now(timezone.utc)
    order = _order(db, "ORDER-EXPIRED")
    db.add(
        Subscription(
            user_id=order.user_id,
            plan_tier="plus",
            billing_cycle="monthly",
            order_id=order.order_id,
            start_date=now - timedelta(days=31),
            end_date=now - timedelta(minutes=1),
            status="active",
        )
    )
    db.commit()
    assert get_current_active_subscription(db, order.user_id, now=now) is None
