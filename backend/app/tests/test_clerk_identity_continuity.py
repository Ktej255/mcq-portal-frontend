"""Regression coverage for Clerk-to-local identity continuity (Task 4.1)."""
from datetime import datetime, timedelta, timezone

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api import dependencies
from app.api.dependencies import get_current_user
from app.core.gs_lms.student_models import GsLmsOnboardingStatus
from app.core.optional.models import OptionalSubject
from app.core.optional.student_models import SubjectSelection
from app.core.payments.models import PaymentOrder, Subscription
from app.core.payments.subscriptions import get_current_active_subscription
from app.db.session import Base, get_db
from app.models.domain import (
    Attempt,
    Report,
    StudentProfile,
    StudentSubjectProgress,
    Subject,
    Test,
    User,
)


def test_repeated_clerk_resolution_preserves_downstream_identity(monkeypatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    tables = [
        User.__table__,
        Subject.__table__,
        Test.__table__,
        Attempt.__table__,
        Report.__table__,
        StudentProfile.__table__,
        StudentSubjectProgress.__table__,
        GsLmsOnboardingStatus.__table__,
        OptionalSubject.__table__,
        SubjectSelection.__table__,
        PaymentOrder.__table__,
        Subscription.__table__,
    ]
    Base.metadata.create_all(engine, tables=tables)
    SessionLocal = sessionmaker(bind=engine)

    def override_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app = FastAPI()
    app.dependency_overrides[get_db] = override_db

    @app.get("/whoami")
    def whoami(user: User = Depends(get_current_user)):
        return {"id": user.id, "external_id": user.google_uid}

    claims = {
        "sub": "clerk-stable-subject",
        "email": "student@example.com",
        "name": "Original Name",
        "picture": None,
    }
    monkeypatch.setattr(dependencies, "verify_token", lambda _token: claims.copy())
    client = TestClient(app)

    first = client.get("/whoami", headers={"Authorization": "Bearer real-token"})
    assert first.status_code == 200, first.text
    local_user_id = first.json()["id"]

    db = SessionLocal()
    subject = Subject(name="Identity continuity subject")
    test = Test(title="Identity continuity test", subject=subject)
    attempt = Attempt(user_id=local_user_id, test=test)
    report = Report(
        attempt=attempt,
        total_score=1.0,
        accuracy=100.0,
        correct_count=1,
        incorrect_count=0,
        unattempted_count=0,
    )
    optional_subject = OptionalSubject(slug="identity-optional", name="Identity Optional")
    payment_order = PaymentOrder(
        order_id="SARIT-IDENTITY-CONTINUITY",
        user_id=claims["sub"],
        user_email=claims["email"],
        plan_tier="standard",
        billing_cycle="monthly",
        amount=100,
    )
    subscription = Subscription(
        user_id=claims["sub"],
        plan_tier="standard",
        billing_cycle="monthly",
        order=payment_order,
        start_date=datetime.now(timezone.utc) - timedelta(days=1),
        end_date=datetime.now(timezone.utc) + timedelta(days=30),
        status="active",
    )
    db.add_all([
        StudentProfile(user_id=local_user_id, profile={"level": "beginner"}),
        StudentSubjectProgress(
            user_id=local_user_id,
            subject_slug="geography",
            progress={"day1": {"completed": True}},
        ),
        GsLmsOnboardingStatus(student_id=local_user_id),
        optional_subject,
        SubjectSelection(
            student_id=local_user_id,
            subject=optional_subject,
            is_active=True,
        ),
        report,
        subscription,
    ])
    db.commit()
    attempt_id = attempt.id
    report_id = report.id
    subscription_id = subscription.id
    db.close()

    claims.update({"email": "updated@example.com", "name": "Updated Name"})
    second = client.get("/whoami", headers={"Authorization": "Bearer real-token"})
    assert second.status_code == 200, second.text
    assert second.json() == {
        "id": local_user_id,
        "external_id": "clerk-stable-subject",
    }

    db = SessionLocal()
    assert db.query(User).count() == 1
    user = db.query(User).one()
    assert (user.id, user.email, user.full_name) == (
        local_user_id,
        "updated@example.com",
        "Updated Name",
    )
    assert db.query(StudentProfile).one().user_id == local_user_id
    assert db.query(StudentSubjectProgress).one().user_id == local_user_id
    assert db.query(GsLmsOnboardingStatus).one().student_id == local_user_id
    assert db.query(SubjectSelection).one().student_id == local_user_id
    assert db.query(Attempt).filter_by(id=attempt_id).one().user_id == local_user_id
    assert db.query(Report).filter_by(id=report_id).one().attempt.user_id == local_user_id
    assert db.query(PaymentOrder).one().user_id == user.google_uid
    assert get_current_active_subscription(db, user.google_uid).id == subscription_id
    db.close()
    app.dependency_overrides.clear()
