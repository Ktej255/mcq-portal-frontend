#!/usr/bin/env python3
"""Build a fresh SQLite database for the Playwright end-to-end tests.

Creates every table, loads the GS Geography content with the real importer,
and adds three students the tests sign in as (local mock auth maps the browser
token ``MOCK_TOKEN_local_<id>`` to the user whose google_uid is
``TOKEN_local_<id>``):

* e2e-new        — signed up today, no profile yet (first-time setup flow)
* e2e-student    — signed up today, so inside the free trial
* e2e-expired    — signed up 30 days ago, trial over, no plan
* e2e-foundation — trial over, active Foundation plan

Usage (from backend/):
    DATABASE_URL=sqlite:///./e2e.db python scripts/e2e_seed.py
"""
from __future__ import annotations

import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import app.main  # noqa: F401,E402  (registers every model on Base.metadata)
from app.core.gs_lms.importer import import_gs_geography  # noqa: E402
from app.core.gs_lms.student_models import GsLmsOnboardingStatus  # noqa: E402
from app.core.payments.models import PaymentOrder, Subscription  # noqa: E402
from app.db.session import Base, SessionLocal, engine  # noqa: E402
from app.models.domain import RoleEnum, StudentProfile, User  # noqa: E402
from scripts.seed_production import _ensure_subjects  # noqa: E402

STUDENTS = {
    "e2e-new": 0,
    "e2e-student": 0,
    "e2e-expired": 30,
    "e2e-foundation": 30,
}


def main() -> None:
    url = os.environ.get("DATABASE_URL", "")
    if not url.startswith("sqlite"):
        raise SystemExit("Refusing to seed: DATABASE_URL must point at a throwaway SQLite file.")

    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    now = datetime.now(timezone.utc)
    with SessionLocal() as db:
        _ensure_subjects(db)
        import_gs_geography(db, review_status="REVIEWED")
        for uid, days_old in STUDENTS.items():
            user = User(
                google_uid=f"TOKEN_local_{uid}",
                email=f"{uid}@example.com",
                full_name=uid,
                role=RoleEnum.STUDENT,
                created_at=now - timedelta(days=days_old),
            )
            db.add(user)
            db.flush()
            if uid != "e2e-new":
                # A finished self-study profile and Geography setup, so these
                # students skip setup and the welcome video.
                db.add(GsLmsOnboardingStatus(
                    student_id=user.id, completed=True, completed_at=now.replace(tzinfo=None),
                    bandwidth_selected=2, learner_level="beginner", study_window_minutes=90,
                ))
                db.add(StudentProfile(user_id=user.id, profile={
                    "level": "beginner",
                    "studyWindow": "90",
                    "updatedAt": now.isoformat(),
                    "welcomeVideoCompleted": True,
                    "inductionCompleted": True,
                }))
        db.add(PaymentOrder(
            order_id="e2e-order-foundation", user_id="TOKEN_local_e2e-foundation",
            plan_tier="foundation", billing_cycle="monthly", amount=399, status="paid",
        ))
        db.add(Subscription(
            user_id="TOKEN_local_e2e-foundation", plan_tier="foundation", billing_cycle="monthly",
            order_id="e2e-order-foundation", start_date=now - timedelta(days=1),
            end_date=now + timedelta(days=29), status="active",
        ))
        db.commit()
    print("e2e database ready")


if __name__ == "__main__":
    main()
