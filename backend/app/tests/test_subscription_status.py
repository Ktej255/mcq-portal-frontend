"""GET /payments/subscription for an active subscriber.

Regression: end_date comes back from the database without a timezone, and the
endpoint subtracted it from an aware datetime, so every active subscriber got
a 500.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.main  # noqa: F401  (register every model)
from app.api.dependencies import get_current_user
from app.api.v1.payments.subscriptions import router
from app.core.payments.models import PaymentOrder, Subscription
from app.db.session import Base, get_db
from app.models.domain import RoleEnum, User


def test_active_subscription_reports_remaining_days():
    engine = create_engine(
        "sqlite:///:memory:", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True, expire_on_commit=False)

    naive_now = datetime.now(timezone.utc).replace(tzinfo=None)
    with SessionLocal() as db:
        user = User(google_uid="uid-sub", email="sub@example.com", role=RoleEnum.STUDENT)
        db.add(user)
        db.add(PaymentOrder(order_id="o-1", user_id="uid-sub", plan_tier="pro", billing_cycle="monthly", amount=999, status="paid"))
        db.add(Subscription(
            user_id="uid-sub", plan_tier="pro", billing_cycle="monthly", order_id="o-1",
            start_date=naive_now - timedelta(days=1), end_date=naive_now + timedelta(days=10), status="active",
        ))
        db.commit()
        db.refresh(user)

    def _db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    api = FastAPI()
    api.include_router(router, prefix="/payments")
    api.dependency_overrides[get_db] = _db
    api.dependency_overrides[get_current_user] = lambda: user

    resp = TestClient(api).get("/payments/subscription")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "active" and body["plan_tier"] == "pro"
    assert body["remaining_days"] in (10, 11)
