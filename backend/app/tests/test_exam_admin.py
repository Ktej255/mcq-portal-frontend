"""Owner CLI for exams: seeding NEET/JEE subjects and switching exams on/off."""

from __future__ import annotations

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.main  # noqa: F401  (registers every model on Base.metadata)
from app.api.dependencies import ai_rate_limit, get_current_user
from app.api.v1.gs_lms import router as gs_lms_router
from app.core.gs.models import GsExam, GsSubject
from app.core.gs_lms import exam_admin as ea
from app.db.session import Base, get_db
from app.models.domain import RoleEnum, User

API = "/api/v1/gs-lms"


@pytest.fixture()
def session_factory():
    engine = create_engine(
        "sqlite:///:memory:", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    with SessionLocal() as db:
        # Like a fresh e2e/dev database: only UPSC exists, with one UPSC subject.
        upsc = GsExam(code="upsc", name="UPSC", display_order=0, is_active=True)
        db.add(upsc)
        db.flush()
        db.add(GsSubject(id=1, slug="geography", name="Geography", display_order=1, exam_id=upsc.id))
        db.add(User(id=1, email="s@test.local", full_name="S", role=RoleEnum.STUDENT, google_uid="g1"))
        db.commit()
    return SessionLocal


@pytest.fixture()
def db(session_factory):
    with session_factory() as s:
        yield s


@pytest.fixture()
def client(session_factory):
    app_ = FastAPI()
    app_.include_router(gs_lms_router, prefix=API)

    def _db():
        s = session_factory()
        try:
            yield s
        finally:
            s.close()

    app_.dependency_overrides[get_db] = _db
    app_.dependency_overrides[get_current_user] = lambda: User(
        id=1, email="s@test.local", full_name="S", role=RoleEnum.STUDENT, google_uid="g1"
    )
    app_.dependency_overrides[ai_rate_limit] = lambda: None
    return TestClient(app_)


def _slugs(db, exam):
    return [
        s.slug
        for s in db.query(GsSubject).join(GsExam, GsExam.id == GsSubject.exam_id)
        .filter(GsExam.code == exam).order_by(GsSubject.display_order)
    ]


@pytest.mark.parametrize("exam,expected", [
    ("neet", [("neet-physics", "Physics"), ("neet-chemistry", "Chemistry"), ("neet-biology", "Biology")]),
    ("jee", [("jee-physics", "Physics"), ("jee-chemistry", "Chemistry"), ("jee-maths", "Mathematics")]),
])
def test_seed_creates_standard_subjects_and_is_idempotent(db, exam, expected):
    created = ea.seed_subjects(db, exam)
    db.commit()
    assert created == [slug for slug, _ in expected]
    rows = db.query(GsSubject).filter(GsSubject.slug.in_([s for s, _ in expected])).order_by(GsSubject.display_order).all()
    assert [(r.slug, r.name) for r in rows] == expected
    assert [r.display_order for r in rows] == [1, 2, 3]
    assert {r.exam.code for r in rows} == {exam}

    assert ea.seed_subjects(db, exam) == []  # second run: nothing new
    db.commit()
    assert db.query(GsSubject).filter(GsSubject.slug.in_([s for s, _ in expected])).count() == 3
    assert db.query(GsExam).filter(GsExam.code == exam).count() == 1


def test_seed_creates_the_exam_row_inactive_when_missing(db):
    assert db.query(GsExam).filter(GsExam.code == "neet").count() == 0
    ea.seed_subjects(db, "neet")
    db.commit()
    assert db.query(GsExam).filter(GsExam.code == "neet").one().is_active is False


def test_seed_does_not_touch_an_existing_subject(db):
    ea.seed_subjects(db, "neet")
    physics = db.query(GsSubject).filter_by(slug="neet-physics").one()
    physics.name = "NEET Physics (renamed)"
    db.commit()
    ea.seed_subjects(db, "neet")
    db.commit()
    assert db.query(GsSubject).filter_by(slug="neet-physics").one().name == "NEET Physics (renamed)"


def test_seed_refuses_a_slug_owned_by_another_exam(db):
    upsc = db.query(GsExam).filter_by(code="upsc").one()
    db.add(GsSubject(id=5, slug="jee-physics", name="Odd", display_order=9, exam_id=upsc.id))
    db.commit()
    with pytest.raises(ea.ExamAdminError):
        ea.seed_subjects(db, "jee")


def test_seed_rejects_upsc_and_unknown_exams(db):
    with pytest.raises(ea.ExamAdminError):
        ea.seed_subjects(db, "upsc")
    with pytest.raises(ea.ExamAdminError):
        ea.seed_subjects(db, "gate")


def test_activate_and_deactivate_flip_the_flag(db, client):
    ea.seed_subjects(db, "neet")
    db.commit()
    assert [e["code"] for e in client.get(f"{API}/exams").json()] == ["upsc"]

    assert ea.set_active(db, "neet", True) is True
    db.commit()
    assert [e["code"] for e in client.get(f"{API}/exams").json()] == ["upsc", "neet"]
    assert ea.set_active(db, "neet", True) is False  # already active

    assert ea.set_active(db, "neet", False) is True
    db.commit()
    assert [e["code"] for e in client.get(f"{API}/exams").json()] == ["upsc"]


def test_upsc_cannot_be_deactivated(db):
    with pytest.raises(ea.ExamAdminError):
        ea.set_active(db, "upsc", False)
    db.rollback()
    assert db.query(GsExam).filter_by(code="upsc").one().is_active is True
    assert ea.set_active(db, "upsc", True) is False  # activating UPSC is a no-op


def test_seeded_subjects_are_listed_but_closed_until_content_is_reviewed(db, client):
    ea.seed_subjects(db, "neet")
    ea.set_active(db, "neet", True)
    db.commit()
    rows = client.get(f"{API}/subjects", params={"exam": "neet"}).json()
    data = rows["data"] if isinstance(rows, dict) else rows
    assert [r["slug"] for r in data] == ["neet-physics", "neet-chemistry", "neet-biology"]
    assert all(r["exam"] == "neet" and r["available"] is False and r["topics"] == 0 for r in data)


def test_upsc_is_unaffected_by_seeding_and_activation(db, client):
    before = client.get(f"{API}/subjects").json()
    ea.seed_subjects(db, "neet")
    ea.seed_subjects(db, "jee")
    ea.set_active(db, "neet", True)
    db.commit()
    after = client.get(f"{API}/subjects").json()
    assert after == before
    assert _slugs(db, "upsc") == ["geography"]
    assert [r["slug"] for r in (after["data"] if isinstance(after, dict) else after)] == ["geography"]
