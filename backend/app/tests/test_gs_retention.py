"""Book-chapter retention checks: importer, service, API and migration.

Self-contained fixtures; the (gitignored) converter output is not needed.
"""

from __future__ import annotations

import importlib.util
import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
import sqlalchemy as sa
from alembic.operations import Operations
from alembic.runtime.migration import MigrationContext
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.main  # noqa: F401  (registers every model on Base.metadata)
from app.api.dependencies import get_current_user
from app.api.v1.gs_lms import router as gs_lms_router
from app.core.gs.models import GsReviewStatusEnum as R
from app.core.gs_lms import retention as svc
from app.core.gs_lms.models import (
    GsLmsBook,
    GsLmsBookChapter,
    GsLmsChapterProgress,
    GsLmsChapterStatusEnum as CS,
    GsLmsRetentionQuestion,
)
from app.core.gs_lms.retention_import import (
    format_summary,
    import_directory,
    import_retention_questions,
    load_book_map,
    DEFAULT_BOOK_MAP_PATH,
)
from app.db.session import Base, get_db
from app.models.domain import RoleEnum, User

BOOKS = "/api/v1/gs-lms/books"
MIGRATION_PATH = (
    Path(__file__).resolve().parents[2] / "alembic" / "versions" / "l9f0a1b2c3d4_add_gs_lms_retention.py"
)
BOOK_MAP = {"polity-governance": {"Laxmikanth": "lax-7e", "Spectrum": None}}


class _Who:
    def __init__(self, id, role, email):
        self.id, self.role, self.email = id, role, email


STUDENT = _Who(1, RoleEnum.STUDENT, "s@test.local")
OTHER = _Who(2, RoleEnum.STUDENT, "o@test.local")


@pytest.fixture()
def session_factory():
    engine = create_engine(
        "sqlite:///:memory:", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    with SessionLocal() as db:
        db.add(User(id=1, email="s@test.local", full_name="S", role=RoleEnum.STUDENT, google_uid="g1"))
        db.add(User(id=2, email="o@test.local", full_name="O", role=RoleEnum.STUDENT, google_uid="g2"))
        db.commit()
    return SessionLocal


@pytest.fixture()
def db(session_factory):
    with session_factory() as s:
        yield s


@pytest.fixture()
def who():
    return {"user": STUDENT}


@pytest.fixture()
def client(session_factory, who):
    app_ = FastAPI()
    app_.include_router(gs_lms_router, prefix="/api/v1/gs-lms")

    def _db():
        s = session_factory()
        try:
            yield s
        finally:
            s.close()

    app_.dependency_overrides[get_db] = _db
    app_.dependency_overrides[get_current_user] = lambda: who["user"]
    return TestClient(app_)


def _book(db, slug="lax-7e", chapters=(1, 2)):
    b = GsLmsBook(slug=slug, title="Indian Polity", author="L", edition="7th", subject_slug="polity-governance")
    db.add(b)
    db.flush()
    for n in chapters:
        db.add(GsLmsBookChapter(book_id=b.id, number=n, title=f"Chapter {n}"))
    db.flush()
    return b


def _chapter(db, book, number):
    return db.query(GsLmsBookChapter).filter_by(book_id=book.id, number=number).one()


def _raw(i, **kw):
    """A converter-shaped question."""
    q = {
        "id": f"ee_{i:04d}",
        "question_text": f"Question {i}?",
        "options": [{"label": l, "text": f"opt {l}"} for l in "ABCD"],
        "correct_option": "A",
        "explanation": "because",
        "explanation_quality": "ok",
        "answer_status": "ok",
        "question_type": "FACTUAL",
        "difficulty": "medium",
        "source_ref": {"bank_title": "t", "file": "f", "book": "Laxmikanth", "chapter": 1},
        "is_pyq": False,
        "pyq": None,
    }
    q.update(kw)
    return q


def _rq(db, chapter, n, *, status=R.REVIEWED, correct="A", quality="ok", qtype="FACTUAL", start=0):
    rows = []
    for i in range(start, start + n):
        rows.append(GsLmsRetentionQuestion(
            external_id=f"x_{chapter.id}_{i}_{status.value}_{quality}_{qtype}_{correct}",
            subject_slug="polity-governance", question_text=f"c{chapter.id} q{i}",
            options=[{"label": l, "text": f"opt {l}"} for l in "ABCD"],
            correct_option=correct, explanation="because", explanation_quality=quality,
            answer_status="ok", question_type=qtype, book_chapter_id=chapter.id, review_status=status,
        ))
    db.add_all(rows)
    db.flush()
    return rows


# ---------------------------------------------------------------------------
# Importer
# ---------------------------------------------------------------------------

def test_import_upsert_is_idempotent_and_updates(db):
    _book(db)
    qs = [_raw(1), _raw(2)]
    a = import_retention_questions(db, qs, "polity-governance", book_map=BOOK_MAP)
    assert (a["created"], a["updated"]) == (2, 0)
    qs[0]["question_text"] = "Reworded?"
    b = import_retention_questions(db, qs, "polity-governance", book_map=BOOK_MAP)
    assert (b["created"], b["updated"]) == (0, 2)
    db.commit()
    assert db.query(GsLmsRetentionQuestion).count() == 2
    assert db.query(GsLmsRetentionQuestion).filter_by(external_id="ee_0001").one().question_text == "Reworded?"


def test_import_default_status_unreviewed_and_existing_status_kept(db):
    _book(db)
    import_retention_questions(db, [_raw(1)], "polity-governance", book_map=BOOK_MAP)
    row = db.query(GsLmsRetentionQuestion).one()
    assert row.review_status == R.UNREVIEWED
    import_retention_questions(db, [_raw(1)], "polity-governance", review_status="REVIEWED", book_map=BOOK_MAP)
    assert row.review_status == R.REVIEWED
    import_retention_questions(db, [_raw(1)], "polity-governance", book_map=BOOK_MAP)  # no flag: kept
    assert row.review_status == R.REVIEWED


def test_unverified_questions_are_never_reviewed(db):
    _book(db)
    qs = [
        _raw(1, answer_status="unverified", correct_option=None),
        _raw(2, correct_option=None),                      # status ok but no key
        _raw(3, answer_status="unverified"),               # key present but unverified
        _raw(4),
    ]
    stats = import_retention_questions(db, qs, "polity-governance", review_status="REVIEWED", book_map=BOOK_MAP)
    assert stats["forced_unreviewed"] == 3
    got = {r.external_id: r for r in db.query(GsLmsRetentionQuestion).all()}
    assert [got[f"ee_000{i}"].review_status for i in (1, 2, 3, 4)] == [R.UNREVIEWED] * 3 + [R.REVIEWED]
    assert got["ee_0001"].correct_option is None
    # An already REVIEWED row that becomes unverified is pulled back.
    import_retention_questions(db, [_raw(4, answer_status="unverified")], "polity-governance",
                               review_status="REVIEWED", book_map=BOOK_MAP)
    assert got["ee_0004"].review_status == R.UNREVIEWED


def test_invalid_questions_are_skipped(db):
    stats = import_retention_questions(
        db, [_raw(1, options=[]), {"id": "", "question_text": "x"}, _raw(2, question_text=" ")],
        "polity-governance", book_map=BOOK_MAP)
    assert stats["skipped"] == 3 and stats["created"] == 0


def test_book_mapping_hit_and_miss(db):
    book = _book(db, chapters=(1,))
    qs = [
        _raw(1),                                                                 # hit
        _raw(2, source_ref={"book": "Laxmikanth", "chapter": 9}),                # chapter missing
        _raw(3, source_ref={"book": "Spectrum", "chapter": 1}),                  # placeholder (null)
        _raw(4, source_ref={"book": "Unknown", "chapter": 1}),                   # not in map
        _raw(5, source_ref={"book": None, "chapter": None}),                     # no source
    ]
    stats = import_retention_questions(db, qs, "polity-governance", book_map=BOOK_MAP)
    assert (stats["mapped"], stats["unmapped"]) == (1, 4)
    rows = {r.external_id: r for r in db.query(GsLmsRetentionQuestion).all()}
    assert rows["ee_0001"].book_chapter_id == _chapter(db, book, 1).id
    assert all(rows[f"ee_000{i}"].book_chapter_id is None for i in (2, 3, 4, 5))
    assert rows["ee_0002"].source_chapter == 9 and rows["ee_0002"].source_book == "Laxmikanth"


def test_mapping_to_a_book_that_does_not_exist_is_unmapped(db):
    stats = import_retention_questions(db, [_raw(1)], "polity-governance", book_map=BOOK_MAP)
    assert stats["unmapped"] == 1


def test_remap_updates_existing_rows(db):
    book = _book(db)
    import_retention_questions(db, [_raw(1)], "polity-governance", book_map={})
    row = db.query(GsLmsRetentionQuestion).one()
    assert row.book_chapter_id is None
    import_retention_questions(db, [_raw(1)], "polity-governance", book_map=BOOK_MAP)
    assert row.book_chapter_id == _chapter(db, book, 1).id


def test_import_directory_merges_parts_and_filters_subjects(db, tmp_path):
    _book(db)
    for name, slug, ids in [("polity-governance.json", "polity-governance", [1, 2]),
                            ("history-part1.json", "history", [3]), ("history-part2.json", "history", [4]),
                            ("REPORT.md", None, None)]:
        if slug is None:
            (tmp_path / name).write_text("# report")
        else:
            (tmp_path / name).write_text(json.dumps(
                {"source": "eduecosystem", "subject_slug": slug, "questions": [_raw(i) for i in ids]}))
    res = import_directory(db, tmp_path, book_map=BOOK_MAP)
    assert res["history"]["created"] == 2 and res["polity-governance"]["created"] == 2
    assert "TOTAL" in format_summary(res)
    only = import_directory(db, tmp_path, subjects=["history"], book_map=BOOK_MAP)
    assert list(only) == ["history"] and only["history"]["updated"] == 2


def test_shipped_book_map_maps_laxmikanth_and_ignores_notes():
    m = load_book_map(DEFAULT_BOOK_MAP_PATH)
    assert m["polity-governance"]["Laxmikanth"] == "laxmikanth-indian-polity-7e"
    assert "_about" not in m
    assert m["history"]["Spectrum"] is None  # documented placeholder


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

def test_start_needs_three_reviewed_answerable_questions(db):
    ch = _chapter(db, _book(db), 1)
    _rq(db, ch, 2)
    _rq(db, ch, 5, status=R.UNREVIEWED)
    _rq(db, ch, 5, correct=None)  # reviewed but no key
    with pytest.raises(svc.RetentionError) as e:
        svc.start_check(db, 1, ch.id)
    assert e.value.status_code == 409
    _rq(db, ch, 1, qtype="MAP_BASED")
    assert len(svc.start_check(db, 1, ch.id)) == 3


def test_start_draws_only_reviewed_answerable_up_to_ten_and_stores_ids(db):
    ch = _chapter(db, _book(db), 1)
    good = _rq(db, ch, 14)
    _rq(db, ch, 4, status=R.UNREVIEWED)
    _rq(db, ch, 4, status=R.IN_REVIEW)
    _rq(db, ch, 4, correct=None)
    qs = svc.start_check(db, 1, ch.id, random.Random(1))
    assert len(qs) == svc.RETENTION_QUESTIONS == 10
    assert {q.id for q in qs} <= {q.id for q in good}
    assert svc.get_progress(db, 1, ch.id).question_ids == [q.id for q in qs]


def test_draw_prefers_explained_and_mixes_types(db):
    ch = _chapter(db, _book(db), 1)
    _rq(db, ch, 12, quality="missing")
    ok_f = _rq(db, ch, 6, quality="ok", qtype="FACTUAL")
    ok_s = _rq(db, ch, 6, quality="ok", qtype="STATEMENT_BASED")
    qs = svc.start_check(db, 1, ch.id, random.Random(2))
    assert {q.id for q in qs} <= {q.id for q in ok_f + ok_s}  # 12 explained ones beat the unexplained
    kinds = [q.question_type for q in qs]
    assert kinds.count("FACTUAL") == 5 and kinds.count("STATEMENT_BASED") == 5  # evenly mixed
    # Still enough questions when explained ones run out.
    ch2 = _chapter(db, db.query(GsLmsBook).one(), 2)
    _rq(db, ch2, 3, quality="ok")
    _rq(db, ch2, 9, quality="short")
    assert len(svc.start_check(db, 1, ch2.id)) == 10


def _answers(db, qs, correct_n):
    return [(q.id, "A" if i < correct_n else "B") for i, q in enumerate(qs)]


def test_next_draw_avoids_previous_questions_when_enough_exist(db):
    ch = _chapter(db, _book(db), 1)
    _rq(db, ch, 25)
    first = svc.start_check(db, 1, ch.id, random.Random(3))
    # restarting before submitting also avoids the unsubmitted draw
    again = svc.start_check(db, 1, ch.id, random.Random(4))
    assert not {q.id for q in first} & {q.id for q in again}
    svc.submit_check(db, 1, ch.id, _answers(db, again, 10))
    third = svc.start_check(db, 1, ch.id, random.Random(5))
    assert not {q.id for q in again} & {q.id for q in third}


def test_next_draw_tops_up_with_repeats_when_few_exist(db):
    ch = _chapter(db, _book(db), 1)
    _rq(db, ch, 12)
    first = svc.start_check(db, 1, ch.id, random.Random(6))
    svc.submit_check(db, 1, ch.id, _answers(db, first, 5))
    second = svc.start_check(db, 1, ch.id, random.Random(7))
    assert len(second) == 10
    fresh = {q.id for q in db.query(GsLmsRetentionQuestion).all()} - {q.id for q in first}
    assert fresh <= {q.id for q in second}  # every unseen question is used first


def test_submit_integrity(db):
    ch = _chapter(db, _book(db), 1)
    _rq(db, ch, 12)
    with pytest.raises(svc.RetentionError) as e:  # nothing started
        svc.submit_check(db, 1, ch.id, [(1, "A")])
    assert e.value.status_code == 409
    qs = svc.start_check(db, 1, ch.id)
    good = _answers(db, qs, 10)
    for bad in (good[:-1], good + [(99999, "A")], good[:-1] + [(good[0][0], "A")],
                good[:-1] + [(max(q.id for q in db.query(GsLmsRetentionQuestion).all()) + 1, "A")]):
        with pytest.raises(svc.RetentionError) as e:
            svc.submit_check(db, 1, ch.id, bad)
        assert e.value.status_code == 422
    assert svc.get_progress(db, 1, ch.id).checks_taken == 0  # nothing changed
    called = []
    svc.submit_check(db, 1, ch.id, good, on_validated=lambda: called.append(1))
    assert called == [1]
    with pytest.raises(svc.RetentionError) as e:  # one submission per start
        svc.submit_check(db, 1, ch.id, good)
    assert e.value.status_code == 409


def test_submit_409_when_a_question_was_pulled_after_start(db):
    ch = _chapter(db, _book(db), 1)
    rows = _rq(db, ch, 10)
    qs = svc.start_check(db, 1, ch.id)
    rows[0].review_status = R.UNREVIEWED
    db.flush()
    with pytest.raises(svc.RetentionError) as e:
        svc.submit_check(db, 1, ch.id, _answers(db, qs, 10))
    assert e.value.status_code == 409


def test_scoring_and_progress_update(db):
    ch = _chapter(db, _book(db), 1)
    _rq(db, ch, 10)
    qs = svc.start_check(db, 1, ch.id)
    res = svc.submit_check(db, 1, ch.id, _answers(db, qs, 7))
    assert (res.total, res.correct, res.score, res.passed) == (10, 7, 0.7, True)
    assert all(a.correct_option == "A" and a.explanation == "because" for a in res.attempts)
    assert sum(a.is_correct for a in res.attempts) == 7
    p = svc.get_progress(db, 1, ch.id)
    assert (p.best_score, p.last_score, p.checks_taken) == (0.7, 0.7, 1)
    assert p.status == CS.COMPLETED and p.completed_at and p.last_check_at and p.next_review_at
    assert p.question_ids is None

    qs = svc.start_check(db, 1, ch.id)
    res = svc.submit_check(db, 1, ch.id, _answers(db, qs, 4))
    assert res.passed is False
    p = svc.get_progress(db, 1, ch.id)
    assert (p.best_score, p.last_score, p.checks_taken) == (0.7, 0.4, 2)  # best kept
    # lowercase / padded answers are accepted
    qs = svc.start_check(db, 1, ch.id)
    res = svc.submit_check(db, 1, ch.id, [(q.id, " a ") for q in qs])
    assert res.score == 1.0


def test_status_completed_not_overwritten_and_other_students_isolated(db):
    ch = _chapter(db, _book(db), 1)
    _rq(db, ch, 10)
    svc.set_status(db, 1, ch.id, CS.COMPLETED)
    done_at = svc.get_progress(db, 1, ch.id).completed_at
    qs = svc.start_check(db, 1, ch.id)
    svc.submit_check(db, 1, ch.id, _answers(db, qs, 10))
    assert svc.get_progress(db, 1, ch.id).completed_at == done_at
    assert svc.get_progress(db, 2, ch.id) is None


def test_weak_scores_are_reviewed_sooner_than_strong_ones():
    weak = svc.next_interval_days(0.3, None, None, None)
    mid = svc.next_interval_days(0.6, None, None, None)
    strong = svc.next_interval_days(1.0, None, None, None)
    assert weak <= 3 and 5 <= strong <= 7
    assert weak <= mid <= 3  # below the pass mark stays short (0.6 would give 5 days otherwise)
    # Later checks follow the spaced-repetition rules, but a weak score stays short.
    last = datetime(2026, 1, 1)
    nxt = last + timedelta(days=30)
    assert svc.next_interval_days(0.9, 0.8, last, nxt) == 45  # improved: +50%
    assert svc.next_interval_days(0.5, 0.2, last, nxt) <= 3   # improved but still weak
    assert svc.next_interval_days(0.9, 0.9, last, nxt) == 15  # not improved: halved


def test_scheduled_review_gap_differs_by_score(db):
    book = _book(db)
    c1, c2 = _chapter(db, book, 1), _chapter(db, book, 2)
    _rq(db, c1, 10)
    _rq(db, c2, 10)
    r1 = svc.submit_check(db, 1, c1.id, _answers(db, svc.start_check(db, 1, c1.id), 10))
    r2 = svc.submit_check(db, 1, c2.id, _answers(db, svc.start_check(db, 1, c2.id), 2))
    assert r2.next_review_in_days < r1.next_review_in_days
    assert r2.next_review_at < r1.next_review_at


def test_due_reviews(db):
    book = _book(db)
    c1, c2, c3 = _chapter(db, book, 1), _chapter(db, book, 2), None
    now = datetime(2026, 6, 1, 12, 0)
    for ch, delta in ((c1, -1), (c2, +3)):
        db.add(GsLmsChapterProgress(student_id=1, chapter_id=ch.id, status=CS.COMPLETED,
                                    next_review_at=now + timedelta(days=delta)))
    db.add(GsLmsChapterProgress(student_id=2, chapter_id=c1.id, status=CS.COMPLETED,
                                next_review_at=now - timedelta(days=5)))
    db.flush()
    due = svc.due_reviews(db, 1, now)
    assert [(ch.id, b.slug) for _p, ch, b in due] == [(c1.id, "lax-7e")]
    assert len(svc.due_reviews(db, 1, now + timedelta(days=4))) == 2


def test_set_status_transitions(db):
    ch = _chapter(db, _book(db), 1)
    with pytest.raises(svc.RetentionError) as e:
        svc.set_status(db, 1, 999, CS.READING)
    assert e.value.status_code == 404
    p = svc.set_status(db, 1, ch.id, CS.READING)
    assert p.status == CS.READING and p.completed_at is None
    p = svc.set_status(db, 1, ch.id, CS.COMPLETED)
    assert p.completed_at is not None
    p = svc.set_status(db, 1, ch.id, CS.NOT_STARTED)
    assert p.status == CS.NOT_STARTED and p.completed_at is None and p.next_review_at is None


# ---------------------------------------------------------------------------
# API
# ---------------------------------------------------------------------------

def _seed_api(session_factory, n=12):
    with session_factory() as db:
        book = _book(db)
        ch1, ch2 = _chapter(db, book, 1), _chapter(db, book, 2)
        _rq(db, ch1, n)
        _rq(db, ch1, 3, status=R.UNREVIEWED)
        _rq(db, ch1, 2, correct=None)
        _rq(db, ch2, 1)
        db.commit()
        return book.id, ch1.id, ch2.id


def test_all_routes_require_login(session_factory):
    app_ = FastAPI()
    app_.include_router(gs_lms_router, prefix="/api/v1/gs-lms")
    app_.dependency_overrides[get_db] = lambda: iter([session_factory()])
    c = TestClient(app_)
    for method, url, body in [
        ("get", f"{BOOKS}/1/progress", None),
        ("put", f"{BOOKS}/chapters/1/status", {"status": "READING"}),
        ("post", f"{BOOKS}/chapters/1/retention/start", None),
        ("post", f"{BOOKS}/chapters/1/retention/submit", {"answers": []}),
        ("get", f"{BOOKS}/reviews/due", None),
    ]:
        r = getattr(c, method)(url, json=body) if body is not None else getattr(c, method)(url)
        assert r.status_code in (401, 403), (method, url, r.status_code)


def test_progress_endpoint_counts_only_reviewed_answerable(client, session_factory):
    book_id, ch1, ch2 = _seed_api(session_factory)
    r = client.get(f"{BOOKS}/{book_id}/progress")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["slug"] == "lax-7e"
    by = {c["number"]: c for c in data["chapters"]}
    assert by[1]["question_count"] == 12 and by[2]["question_count"] == 1
    assert by[1]["chapter_id"] == ch1 and by[1]["status"] == "NOT_STARTED"
    assert by[1]["best_score"] is None and by[1]["checks_taken"] == 0 and by[1]["next_review_at"] is None
    assert client.get(f"{BOOKS}/9999/progress").status_code == 404
    # /books/reviews/due is not swallowed by the {book_id} route
    assert client.get(f"{BOOKS}/reviews/due").json()["data"] == []


def test_status_endpoint(client, session_factory):
    book_id, ch1, _ = _seed_api(session_factory)
    r = client.put(f"{BOOKS}/chapters/{ch1}/status", json={"status": "READING"})
    assert r.status_code == 200 and r.json()["data"]["status"] == "READING"
    assert client.put(f"{BOOKS}/chapters/{ch1}/status", json={"status": "NOPE"}).status_code == 422
    assert client.put(f"{BOOKS}/chapters/9999/status", json={"status": "READING"}).status_code == 404
    client.put(f"{BOOKS}/chapters/{ch1}/status", json={"status": "COMPLETED"})
    ch = {c["number"]: c for c in client.get(f"{BOOKS}/{book_id}/progress").json()["data"]["chapters"]}[1]
    assert ch["status"] == "COMPLETED"


def _start(client, ch):
    r = client.post(f"{BOOKS}/chapters/{ch}/retention/start")
    assert r.status_code == 200, r.text
    return r.json()["data"]


def test_start_hides_answers_and_unreviewed_questions(client, session_factory):
    _, ch1, ch2 = _seed_api(session_factory)
    d = _start(client, ch1)
    assert d["total_questions"] == 10 and d["pass_score"] == 70.0
    assert all(set(q) == {"question_id", "question_type", "question_text", "options", "display_order"}
               for q in d["questions"])
    assert "correct_option" not in json.dumps(d) and "because" not in json.dumps(d)
    with session_factory() as db:
        shown = {q.id: q for q in db.query(GsLmsRetentionQuestion).all()}
        assert all(shown[q["question_id"]].review_status == R.REVIEWED
                   and shown[q["question_id"]].correct_option for q in d["questions"])
    assert client.post(f"{BOOKS}/chapters/{ch2}/retention/start").status_code == 409  # only 1 question
    assert client.post(f"{BOOKS}/chapters/9999/retention/start").status_code == 404


def test_submit_flow_and_quota(client, session_factory, monkeypatch):
    book_id, ch1, _ = _seed_api(session_factory)
    charged = []
    import app.api.v1.gs_lms.retention as api_mod
    monkeypatch.setattr(api_mod, "consume_mcq_quota", lambda db, user, n: charged.append(n))

    url = f"{BOOKS}/chapters/{ch1}/retention/submit"
    assert client.post(url, json={"answers": []}).status_code == 409  # not started
    d = _start(client, ch1)
    ids = [q["question_id"] for q in d["questions"]]
    short = [{"question_id": i, "selected_option": "A"} for i in ids[:-1]]
    assert client.post(url, json={"answers": short}).status_code == 422
    assert charged == []  # rejected submits are free

    answers = [{"question_id": i, "selected_option": "A" if k < 8 else "B"} for k, i in enumerate(ids)]
    r = client.post(url, json={"answers": answers})
    assert r.status_code == 200, r.text
    res = r.json()["data"]
    assert charged == [10]
    assert (res["correct_count"], res["score"], res["passed"], res["status"]) == (8, 80.0, True, "COMPLETED")
    assert res["checks_taken"] == 1 and res["best_score"] == 80.0
    assert all(a["correct_option"] == "A" and a["explanation"] == "because" for a in res["attempts"])
    assert res["next_review_in_days"] >= 5
    assert client.post(url, json={"answers": answers}).status_code == 409  # one submission per start

    ch = {c["number"]: c for c in client.get(f"{BOOKS}/{book_id}/progress").json()["data"]["chapters"]}[1]
    assert ch["best_score"] == 80.0 and ch["last_score"] == 80.0 and ch["checks_taken"] == 1
    assert ch["status"] == "COMPLETED" and ch["next_review_at"]


def test_quota_exhausted_blocks_submit_and_keeps_check_open(client, session_factory, monkeypatch):
    _, ch1, _ = _seed_api(session_factory)
    from fastapi import HTTPException
    import app.api.v1.gs_lms.retention as api_mod

    def deny(db, user, n):
        raise HTTPException(status_code=402, detail="limit")

    monkeypatch.setattr(api_mod, "consume_mcq_quota", deny)
    d = _start(client, ch1)
    answers = [{"question_id": q["question_id"], "selected_option": "A"} for q in d["questions"]]
    url = f"{BOOKS}/chapters/{ch1}/retention/submit"
    assert client.post(url, json={"answers": answers}).status_code == 402
    monkeypatch.setattr(api_mod, "consume_mcq_quota", lambda *a: None)
    assert client.post(url, json={"answers": answers}).status_code == 200  # same check still valid


def test_due_reviews_endpoint(client, session_factory, who):
    book_id, ch1, _ = _seed_api(session_factory)
    with session_factory() as db:
        db.add(GsLmsChapterProgress(student_id=1, chapter_id=ch1, status=CS.COMPLETED, last_score=0.5,
                                    next_review_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=1)))
        db.add(GsLmsChapterProgress(student_id=2, chapter_id=ch1, status=CS.COMPLETED,
                                    next_review_at=datetime(2020, 1, 1)))
        db.commit()
    rows = client.get(f"{BOOKS}/reviews/due").json()["data"]
    assert len(rows) == 1
    assert rows[0]["chapter_id"] == ch1 and rows[0]["book_title"] == "Indian Polity" and rows[0]["last_score"] == 50.0
    who["user"] = OTHER
    assert [r["chapter_id"] for r in client.get(f"{BOOKS}/reviews/due").json()["data"]] == [ch1]
    who["user"] = _Who(3, RoleEnum.STUDENT, "none@test.local")
    assert client.get(f"{BOOKS}/reviews/due").json()["data"] == []


def test_existing_books_route_still_works(client, session_factory):
    _seed_api(session_factory)
    r = client.get(f"{BOOKS}")
    assert r.status_code == 200 and r.json()["data"][0]["slug"] == "lax-7e"


# ---------------------------------------------------------------------------
# Migration
# ---------------------------------------------------------------------------

def _load_migration():
    spec = importlib.util.spec_from_file_location("mig_l9f0", MIGRATION_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_migration_up_down_on_sqlite():
    mig = _load_migration()
    assert mig.down_revision == "k8e9f0a1b2c3"
    engine = create_engine("sqlite:///:memory:", future=True, poolclass=StaticPool)
    wanted = {"users", "gs_lms_books", "gs_lms_book_chapters"}
    Base.metadata.create_all(engine, tables=[t for n, t in Base.metadata.tables.items() if n in wanted])
    new = {"gs_lms_retention_questions", "gs_lms_chapter_progress"}
    with engine.begin() as conn:
        with Operations.context(MigrationContext.configure(conn)):
            mig.upgrade()
            insp = sa.inspect(conn)
            assert new <= set(insp.get_table_names())
            assert ("student_id", "chapter_id") in {
                tuple(u["column_names"]) for u in insp.get_unique_constraints("gs_lms_chapter_progress")}
            assert {c["name"] for c in insp.get_columns("gs_lms_retention_questions")} >= {
                "external_id", "subject_slug", "options", "correct_option", "explanation_quality",
                "answer_status", "question_type", "difficulty", "is_pyq", "pyq_year", "source_book",
                "source_chapter", "book_chapter_id", "review_status", "created_at", "updated_by"}
            indexed = {c for i in insp.get_indexes("gs_lms_chapter_progress") for c in i["column_names"]}
            assert "next_review_at" in indexed
            mig.upgrade()  # idempotent
            mig.downgrade()
            assert not new & set(sa.inspect(conn).get_table_names())


def test_migration_matches_models():
    """The migration creates every column the models declare."""
    mig = _load_migration()
    engine = create_engine("sqlite:///:memory:", future=True, poolclass=StaticPool)
    wanted = {"users", "gs_lms_books", "gs_lms_book_chapters"}
    Base.metadata.create_all(engine, tables=[t for n, t in Base.metadata.tables.items() if n in wanted])
    with engine.begin() as conn:
        with Operations.context(MigrationContext.configure(conn)):
            mig.upgrade()
            insp = sa.inspect(conn)
            for table in ("gs_lms_retention_questions", "gs_lms_chapter_progress"):
                have = {c["name"] for c in insp.get_columns(table)}
                assert {c.name for c in Base.metadata.tables[table].columns} == have


def test_migration_is_the_single_alembic_head():
    from alembic.config import Config
    from alembic.script import ScriptDirectory

    root = Path(__file__).resolve().parents[2]
    cfg = Config(str(root / "alembic.ini"))
    cfg.set_main_option("script_location", str(root / "alembic"))
    assert ScriptDirectory.from_config(cfg).get_heads() == ["p3d4e5f6a7b8"]
