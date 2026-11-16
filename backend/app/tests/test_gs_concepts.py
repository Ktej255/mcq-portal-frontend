"""Concepts, mastery, the understanding grader, and their wiring into the
discussion gate, content checker, importer and read-only API."""

from __future__ import annotations

import copy
import json

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.main  # noqa: F401  (registers every model on Base.metadata)
from app.api.dependencies import get_current_user
from app.api.v1.gs_lms import router as gs_lms_router
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms import discussion as disc
from app.core.gs_lms.content_check import check_subject_content
from app.core.gs_lms.gemini_discussion_provider import GeminiAIResponseProvider
from app.core.gs_lms.importer import (
    DEFAULT_ARTIFACT_PATH,
    derive_concepts_for_subject,
    derive_concepts_from_checklist,
    import_gs_subject,
)
from app.core.gs_lms.mastery import (
    CONCEPT_PASS_THRESHOLD,
    is_topic_mastered,
    record_attempt,
    topic_mastery,
)
from app.core.gs_lms.models import GsLmsConcept, GsLmsNodeTypeEnum, GsLmsSyllabusNode
from app.core.gs_lms.student_models import (
    GsLmsConceptMasteryStatusEnum,
    GsLmsDiscussionSession,
)
from app.core.gs_lms.understanding import grade_explanation
from app.db.session import Base, get_db
from app.models.domain import RoleEnum, User

TEMPLATE_PATH = DEFAULT_ARTIFACT_PATH.parent / "templates" / "gs_subject_template.json"


def _template() -> dict:
    return json.loads(TEMPLATE_PATH.read_text(encoding="utf-8"))


def _leaf(data: dict) -> dict:
    return data["tree"][0]["children"][0]["children"][0]


@pytest.fixture()
def session_factory():
    engine = create_engine(
        "sqlite:///:memory:", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    with SessionLocal() as db:
        db.add(GsSubject(id=1, slug="polity-governance", name="Polity & Governance", display_order=1))
        db.add(User(id=1, email="s@test.local", full_name="S", role=RoleEnum.STUDENT, google_uid="g1"))
        db.commit()
    return SessionLocal


@pytest.fixture()
def db(session_factory):
    with session_factory() as session:
        yield session


def _leaf_node(db, *, checklist=None, review=GsReviewStatusEnum.REVIEWED) -> GsLmsSyllabusNode:
    node = GsLmsSyllabusNode(
        subject_id=1, title="Preamble", node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
        concept_checklist=checklist, review_status=review,
    )
    db.add(node)
    db.flush()
    return node


def _concept(db, node, title, key_points, review=GsReviewStatusEnum.REVIEWED, order=0) -> GsLmsConcept:
    c = GsLmsConcept(
        syllabus_node_id=node.id, title=title, key_points=key_points,
        review_status=review, display_order=order,
    )
    db.add(c)
    db.flush()
    return c


# ---- grader ----------------------------------------------------------------


def test_grader_coverage_and_lists():
    kps = ["Nehru moved the Objectives Resolution", "adopted in January 1947", "basis of the Preamble"]
    grade = grade_explanation("Nehru moved the Objectives Resolution, which became the basis of the Preamble.", kps)
    assert grade.covered == [kps[0], kps[2]]
    assert grade.missed == [kps[1]]
    assert grade.score == pytest.approx(2 / 3)
    assert [r.covered for r in grade.results] == [True, False, True]
    assert grade.results[1].coverage < 0.6


def test_grader_stemming_and_paraphrase_order():
    grade = grade_explanation(
        "Rulers who were declared sovereign by states making laws",
        ["state declares sovereign making law"],
    )
    assert grade.score == 1.0


def test_grader_stopwords_do_not_count():
    # Only stopwords in common: nothing meaningful matches.
    grade = grade_explanation("it is the one of those that are in a", ["the rule of the land is in the people"])
    assert grade.score == 0.0


def test_grader_years_must_match_exactly():
    kp = ["Plassey battle fought in 1757"]
    assert grade_explanation("The battle of Plassey was fought in 1757.", kp).score == 1.0
    # Every other word matches but the year is wrong.
    wrong = grade_explanation("The battle of Plassey was fought in 1857.", kp)
    assert wrong.score == 0.0 and wrong.missed == kp
    assert grade_explanation("The battle of Plassey was fought.", kp).score == 0.0


def test_grader_threshold_is_sixty_percent():
    kp = ["alpha beta gamma delta epsilon"]
    assert grade_explanation("alpha beta gamma", kp).score == 1.0  # 3/5 = 0.6
    assert grade_explanation("alpha beta", kp).score == 0.0  # 2/5


def test_grader_empty_inputs():
    assert grade_explanation("", ["some key point"]).score == 0.0
    assert grade_explanation(None, ["some key point"]).missed == ["some key point"]
    empty = grade_explanation("anything", [])
    assert empty.score == 0.0 and empty.covered == [] and empty.missed == []
    assert grade_explanation("text", ["", "   "]).results == []


def test_grader_is_pure_and_case_insensitive():
    kps = ["Federal Structure"]
    assert grade_explanation("FEDERAL structure!", kps) == grade_explanation("federal STRUCTURE", kps)


# ---- mastery ---------------------------------------------------------------


def test_record_attempt_transitions(db):
    node = _leaf_node(db)
    c = _concept(db, node, "C1", ["a b", "c d"])
    row = record_attempt(db, 1, c.id, 0.4)
    assert (row.status, row.attempts, row.score, row.last_score) == (GsLmsConceptMasteryStatusEnum.LEARNING, 1, 0.4, 0.4)
    assert row.passed_at is None and row.last_assessed_at is not None

    row = record_attempt(db, 1, c.id, 0.2)
    assert (row.attempts, row.score, row.last_score) == (2, 0.4, 0.2)
    assert row.status == GsLmsConceptMasteryStatusEnum.LEARNING

    row = record_attempt(db, 1, c.id, CONCEPT_PASS_THRESHOLD)
    assert row.status == GsLmsConceptMasteryStatusEnum.PASSED and row.passed_at is not None
    passed_at = row.passed_at

    row = record_attempt(db, 1, c.id, 0.1)  # a weak later attempt does not undo a pass
    assert row.status == GsLmsConceptMasteryStatusEnum.PASSED
    assert row.score == CONCEPT_PASS_THRESHOLD and row.last_score == 0.1 and row.attempts == 4
    assert row.passed_at == passed_at


def test_record_attempt_unknown_concept_and_clamping(db):
    with pytest.raises(ValueError):
        record_attempt(db, 1, 999, 0.5)
    node = _leaf_node(db)
    c = _concept(db, node, "C1", ["a b", "c d"])
    assert record_attempt(db, 1, c.id, 7).score == 1.0


def test_topic_mastery_and_is_topic_mastered(db):
    node = _leaf_node(db)
    # No concepts at all: nothing to master.
    assert is_topic_mastered(db, 1, node.id) is True
    assert topic_mastery(db, 1, node.id) == {"concepts": 0, "passed": 0, "average_score": 0.0}

    c1 = _concept(db, node, "C1", ["a b", "c d"], order=1)
    c2 = _concept(db, node, "C2", ["e f", "g h"], order=2)
    _concept(db, node, "Draft", ["i j", "k l"], review=GsReviewStatusEnum.UNREVIEWED, order=3)
    assert is_topic_mastered(db, 1, node.id) is False  # unreviewed concept ignored, two others untouched

    record_attempt(db, 1, c1.id, 1.0)
    record_attempt(db, 1, c2.id, 0.5)
    summary = topic_mastery(db, 1, node.id)
    assert summary == {"concepts": 2, "passed": 1, "average_score": 0.75}
    assert is_topic_mastered(db, 1, node.id) is False
    record_attempt(db, 1, c2.id, 0.9)
    assert is_topic_mastered(db, 1, node.id) is True
    assert is_topic_mastered(db, 2, node.id) is False  # another student has not passed


# ---- checker ---------------------------------------------------------------


def test_template_has_concepts_and_is_ready():
    report = check_subject_content(_template())
    assert report.errors == [] and report.gaps == [] and report.ready
    assert report.concepts >= 4


def _checked(concepts):
    data = _template()
    _leaf(data)["concepts"] = concepts
    return check_subject_content(data)


def test_checker_concept_errors():
    ok = {"title": "T", "key_points": ["one point", "two point"]}
    assert _checked([ok]).errors == []

    assert any("no title" in e for e in _checked([{"key_points": ["a b", "c d"]}]).errors)
    assert any("1 key points" in e for e in _checked([{"title": "T", "key_points": ["only one"]}]).errors)
    assert any("9 key points" in e for e in _checked([{"title": "T", "key_points": [f"p{i}" for i in range(9)]}]).errors)
    assert any("blank key point" in e for e in _checked([{"title": "T", "key_points": ["fine", "  "]}]).errors)
    assert any("titled" in e for e in _checked([ok, copy.deepcopy(ok)]).errors)
    assert any("must be a list" in e for e in _checked([{"title": "T", "key_points": "nope"}]).errors)


def test_checker_leaf_without_concepts_is_a_gap_not_ready():
    data = _template()
    del _leaf(data)["concepts"]
    report = check_subject_content(data)
    assert report.errors == []
    assert any("no concepts" in g for g in report.gaps)
    assert not report.ready and report.topics_ready == 0


# ---- importer --------------------------------------------------------------


def test_importer_upserts_concepts_idempotently(session_factory):
    with session_factory() as db:
        first = import_gs_subject(db, _template(), review_status="REVIEWED")
        n = len(_leaf(_template())["concepts"])
        assert first["concepts_created"] == n and first["concepts_updated"] == 0
        assert db.query(GsLmsConcept).count() == n

        data = _template()
        _leaf(data)["concepts"][0]["key_points"] = ["changed one", "changed two"]
        second = import_gs_subject(db, data, review_status="REVIEWED")
        assert second["concepts_created"] == 0 and second["concepts_updated"] == n
        assert db.query(GsLmsConcept).count() == n
        c = db.query(GsLmsConcept).order_by(GsLmsConcept.display_order).first()
        assert c.key_points == ["changed one", "changed two"]
        assert c.review_status == GsReviewStatusEnum.REVIEWED
        assert [x.display_order for x in db.query(GsLmsConcept).order_by(GsLmsConcept.display_order)] == list(range(1, n + 1))

        # An UNREVIEWED import keeps the status of unchanged concepts and resets
        # only the one whose key points differ from what is stored.
        import_gs_subject(db, _template())
        statuses = {x.display_order: x.review_status for x in db.query(GsLmsConcept)}
        assert statuses[1] == GsReviewStatusEnum.UNREVIEWED
        assert {s for o, s in statuses.items() if o != 1} == {GsReviewStatusEnum.REVIEWED}


def test_importer_rejects_bad_concepts(session_factory):
    data = _template()
    _leaf(data)["concepts"] = [{"title": "T", "key_points": ["just one"]}]
    with session_factory() as db, pytest.raises(ValueError):
        import_gs_subject(db, data)


# ---- backfill --------------------------------------------------------------


def test_derive_concepts_from_checklist(db):
    long_item = "Federalism " + "x" * 200
    node = _leaf_node(
        db,
        checklist=[
            "Sovereign, socialist and secular were described; added in 1976",
            "Objectives Resolution (1946)",
            long_item,
            "one; two; three; four; five; six",
        ],
    )
    created = derive_concepts_from_checklist(db, node)
    assert len(created) == 4
    first, second, third, fourth = created
    assert first.key_points == ["Sovereign", "socialist", "secular were described", "added in 1976"]
    assert second.key_points == ["Objectives Resolution (1946)"]  # does not split: the sentence itself
    assert len(third.title) <= 120 and third.key_points == [long_item]
    assert len(fourth.key_points) == 4
    assert all(c.review_status == GsReviewStatusEnum.REVIEWED for c in created)
    assert [c.display_order for c in created] == [1, 2, 3, 4]

    assert derive_concepts_from_checklist(db, node) == []  # idempotent
    assert db.query(GsLmsConcept).count() == 4


def test_derive_concepts_for_subject_skips_leaves_with_concepts(db):
    with_checklist = _leaf_node(db, checklist=["alpha, beta"])
    other = GsLmsSyllabusNode(
        subject_id=1, title="Other", node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
        concept_checklist=["gamma, delta"],
    )
    db.add(other)
    db.flush()
    _concept(db, other, "Existing", ["x y", "z w"])
    assert derive_concepts_for_subject(db, 1) == 1
    assert db.query(GsLmsConcept).filter_by(syllabus_node_id=with_checklist.id).count() == 1
    assert db.query(GsLmsConcept).filter_by(syllabus_node_id=other.id).count() == 1


# ---- discussion gate -------------------------------------------------------


def _discussion(db, node):
    session = disc.create_session(db, 1, node.id)
    return session


def _say(db, session, text):
    disc.add_student_turn(db, session, text)
    disc.add_ai_turn(db, session, "ok")
    transcript = disc.get_session_transcript(db, session.id)
    return disc.process_turn_concepts(db, session, transcript)


PARAPHRASE = (
    "The Objectives Resolution that Nehru moved laid down the philosophy that the Preamble reflects. "
    "India is sovereign, and the 42nd Amendment of 1976 inserted the words socialist and secular. "
    "The Preamble is not enforceable in courts, though Kesavananda Bharati held it is part of the Constitution."
)


def test_gate_passes_with_paraphrase_that_exact_match_fails(db):
    checklist = [
        "The Objectives Resolution moved by Nehru laid down the philosophy the Preamble reflects",
        "The 42nd Amendment in 1976 added the words socialist and secular",
        "The Preamble is not enforceable in a court of law",
    ]
    # Old behaviour: whole-sentence substring never matched a paraphrase.
    assert all(item.lower() not in PARAPHRASE.lower() for item in checklist)

    node = _leaf_node(db, checklist=checklist)  # fallback path: no concepts
    session = _discussion(db, node)
    active, missed, pct = _say(db, session, PARAPHRASE)
    assert active and missed == [] and pct == 100.0
    for i in range(2):
        _say(db, session, "More detail on the same.")
    assert disc.check_threshold(session, turn_count=6)
    disc.complete_session(db, session)
    assert session.status.value == "COMPLETED"


def test_gate_with_concepts_uses_key_points_and_records_mastery(db):
    node = _leaf_node(db, checklist=["unused sentence that would never match"])
    c1 = _concept(db, node, "Objectives Resolution", [
        "Nehru moved the Objectives Resolution", "the Preamble reflects its philosophy",
    ], order=1)
    c2 = _concept(db, node, "Added words", [
        "42nd Amendment of 1976", "inserted socialist and secular", "India is sovereign",
    ], order=2)
    _concept(db, node, "Unreviewed", ["zzz yyy"], review=GsReviewStatusEnum.UNREVIEWED, order=3)
    db.refresh(node)

    session = _discussion(db, node)
    active, missed, pct = _say(db, session, PARAPHRASE)
    assert active and missed == [] and pct == 100.0
    assert session.match_percentage == 100.0

    for _ in range(2):
        _say(db, session, "Filler.")
    disc.complete_session(db, session)

    assert is_topic_mastered(db, 1, node.id)
    assert topic_mastery(db, 1, node.id)["passed"] == 2


def test_gate_with_concepts_partial_coverage_blocks_and_scores_each(db):
    node = _leaf_node(db)
    c1 = _concept(db, node, "One", ["alpha beta", "gamma delta"], order=1)
    c2 = _concept(db, node, "Two", ["epsilon zeta", "eta theta"], order=2)
    db.refresh(node)
    session = _discussion(db, node)
    _active, missed, pct = _say(db, session, "alpha beta gamma delta epsilon zeta")
    assert pct == 75.0 and missed == ["eta theta"]
    for _ in range(2):
        _say(db, session, "nothing new")
    assert not disc.check_threshold(session, turn_count=6)  # 75% < 80%
    with pytest.raises(ValueError):
        disc.complete_session(db, session)
    # Per-concept scores that would be recorded.
    graded = disc.grade_concepts(["alpha beta gamma delta epsilon zeta"], [c1, c2])
    assert graded["scores"] == {c1.id: 1.0, c2.id: 0.5}


def test_gate_without_concepts_or_checklist_still_uses_turn_fallback(db):
    node = _leaf_node(db)
    session = _discussion(db, node)
    assert _say(db, session, "hello") == (False, None, None)


# ---- the 6000% fix ---------------------------------------------------------


def test_gemini_prompt_shows_engine_percentage_without_scaling(monkeypatch):
    class _Model:
        pass

    provider = GeminiAIResponseProvider.__new__(GeminiAIResponseProvider)
    prompt = provider._build_prompt("Topic", [], "msg", concepts_missed=["x"], match_percentage=60.0)
    assert "coverage: 60%" in prompt and "6000%" not in prompt
    assert f"opens at {disc.CONCEPT_GATE_THRESHOLD:.0f}%" in prompt


def test_percentage_stored_by_engine_is_what_the_prompt_receives(db):
    node = _leaf_node(db, checklist=["alpha", "beta", "gamma", "delta", "epsilon"])
    session = _discussion(db, node)
    _active, missed, pct = _say(db, session, "alpha beta gamma")
    provider = GeminiAIResponseProvider.__new__(GeminiAIResponseProvider)
    prompt = provider._build_prompt("Topic", [], "msg", concepts_missed=missed, match_percentage=pct)
    assert "coverage: 60%" in prompt


# ---- API -------------------------------------------------------------------


@pytest.fixture()
def client(session_factory):
    app_ = FastAPI()
    app_.include_router(gs_lms_router, prefix="/api/v1/gs-lms")

    def _db():
        s = session_factory()
        try:
            yield s
        finally:
            s.close()

    class _Student:
        id = 1
        email = "s@test.local"
        role = RoleEnum.STUDENT

    app_.dependency_overrides[get_db] = _db
    app_.dependency_overrides[get_current_user] = lambda: _Student()
    return TestClient(app_)


def test_concepts_endpoint(client, session_factory):
    with session_factory() as db:
        node = _leaf_node(db)
        c1 = _concept(db, node, "One", ["a1 b1", "c1 d1"], order=1)
        c1.misconceptions = ["wrong belief"]
        _concept(db, node, "Two", ["a2 b2", "c2 d2"], order=2)
        _concept(db, node, "Hidden", ["a3 b3", "c3 d3"], review=GsReviewStatusEnum.UNREVIEWED, order=3)
        record_attempt(db, 1, c1.id, 0.9)
        db.commit()
        node_id = node.id

    resp = client.get(f"/api/v1/gs-lms/polity-governance/topics/{node_id}/concepts")
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert [c["title"] for c in data["concepts"]] == ["One", "Two"]
    one, two = data["concepts"]
    assert one["key_points"] == ["a1 b1", "c1 d1"] and one["misconceptions"] == ["wrong belief"]
    assert one["mastery"]["status"] == "PASSED" and one["mastery"]["score"] == 0.9 and one["mastery"]["attempts"] == 1
    assert two["mastery"] == {
        "status": "NOT_STARTED", "score": 0.0, "last_score": None,
        "attempts": 0, "passed_at": None, "last_assessed_at": None,
    }
    assert data["topic_mastery"] == {"concepts": 2, "passed": 1, "average_score": 0.45, "mastered": False}


def test_concepts_endpoint_404s(client, session_factory):
    with session_factory() as db:
        node = _leaf_node(db)
        mega = GsLmsSyllabusNode(subject_id=1, title="Mega", node_type=GsLmsNodeTypeEnum.MEGA_TOPIC)
        db.add(mega)
        db.commit()
        mega_id, node_id = mega.id, node.id
    base = "/api/v1/gs-lms"
    assert client.get(f"{base}/polity-governance/topics/9999/concepts").status_code == 404
    assert client.get(f"{base}/polity-governance/topics/{mega_id}/concepts").status_code == 404
    assert client.get(f"{base}/no-such-subject/topics/{node_id}/concepts").status_code == 404
    # A leaf with no concepts is an empty, mastered topic.
    assert client.get(f"{base}/polity-governance/topics/{node_id}/concepts").json()["data"]["topic_mastery"]["mastered"] is True
