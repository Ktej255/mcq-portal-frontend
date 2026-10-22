"""Single-page study flow: search, content requests, study card, explain,
next, admin triage, route order and migration."""

from __future__ import annotations

import importlib.util
from pathlib import Path

import pytest
import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.main  # noqa: F401  (registers every model on Base.metadata)
from app.api.dependencies import ai_rate_limit, get_current_user
from app.api.v1.admin import router as admin_router
from app.api.v1.gs_lms import router as gs_lms_router
from app.core.config import settings
from app.core.gs.models import GsReviewStatusEnum as RS, GsSubject
from app.core.gs_lms import study_search
from app.core.gs_lms.content_requests import normalize_query, record_content_request
from app.core.gs_lms.funnel_models import GsLmsCheckpoint, GsLmsFunnelProgress, GsLmsMcqLabSession
from app.core.gs_lms.models import (
    GsLmsBook, GsLmsBookChapter, GsLmsConcept, GsLmsConceptBookRef, GsLmsConceptVersion,
    GsLmsContentRequest, GsLmsContentRequestStudent, GsLmsContentSection, GsLmsNodeTypeEnum as NT,
    GsLmsSectionLabelEnum, GsLmsSyllabusNode, GsLmsVersionLevelEnum as L,
    GsLmsVersionSourceEnum as S, GsLmsVersionStyleEnum as St,
)
from app.core.gs_lms.student_models import GsLmsConceptMastery
from app.db.session import Base, get_db
from app.models.domain import RoleEnum, User

STUDY = "/api/v1/gs-lms/study"
MIGRATION_PATH = (
    Path(__file__).resolve().parents[2] / "alembic" / "versions" / "k8e9f0a1b2c3_add_gs_lms_content_requests.py"
)


class _Who:
    def __init__(self, id, role, email):
        self.id, self.role, self.email = id, role, email


STUDENT = _Who(1, RoleEnum.STUDENT, "s@test.local")
STUDENT2 = _Who(3, RoleEnum.STUDENT, "s2@test.local")
ADMIN = _Who(2, RoleEnum.ADMIN, "a@test.local")


@pytest.fixture(autouse=True)
def progression_off(monkeypatch):
    monkeypatch.setattr(settings, "GS_LMS_ENFORCE_PROGRESSION", False)
    monkeypatch.setattr(settings, "GS_LMS_PROGRESSION_START", None)


@pytest.fixture()
def session_factory():
    engine = create_engine(
        "sqlite:///:memory:", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    with SessionLocal() as db:
        db.add(GsSubject(id=1, slug="history", name="History", display_order=1))
        db.add(GsSubject(id=2, slug="polity-governance", name="Polity", display_order=2))
        for i, (email, role) in enumerate(
            [("s@test.local", RoleEnum.STUDENT), ("a@test.local", RoleEnum.ADMIN), ("s2@test.local", RoleEnum.STUDENT)], 1
        ):
            db.add(User(id=i, email=email, full_name=f"U{i}", role=role, google_uid=f"g{i}"))
        db.commit()
    return SessionLocal


@pytest.fixture()
def db(session_factory):
    with session_factory() as s:
        yield s


@pytest.fixture()
def who():
    return {"user": STUDENT}


def _make_client(session_factory, who, routers):
    app_ = FastAPI()
    for r, prefix in routers:
        app_.include_router(r, prefix=prefix)

    def _db():
        s = session_factory()
        try:
            yield s
        finally:
            s.close()

    app_.dependency_overrides[get_db] = _db
    app_.dependency_overrides[get_current_user] = lambda: who["user"]
    app_.dependency_overrides[ai_rate_limit] = lambda: None
    return TestClient(app_)


@pytest.fixture()
def client(session_factory, who):
    return _make_client(session_factory, who, [(gs_lms_router, "/api/v1/gs-lms")])


@pytest.fixture()
def admin_client(session_factory, who):
    return _make_client(session_factory, who, [(admin_router, "/api/v1/admin")])


# ---------------------------------------------------------------------------
# Content helpers
# ---------------------------------------------------------------------------

def _node(db, subject_id, title, node_type, parent=None, order=0, status=RS.REVIEWED):
    n = GsLmsSyllabusNode(
        subject_id=subject_id, title=title, node_type=node_type, parent_id=parent.id if parent else None,
        display_order=order, review_status=status,
    )
    db.add(n)
    db.flush()
    return n


def _leaf(db, subject_id, mega, sub, title, order=0, status=RS.REVIEWED, content=True):
    m = _node(db, subject_id, mega, NT.MEGA_TOPIC)
    s = _node(db, subject_id, sub, NT.SUB_TOPIC, m)
    leaf = _node(db, subject_id, title, NT.LEAF_TOPIC, s, order, status)
    if content:
        _content(db, leaf)
    return leaf


def _content(db, leaf):
    db.add(GsLmsContentSection(
        syllabus_node_id=leaf.id, section_label=GsLmsSectionLabelEnum.BASIC, title="BASIC",
        blocks=[{"type": "text", "content": "x"}], display_order=0, review_status=RS.REVIEWED, authored=True,
    ))


def _concept(db, leaf, title, kps, order=0, status=RS.REVIEWED):
    c = GsLmsConcept(
        syllabus_node_id=leaf.id, title=title, key_points=kps, display_order=order, review_status=status
    )
    db.add(c)
    db.flush()
    return c


def _version(db, concept, level=L.STANDARD, style=St.TEXT, source=S.ORIGINAL, status=RS.REVIEWED, title=None):
    v = GsLmsConceptVersion(
        concept_id=concept.id, level=level, style=style, source=source, title=title or f"{level.value} v",
        blocks=[{"type": "text", "content": "body"}], review_status=status,
    )
    db.add(v)
    db.flush()
    return v


@pytest.fixture()
def world(db):
    """History: Plassey (2 concepts) and Buxar. Polity: Preamble (2 concepts)."""
    plassey = _leaf(db, 1, "Modern India", "British Conquest", "Battle of Plassey", 1)
    causes = _concept(db, plassey, "Causes of the battle", [
        "Siraj-ud-Daulah clashed with the East India Company", "Fort William captured in 1756"], 1)
    outcome = _concept(db, plassey, "Outcome of Plassey 1757", [
        "Clive won after Mir Jafar betrayed the Nawab", "Company gained control of Bengal in 1757"], 2)
    buxar = _node(db, 1, "Battle of Buxar", NT.LEAF_TOPIC, db.get(GsLmsSyllabusNode, plassey.parent_id), 2)
    _content(db, buxar)
    bx = _concept(db, buxar, "Buxar outcome", ["Mir Qasim defeated in 1764", "Treaty of Allahabad followed"], 1)
    pre = _leaf(db, 2, "Constitution", "Features", "Preamble", 1)
    meaning = _concept(db, pre, "Meaning of Preamble", ["Introduction to the Constitution", "Declares India sovereign"], 1)
    ideals = _concept(db, pre, "Ideals", ["Justice liberty equality fraternity", "Secular socialist"], 2)
    db.commit()
    return dict(plassey=plassey, causes=causes, outcome=outcome, buxar=buxar, bx=bx, pre=pre,
                meaning=meaning, ideals=ideals)


def _search(client, q, **params):
    r = client.get(f"{STUDY}/search", params={"q": q, **params})
    assert r.status_code == 200, r.text
    return r.json()["data"]


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------

def test_concept_title_hit_ranks_first(client, world):
    hits = _search(client, "causes of the battle")
    assert hits[0]["kind"] == "concept" and hits[0]["concept_id"] == world["causes"].id
    assert hits[0]["breadcrumb"] == ["Modern India", "British Conquest", "Battle of Plassey"]
    assert hits[0]["subject_slug"] == "history" and hits[0]["subject_name"] == "History"
    assert hits[0]["score"] >= 0.7 and "causes" in hits[0]["matched_terms"]


def test_leaf_title_gives_topic_hit_and_concept_hits(client, world):
    hits = _search(client, "Preamble")
    kinds = {(h["kind"], h["concept_id"]) for h in hits}
    assert ("topic", None) in kinds
    topic = next(h for h in hits if h["kind"] == "topic")
    assert topic["leaf_id"] == world["pre"].id and topic["start_concept_id"] == world["meaning"].id
    # only the concept whose own text mentions it is a concept hit
    concept_ids = {h["concept_id"] for h in hits if h["kind"] == "concept"}
    assert concept_ids == {world["meaning"].id}


def test_concept_title_outweighs_key_points(client, db, world):
    # "fraternity" only in key points of Ideals; add a concept with it in the title
    other = _concept(db, world["pre"], "Fraternity explained", ["Brotherhood"], 3)
    db.commit()
    hits = _search(client, "fraternity")
    assert hits[0]["concept_id"] == other.id
    ids = [h["concept_id"] for h in hits if h["kind"] == "concept"]
    assert ids.index(other.id) < ids.index(world["ideals"].id)
    assert hits[0]["score"] > next(h for h in hits if h["concept_id"] == world["ideals"].id)["score"]


def test_key_points_alone_can_match(client, world):
    hits = _search(client, "Mir Jafar betrayed")
    assert hits and hits[0]["concept_id"] == world["outcome"].id


def test_year_must_match_exactly(client, world):
    hits = _search(client, "1757")
    assert {h["concept_id"] for h in hits if h["kind"] == "concept"} == {world["outcome"].id}
    assert _search(client, "battle 1857") == []
    # Buxar shares "battle" but lacks 1757
    ids = {h["leaf_id"] for h in _search(client, "battle 1757")}
    assert world["buxar"].id not in ids


def test_year_in_query_does_not_match_other_year(client, world):
    hits = _search(client, "Plassey 1764")
    assert all(h["leaf_id"] != world["plassey"].id for h in hits)


def test_min_score(client, world):
    # one of four words matching a title only: 3/12 = 0.25
    assert _search(client, "causes zebra giraffe tundra") == []
    assert study_search.SEARCH_MIN_SCORE == 0.5 and study_search.SEARCH_GOOD_SCORE == 0.7


def test_ancestor_and_chapter_weights(client, db, world):
    hits = _search(client, "british conquest")
    # ancestor title is weight 1: 1/3 < 0.5, so no hit on its own
    assert hits == []
    book = GsLmsBook(slug="b", title="Spectrum", author="a", edition="1")
    db.add(book)
    db.flush()
    ch = GsLmsBookChapter(book_id=book.id, number=1, title="Carnatic Wars")
    db.add(ch)
    db.flush()
    db.add(GsLmsConceptBookRef(concept_id=world["causes"].id, chapter_id=ch.id))
    db.commit()
    assert _search(client, "carnatic wars") == []  # weight 1 only
    # but chapter + title words reach the threshold together
    hits = _search(client, "carnatic causes")
    assert hits and hits[0]["leaf_id"] == world["plassey"].id


def test_only_reviewed_content(client, db, world):
    hidden_leaf = _leaf(db, 1, "Hidden Mega", "Hidden Sub", "Zanzibar Treaty", 5, status=RS.UNREVIEWED)
    _concept(db, hidden_leaf, "Zanzibar terms", ["Zanzibar sultan"], 1)
    rev_leaf = _leaf(db, 1, "Mega R", "Sub R", "Quokka Studies", 6)
    _concept(db, rev_leaf, "Quokka draft", ["Quokka facts"], 1, status=RS.UNREVIEWED)
    _concept(db, rev_leaf, "Quokka final", ["Quokka facts"], 2)
    unrev_parent = _leaf(db, 1, "Mega U", "Sub U", "Narwhal Studies", 7)
    db.get(GsLmsSyllabusNode, unrev_parent.parent_id).review_status = RS.UNREVIEWED
    _concept(db, unrev_parent, "Narwhal basics", ["Narwhal tusk"], 1)
    db.commit()
    assert _search(client, "zanzibar") == []
    assert _search(client, "narwhal") == []
    titles = {h["concept_title"] for h in _search(client, "quokka") if h["kind"] == "concept"}
    assert titles == {"Quokka final"}


def test_subject_filter(client, world):
    assert _search(client, "outcome")  # across subjects
    assert _search(client, "outcome", subject="polity-governance") == []
    hits = _search(client, "outcome", subject="history")
    assert {h["subject_slug"] for h in hits} == {"history"}
    assert client.get(f"{STUDY}/search", params={"q": "x", "subject": "nope"}).status_code == 404


def test_ties_sort_by_subject_then_node_order(client, db, world):
    a = _leaf(db, 2, "Mega T", "Sub T", "Tiebreak alpha", 9)
    _concept(db, a, "Gamma ray", ["x1"], 1)
    b = _leaf(db, 1, "Mega T2", "Sub T2", "Tiebreak beta", 9)
    _concept(db, b, "Gamma ray", ["x2"], 1)
    db.commit()
    hits = [h for h in _search(client, "gamma ray") if h["kind"] == "concept"]
    assert [h["subject_slug"] for h in hits] == ["history", "polity-governance"]


def test_query_validation_and_login(client, who):
    assert client.get(f"{STUDY}/search", params={"q": "a" * 201}).status_code == 422
    assert client.get(f"{STUDY}/search", params={"q": "a" * 200}).status_code == 200
    assert client.get(f"{STUDY}/search").status_code == 422
    app_ = FastAPI()
    app_.include_router(gs_lms_router, prefix="/api/v1/gs-lms")
    assert TestClient(app_).get(f"{STUDY}/search", params={"q": "x"}).status_code in (401, 403)


def test_limit_in_core(db, world):
    hits = study_search.search(db, "outcome", limit=1)
    assert len(hits) == 1
    assert study_search.search(db, "the of and") == []


# ---------------------------------------------------------------------------
# Content requests
# ---------------------------------------------------------------------------

def test_normalisation():
    assert normalize_query("Plassey battle") == normalize_query("  battle of PLASSEY!! ")
    assert normalize_query("the of") == ""


def test_no_hit_logs_request(client, db, world):
    assert _search(client, "Treaty of Versailles") == []
    row = db.query(GsLmsContentRequest).one()
    assert row.normalized_query == normalize_query("Treaty of Versailles")
    assert row.sample_query == "Treaty of Versailles" and row.request_count == 1 and row.distinct_students == 1
    assert row.status.value == "OPEN"


def test_same_normalised_query_counts_once_and_distinct_students(client, db, world, who):
    _search(client, "Mughal Akbar policy", subject="history")
    _search(client, "policy of Akbar Mughal")
    who["user"] = STUDENT2
    _search(client, "Akbar mughal policy")
    db.expire_all()
    row = db.query(GsLmsContentRequest).one()
    assert row.request_count == 3 and row.distinct_students == 2
    assert row.sample_query == "Akbar mughal policy" and row.subject_slug == "history"
    assert db.query(GsLmsContentRequestStudent).count() == 2


def test_sample_trimmed_to_200(db):
    row = record_content_request(db, 1, "word " * 60)
    assert len(row.sample_query) <= 200


def test_weak_hit_is_logged_good_hit_is_not(client, db, world):
    _search(client, "causes of the battle")  # good
    assert db.query(GsLmsContentRequest).count() == 0
    # key points only: 2/3 = 0.67 -> hit but weak
    hits = _search(client, "Mir Jafar betrayed")
    assert hits and hits[0]["score"] < study_search.SEARCH_GOOD_SCORE
    assert db.query(GsLmsContentRequest).count() == 1


def test_stopword_only_query_not_logged(client, db, world):
    assert _search(client, "of the") == []
    assert db.query(GsLmsContentRequest).count() == 0


# ---------------------------------------------------------------------------
# Study card
# ---------------------------------------------------------------------------

def test_card_shape_no_key_points(client, db, world):
    v = _version(db, world["causes"])
    _version(db, world["causes"], L.BASIC, title="easy")
    db.commit()
    r = client.get(f"{STUDY}/concepts/{world['causes'].id}")
    assert r.status_code == 200, r.text
    d = r.json()["data"]
    assert d["version"]["id"] == v.id and d["version"]["blocks"]
    assert [a["level"] for a in d["alternatives"]] == ["BASIC"]
    assert d["key_points_count"] == 2
    assert "key_points" not in d and "Siraj" not in r.text and "1756" not in r.text
    assert d["mastery"] == {"status": "NOT_STARTED", "best_score": 0.0, "last_score": None, "attempts": 0, "passed": False}
    assert d["position"] == 1 and d["total_concepts"] == 2 and d["next"] is None
    assert d["breadcrumb"][-1] == "Battle of Plassey" and d["subject_slug"] == "history"


def test_card_without_version_and_unreviewed_404(client, db, world):
    assert client.get(f"{STUDY}/concepts/{world['causes'].id}").json()["data"]["version"] is None
    draft = _concept(db, world["plassey"], "Draft", ["a b c"], 9, status=RS.UNREVIEWED)
    db.commit()
    assert client.get(f"{STUDY}/concepts/{draft.id}").status_code == 404
    assert client.get(f"{STUDY}/concepts/99999").status_code == 404


def test_card_423_when_locked(client, db, world, monkeypatch):
    monkeypatch.setattr(settings, "GS_LMS_ENFORCE_PROGRESSION", True)
    monkeypatch.setattr(settings, "GS_LMS_ENFORCE_ORDER", True)
    r = client.get(f"{STUDY}/concepts/{world['bx'].id}")  # Buxar after unmastered Plassey
    assert r.status_code == 423
    assert client.get(f"{STUDY}/concepts/{world['causes'].id}").status_code == 200
    assert client.post(f"{STUDY}/concepts/{world['bx'].id}/explain", json={"text": "x" * 20}).status_code == 423


def test_admin_not_locked(client, db, world, monkeypatch, who):
    monkeypatch.setattr(settings, "GS_LMS_ENFORCE_PROGRESSION", True)
    monkeypatch.setattr(settings, "GS_LMS_ENFORCE_ORDER", True)
    who["user"] = ADMIN
    assert client.get(f"{STUDY}/concepts/{world['bx'].id}").status_code == 200


# ---------------------------------------------------------------------------
# Explain
# ---------------------------------------------------------------------------

GOOD = ("Siraj-ud-Daulah clashed with the East India Company and Fort William was "
        "captured in 1756 by the Nawab")


def _explain(client, cid, text):
    r = client.post(f"{STUDY}/concepts/{cid}/explain", json={"text": text})
    assert r.status_code == 200, r.text
    return r.json()["data"]


def test_explain_pass_records_mastery_and_points_next(client, db, world):
    d = _explain(client, world["causes"].id, GOOD)
    assert d["score"] == 1.0 and d["passed"] and d["missed_points"] == [] and len(d["covered_points"]) == 2
    assert d["status"] == "PASSED" and d["attempts"] == 1 and d["suggested_version"] is None
    assert d["next"]["type"] == "concept" and d["next"]["concept_id"] == world["outcome"].id
    row = db.query(GsLmsConceptMastery).one()
    assert row.concept_id == world["causes"].id and row.score == 1.0
    card = client.get(f"{STUDY}/concepts/{world['causes'].id}").json()["data"]
    assert card["mastery"]["passed"] and card["next"]["concept_id"] == world["outcome"].id


def test_explain_fail_reveals_missed_and_suggests_basic_after_two(client, db, world):
    basic = _version(db, world["causes"], L.BASIC, title="easy")
    _version(db, world["causes"], L.STANDARD)
    db.commit()
    d = _explain(client, world["causes"].id, "The battle happened somewhere long ago I think")
    assert not d["passed"] and d["score"] == 0.0 and d["status"] == "LEARNING"
    assert len(d["missed_points"]) == 2 and "Fort William captured in 1756" in d["missed_points"]
    assert d["next"] is None
    assert d["suggested_version"] is None  # one attempt: still STANDARD per pick_version
    d = _explain(client, world["causes"].id, "I really do not remember anything about it")
    assert d["attempts"] == 2 and d["suggested_version"] == basic.id


def test_explain_partial_below_threshold(client, world):
    d = _explain(client, world["causes"].id, "Fort William captured in 1756 is what happened here")
    assert d["score"] == 0.5 and not d["passed"] and len(d["covered_points"]) == 1


def test_explain_text_length_validation(client, world):
    url = f"{STUDY}/concepts/{world['causes'].id}/explain"
    assert client.post(url, json={"text": "short"}).status_code == 422
    assert client.post(url, json={"text": "x" * 4001}).status_code == 422
    assert client.post(url, json={"text": "x" * 4000}).status_code == 200


def test_explain_last_concept_points_to_mcq_lab(client, db, world):
    _explain(client, world["causes"].id, GOOD)
    d = _explain(client, world["outcome"].id,
                 "Clive won after Mir Jafar betrayed the Nawab and the Company gained control of Bengal in 1757")
    assert d["passed"]
    assert d["next"]["type"] == "mcq_lab" and d["next"]["leaf_id"] == world["plassey"].id


def test_next_after_mastered_leaf_is_general_next(client, db, world):
    _explain(client, world["causes"].id, GOOD)
    _explain(client, world["outcome"].id,
             "Clive won after Mir Jafar betrayed the Nawab and the Company gained control of Bengal in 1757")
    db.add(GsLmsFunnelProgress(student_id=1, syllabus_node_id=world["plassey"].id, step_number=14, completed=True))
    db.commit()
    from app.core.gs_lms import progression as prog
    prog_ids = prog.mastered_topic_ids(db, 1, [world["plassey"].id])
    assert prog_ids == set()  # no MCQ score yet -> not mastered
    db.add(GsLmsMcqLabSession(student_id=1, syllabus_node_id=world["plassey"].id, score=0.9,
                              submitted_at=__import__("datetime").datetime(2026, 1, 1)))
    db.commit()
    card = client.get(f"{STUDY}/concepts/{world['outcome'].id}").json()["data"]
    assert card["next"]["type"] == "concept" and card["next"]["concept_id"] == world["bx"].id


# ---------------------------------------------------------------------------
# /study/next
# ---------------------------------------------------------------------------

def _next(client, **params):
    r = client.get(f"{STUDY}/next", params=params)
    assert r.status_code == 200, r.text
    return r.json()["data"]


def test_next_first_concept_then_advances(client, db, world):
    n = _next(client)
    assert n["type"] == "concept" and n["concept_id"] == world["causes"].id and n["subject_slug"] == "history"
    assert n["leaf_id"] == world["plassey"].id and n["label"]
    _explain(client, world["causes"].id, GOOD)
    assert _next(client)["concept_id"] == world["outcome"].id


def test_next_mcq_lab_when_all_concepts_passed(client, db, world):
    _explain(client, world["causes"].id, GOOD)
    _explain(client, world["outcome"].id,
             "Clive won after Mir Jafar betrayed the Nawab and the Company gained control of Bengal in 1757")
    n = _next(client)
    assert n["type"] == "mcq_lab" and n["leaf_id"] == world["plassey"].id and n["concept_id"] is None


def test_next_subject_filter_and_unknown(client, world):
    assert _next(client, subject="polity-governance")["concept_id"] == world["meaning"].id
    assert client.get(f"{STUDY}/next", params={"subject": "nope"}).status_code == 404


def test_next_checkpoint_when_due_and_done(client, db, world, monkeypatch):
    monkeypatch.setattr(settings, "GS_LMS_ENFORCE_PROGRESSION", True)
    monkeypatch.setattr(settings, "GS_LMS_ENFORCE_ORDER", True)
    ids = [world["plassey"].id, world["buxar"].id]
    for nid in ids:
        db.add(GsLmsFunnelProgress(student_id=1, syllabus_node_id=nid, step_number=14, completed=True))
        db.add(GsLmsMcqLabSession(student_id=1, syllabus_node_id=nid, score=0.9,
                                  submitted_at=__import__("datetime").datetime(2026, 1, 1)))
    cp = GsLmsCheckpoint(student_id=1, subject_id=1, sub_topic_node_id=world["plassey"].parent_id,
                         leaf_ids=ids, status="DUE", attempts=0)
    db.add(cp)
    db.commit()
    n = _next(client, subject="history")
    assert n["type"] == "checkpoint" and n["checkpoint_id"] == cp.id
    cp.status = "PASSED"
    db.commit()
    assert _next(client, subject="history")["type"] == "done"


def test_next_skips_to_next_subject_and_done_when_empty(client, db, world):
    for nid in (world["plassey"].id, world["buxar"].id):
        db.add(GsLmsFunnelProgress(student_id=1, syllabus_node_id=nid, step_number=14, completed=True))
        db.add(GsLmsMcqLabSession(student_id=1, syllabus_node_id=nid, score=0.9,
                                  submitted_at=__import__("datetime").datetime(2026, 1, 1)))
    db.commit()
    n = _next(client)
    assert n["subject_slug"] == "polity-governance" and n["concept_id"] == world["meaning"].id


def test_next_nothing_to_study(client):
    assert _next(client)["type"] == "done"


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------

def test_admin_list_sorted_and_filtered(admin_client, db, who):
    record_content_request(db, 1, "alpha topic")
    record_content_request(db, 1, "beta topic")
    record_content_request(db, 3, "beta topic")
    record_content_request(db, 1, "gamma topic")
    record_content_request(db, 1, "gamma topic")
    db.commit()
    who["user"] = ADMIN
    r = admin_client.get("/api/v1/admin/gs-lms/content-requests")
    assert r.status_code == 200
    rows = r.json()["data"]
    assert [x["sample_query"] for x in rows] == ["beta topic", "gamma topic", "alpha topic"]
    assert rows[0]["distinct_students"] == 2
    assert len(admin_client.get("/api/v1/admin/gs-lms/content-requests?limit=1").json()["data"]) == 1
    assert admin_client.get("/api/v1/admin/gs-lms/content-requests?status=PLANNED").json()["data"] == []
    assert admin_client.get("/api/v1/admin/gs-lms/content-requests?status=BAD").status_code == 422


def test_admin_patch(admin_client, db, who):
    row = record_content_request(db, 1, "alpha topic")
    db.commit()
    who["user"] = ADMIN
    r = admin_client.patch(f"/api/v1/admin/gs-lms/content-requests/{row.id}",
                           json={"status": "PLANNED", "note": "writing in Nov"})
    assert r.status_code == 200 and r.json()["data"]["status"] == "PLANNED" and r.json()["data"]["note"] == "writing in Nov"
    r = admin_client.patch(f"/api/v1/admin/gs-lms/content-requests/{row.id}", json={"status": "ADDRESSED"})
    assert r.json()["data"]["note"] == "writing in Nov" and r.json()["data"]["status"] == "ADDRESSED"
    assert admin_client.get("/api/v1/admin/gs-lms/content-requests?status=PLANNED").json()["data"] == []
    assert admin_client.patch("/api/v1/admin/gs-lms/content-requests/999", json={"note": "x"}).status_code == 404
    assert admin_client.patch(f"/api/v1/admin/gs-lms/content-requests/{row.id}", json={"status": "NOPE"}).status_code == 422


def test_admin_forbidden_for_students(admin_client, db, who):
    row = record_content_request(db, 1, "alpha topic")
    db.commit()
    assert admin_client.get("/api/v1/admin/gs-lms/content-requests").status_code == 403
    assert admin_client.patch(f"/api/v1/admin/gs-lms/content-requests/{row.id}", json={"note": "x"}).status_code == 403


# ---------------------------------------------------------------------------
# Route order and migration
# ---------------------------------------------------------------------------

def test_study_routes_registered_before_slug_routes():
    paths = [getattr(r, "path", "") for r in gs_lms_router.routes]
    first_slug = next(i for i, p in enumerate(paths) if p.startswith("/{subject_slug}"))
    study_idx = [i for i, p in enumerate(paths) if p.startswith("/study")]
    assert study_idx and max(study_idx) < first_slug


def test_study_paths_not_swallowed_by_slug_routes(client, world):
    # /study/concepts/{id} has the same shape as /{subject_slug}/concepts/{id}
    r = client.get(f"{STUDY}/concepts/{world['causes'].id}")
    assert r.status_code == 200 and "key_points_count" in r.json()["data"]
    assert client.get(f"{STUDY}/next").status_code == 200
    # slug routes still work
    r = client.get(f"/api/v1/gs-lms/history/concepts/{world['causes'].id}/version")
    assert r.status_code in (200, 404)
    assert r.json().get("detail") != "Subject 'study' not found"


def _load_migration():
    spec = importlib.util.spec_from_file_location("mig_k8e9", MIGRATION_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_migration_up_down_on_sqlite():
    mig = _load_migration()
    assert mig.down_revision == "j7d8e9f0a1b2"
    engine = create_engine("sqlite:///:memory:", future=True, poolclass=StaticPool)
    Base.metadata.create_all(engine, tables=[Base.metadata.tables["users"]])
    new = {"gs_lms_content_requests", "gs_lms_content_request_students"}
    with engine.begin() as conn:
        with Operations.context(MigrationContext.configure(conn)):
            mig.upgrade()
            insp = sa.inspect(conn)
            assert new <= set(insp.get_table_names())
            uniq = {i["name"]: i for i in insp.get_indexes("gs_lms_content_requests")}
            assert uniq["ix_gs_lms_content_requests_normalized_query"]["unique"]
            mig.upgrade()  # idempotent
            mig.downgrade()
            assert not new & set(sa.inspect(conn).get_table_names())


def test_migration_head_chain():
    from alembic.config import Config
    from alembic.script import ScriptDirectory

    root = Path(__file__).resolve().parents[2]
    cfg = Config(str(root / "alembic.ini"))
    cfg.set_main_option("script_location", str(root / "alembic"))
    assert ScriptDirectory.from_config(cfg).get_heads() == ["m0a1b2c3d4e5"]
