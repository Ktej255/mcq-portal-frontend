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
from app.core.gs_lms.importer import DEFAULT_ARTIFACT_PATH, import_gs_geography, import_gs_subject  # noqa: E402
from app.core.gs_lms.models import GsLmsBook, GsLmsRetentionQuestion, GsReviewStatusEnum  # noqa: E402
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


# E2E test data: retention questions for Laxmikanth chapter 1 (Preamble).
RETENTION_TEST_QUESTIONS = [
    ("Which of the following is the first word of the Preamble to the Indian Constitution?",
     ["We", "India", "Sovereign", "Constitution"], "A",
     "The Preamble begins with the words 'We, the people of India'."),
    ("The words 'Socialist' and 'Secular' were added to the Preamble by which Constitutional Amendment?",
     ["24th", "42nd", "44th", "52nd"], "B",
     "The 42nd Amendment Act, 1976 added 'Socialist', 'Secular' and 'Integrity'."),
    ("Which of the following is NOT an objective listed in the Preamble?",
     ["Justice", "Liberty", "Equality", "Federalism"], "D",
     "The Preamble secures Justice, Liberty, Equality and promotes Fraternity; Federalism is not listed."),
    ("According to the Preamble, the date on which the Constitution was adopted is:",
     ["26 January 1950", "26 November 1949", "15 August 1947", "9 December 1946"], "B",
     "The Preamble records 26 November 1949 as the date of adoption."),
    ("The Preamble describes India as a:",
     ["Sovereign Socialist Secular Democratic Republic", "Union of Kingdoms",
      "Federal Monarchy", "Confederation of States"], "A",
     "India is declared a Sovereign, Socialist, Secular, Democratic Republic."),
]


def _seed_retention_questions(db) -> None:
    book = db.query(GsLmsBook).filter(GsLmsBook.slug == "laxmikanth-indian-polity-7e").one()
    chapter = next(c for c in book.chapters if c.number == 1)
    for i, (text, options, correct, explanation) in enumerate(RETENTION_TEST_QUESTIONS, start=1):
        db.add(GsLmsRetentionQuestion(
            external_id=f"e2e-retention-{i}",
            subject_slug="polity-governance",
            question_text=text,
            options=[{"label": "ABCD"[j], "text": t} for j, t in enumerate(options)],
            correct_option=correct,
            explanation=explanation,
            explanation_quality="ok",
            answer_status="ok",
            question_type="FACTUAL",
            source_book=book.slug,
            source_chapter=1,
            book_chapter_id=chapter.id,
            review_status=GsReviewStatusEnum.REVIEWED,
        ))


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
        # One reviewed Polity topic (the content template), so the sidebar
        # shows Polity unlocked while the other subjects stay "Soon".
        import_gs_subject(
            db, DEFAULT_ARTIFACT_PATH.parent / "templates" / "gs_subject_template.json", review_status="REVIEWED"
        )
        _seed_retention_questions(db)
        db.flush()
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
