"""Server-enforced learning loop: step gates, mastery, topic order lock and
combined review checkpoints (app.core.gs_lms.progression)."""

from __future__ import annotations

from datetime import datetime, timezone

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.main  # noqa: F401  (registers every model on Base.metadata)
from app.api.dependencies import ai_rate_limit, get_current_user
from app.api.v1.gs_lms import router as gs_lms_router
from app.core.config import settings
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms import progression as prog
from app.core.gs_lms.funnel_models import (
    GsLmsCheckpoint,
    GsLmsFunnelProgress,
    GsLmsMcqLabSession,
    GsLmsRecallAttempt,
)
from app.core.gs_lms.models import (
    GsLmsContentSection,
    GsLmsMcqQuestion,
    GsLmsNodeTypeEnum,
    GsLmsQuestionTypeEnum,
    GsLmsSectionLabelEnum,
    GsLmsSyllabusNode,
)
from app.core.gs_lms.student_models import GsLmsDiscussionSession, GsLmsDiscussionStatusEnum
from app.db.session import Base, get_db
from app.models.domain import RoleEnum, User

BASE = "/api/v1/gs-lms/polity-governance"
SECTION_LABELS = ["BASIC", "NCERT_LEVEL", "ADVANCED", "CURRENT_AFFAIRS", "EXAMINER_TRAPS"]


class _Who:
    def __init__(self, id, role, email):
        self.id, self.role, self.email = id, role, email


STUDENT = _Who(1, RoleEnum.STUDENT, "s@test.local")
ADMIN = _Who(2, RoleEnum.ADMIN, "a@test.local")


@pytest.fixture(autouse=True)
def progression_on(monkeypatch):
    """These tests exercise the rules, so the master switch is ON."""
    monkeypatch.setattr(settings, "GS_LMS_ENFORCE_PROGRESSION", True)
    monkeypatch.setattr(settings, "GS_LMS_PROGRESSION_START", None)


@pytest.fixture()
def session_factory():
    engine = create_engine(
        "sqlite:///:memory:", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    with SessionLocal() as db:
        db.add(GsSubject(id=1, slug="polity-governance", name="Polity", display_order=1))
        db.add(User(id=1, email="s@test.local", full_name="S", role=RoleEnum.STUDENT, google_uid="g1"))
        db.add(User(id=2, email="a@test.local", full_name="A", role=RoleEnum.ADMIN, google_uid="g2"))
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


def _node(db, title, node_type, parent=None, order=0):
    n = GsLmsSyllabusNode(
        subject_id=1, title=title, node_type=node_type, parent_id=parent.id if parent else None,
        display_order=order, review_status=GsReviewStatusEnum.REVIEWED,
    )
    db.add(n)
    db.flush()
    return n


def _content(db, leaf):
    for i, label in enumerate(SECTION_LABELS):
        db.add(GsLmsContentSection(
            syllabus_node_id=leaf.id, section_label=GsLmsSectionLabelEnum(label), title=label,
            blocks=[{"type": "text", "content": "x"}], display_order=i,
            review_status=GsReviewStatusEnum.REVIEWED, authored=True,
        ))


def _questions(db, leaf, n=5):
    for i in range(n):
        db.add(GsLmsMcqQuestion(
            syllabus_node_id=leaf.id, question_text=f"{leaf.title} q{i}",
            options=[{"label": "A", "text": "a"}, {"label": "B", "text": "b"}],
            correct_option="A", explanation="because", question_type=GsLmsQuestionTypeEnum.FACTUAL,
            display_order=i, review_status=GsReviewStatusEnum.REVIEWED,
        ))


@pytest.fixture()
def tree(db):
    """Mega -> Sub A (L1..L4) and Sub B (L5, L6)."""
    mega = _node(db, "Mega", GsLmsNodeTypeEnum.MEGA_TOPIC)
    sub_a = _node(db, "Sub A", GsLmsNodeTypeEnum.SUB_TOPIC, mega, 1)
    sub_b = _node(db, "Sub B", GsLmsNodeTypeEnum.SUB_TOPIC, mega, 2)
    leaves = {}
    for i in range(1, 5):
        leaves[i] = _node(db, f"L{i}", GsLmsNodeTypeEnum.LEAF_TOPIC, sub_a, i)
    for i in range(5, 7):
        leaves[i] = _node(db, f"L{i}", GsLmsNodeTypeEnum.LEAF_TOPIC, sub_b, i)
    for leaf in leaves.values():
        _content(db, leaf)
        _questions(db, leaf)
    db.commit()
    return {"A": sub_a.id, "B": sub_b.id, **{i: leaf.id for i, leaf in leaves.items()}}


def _finish(db, leaf_id, score=0.8, student=1):
    """Complete the funnel (step 14) and submit an MCQ lab with ``score``."""
    now = datetime.now(timezone.utc)
    for step in range(1, 15):
        if not db.query(GsLmsFunnelProgress).filter_by(
            student_id=student, syllabus_node_id=leaf_id, step_number=step
        ).first():
            db.add(GsLmsFunnelProgress(
                student_id=student, syllabus_node_id=leaf_id, step_number=step, completed=True, completed_at=now
            ))
    db.add(GsLmsMcqLabSession(
        student_id=student, syllabus_node_id=leaf_id, total_questions=15,
        correct_count=round(score * 15), score=score, submitted_at=now,
    ))
    db.flush()
    return prog.refresh_mastery(db, student, leaf_id)


def _recall(db, leaf_id, label, score, student=1):
    n = db.query(GsLmsRecallAttempt).filter_by(student_id=student, syllabus_node_id=leaf_id, section_label=label).count()
    db.add(GsLmsRecallAttempt(
        student_id=student, syllabus_node_id=leaf_id, section_label=label,
        recall_score=score, confidence_score=0.5, attempt_number=n + 1,
    ))
    db.commit()


def _discussion_done(db, leaf_id, student=1):
    db.add(GsLmsDiscussionSession(
        student_id=student, syllabus_node_id=leaf_id, status=GsLmsDiscussionStatusEnum.COMPLETED,
        started_at=datetime.now(timezone.utc), completed_at=datetime.now(timezone.utc),
    ))
    db.commit()


def _complete(client, leaf_id, step):
    return client.post(f"{BASE}/funnel/{leaf_id}/complete-step", json={"step": step})


# ---------------------------------------------------------------------------
# Step gates
# ---------------------------------------------------------------------------

def test_thresholds_are_the_specified_values():
    assert prog.RECALL_PASS_SCORE == 0.5
    assert prog.RECALL_MAX_ATTEMPTS == 3
    assert prog.TOPIC_MCQ_PASS == 0.6
    assert prog.CHECKPOINT_EVERY == 3
    assert prog.CHECKPOINT_QUESTIONS == 10
    assert prog.CHECKPOINT_PASS == 0.6


def test_step1_rejected_without_discussion(client, db, tree):
    r = _complete(client, tree[1], 1)
    assert r.status_code == 409
    assert "discussion" in r.json()["detail"].lower()
    _discussion_done(db, tree[1])
    assert _complete(client, tree[1], 1).status_code == 200


def test_step1_ignores_incomplete_discussion(client, db, tree):
    db.add(GsLmsDiscussionSession(
        student_id=1, syllabus_node_id=tree[1], status=GsLmsDiscussionStatusEnum.IN_PROGRESS,
        started_at=datetime.now(timezone.utc),
    ))
    db.commit()
    assert _complete(client, tree[1], 1).status_code == 409


def _walk_to(client, db, leaf, last_step):
    _discussion_done(db, leaf)
    for step in range(1, last_step + 1):
        label = prog.RECALL_STEP_SECTIONS.get(step)
        if label:
            _recall(db, leaf, label, 0.9)
        assert _complete(client, leaf, step).status_code == 200, step


def test_recall_gate_fail_pass_and_max_attempts(client, db, tree):
    leaf = tree[1]
    _discussion_done(db, leaf)
    assert _complete(client, leaf, 1).status_code == 200
    assert _complete(client, leaf, 2).status_code == 200

    # no attempt
    r = _complete(client, leaf, 3)
    assert r.status_code == 409 and "recall" in r.json()["detail"].lower()
    # failing attempts below the max
    _recall(db, leaf, "BASIC", 0.3)
    _recall(db, leaf, "BASIC", 0.4)
    assert _complete(client, leaf, 3).status_code == 409
    # the third failed attempt allows it, but the section is flagged weak
    _recall(db, leaf, "BASIC", 0.45)
    assert _complete(client, leaf, 3).status_code == 200
    assert prog.weak_recall_sections(db, 1, leaf) == ["BASIC"]

    # a passing best score (not the latest) opens the next recall step at once
    assert _complete(client, leaf, 4).status_code == 200
    _recall(db, leaf, "NCERT_LEVEL", 0.6)
    _recall(db, leaf, "NCERT_LEVEL", 0.1)
    assert _complete(client, leaf, 5).status_code == 200
    assert "NCERT_LEVEL" not in prog.weak_recall_sections(db, 1, leaf)


def test_recall_gate_skipped_when_section_missing(client, db, tree):
    leaf = tree[1]
    db.query(GsLmsContentSection).filter_by(
        syllabus_node_id=leaf, section_label=GsLmsSectionLabelEnum.BASIC
    ).delete()
    db.commit()
    _discussion_done(db, leaf)
    assert _complete(client, leaf, 1).status_code == 200
    assert _complete(client, leaf, 2).status_code == 200
    assert _complete(client, leaf, 3).status_code == 200  # nothing to recall


def test_step12_requires_mcq_lab_and_completed_vs_mastered(client, db, tree):
    leaf = tree[1]
    _walk_to(client, db, leaf, 11)
    r = _complete(client, leaf, 12)
    assert r.status_code == 409 and "mcq" in r.json()["detail"].lower()

    db.add(GsLmsMcqLabSession(
        student_id=1, syllabus_node_id=leaf, total_questions=15, correct_count=6, score=0.4,
        submitted_at=datetime.now(timezone.utc),
    ))
    db.commit()
    for step in (12, 13):
        assert _complete(client, leaf, step).status_code == 200

    # not completed until step 14
    assert leaf not in prog.completed_topic_ids(db, 1, [leaf])
    assert _complete(client, leaf, 14).status_code == 200

    # completed, but 40% < 60% so not mastered; next topic stays locked
    assert leaf in prog.completed_topic_ids(db, 1, [leaf])
    assert leaf not in prog.mastered_topic_ids(db, 1, [leaf])
    r = client.get(f"{BASE}/funnel/{tree[2]}/state")
    assert r.status_code == 423
    assert "L1" in r.json()["detail"]


def test_retake_mcq_lab_masters_topic(client, db, tree):
    leaf = tree[1]
    _walk_to(client, db, leaf, 11)
    db.add(GsLmsMcqLabSession(
        student_id=1, syllabus_node_id=leaf, total_questions=15, correct_count=3, score=0.2,
        submitted_at=datetime.now(timezone.utc),
    ))
    db.commit()
    for step in (12, 13, 14):
        assert _complete(client, leaf, step).status_code == 200
    assert client.get(f"{BASE}/funnel/{tree[2]}/state").status_code == 423

    # retake through the API, answering everything correctly
    qs = client.get(f"{BASE}/funnel/{leaf}/mcq-lab/questions").json()
    assert len(qs) == 15
    r = client.post(f"{BASE}/funnel/{leaf}/mcq-lab/submit", json={
        "answers": [{"question_id": q["question_id"], "chosen_answer": "A"} for q in qs]
    })
    assert r.status_code == 200, r.text
    assert r.json()["score"] == 100.0
    assert leaf in prog.mastered_topic_ids(db, 1, [leaf])
    assert client.get(f"{BASE}/funnel/{tree[2]}/state").status_code == 200


# ---------------------------------------------------------------------------
# Topic order lock
# ---------------------------------------------------------------------------

def test_locked_leaf_returns_423_on_every_guarded_endpoint(client, db, tree):
    locked = tree[2]
    calls = [
        ("get", f"{BASE}/funnel/{locked}/state", None),
        ("post", f"{BASE}/funnel/{locked}/complete-step", {"step": 1}),
        ("post", f"{BASE}/funnel/{locked}/reading-time", {"section_id": 1, "duration_seconds": 5}),
        ("post", f"{BASE}/discussion/start", {"syllabus_node_id": locked}),
        ("get", f"{BASE}/topics/{locked}/sections", None),
        ("post", f"{BASE}/topics/{locked}/sections/1/complete", None),
        ("post", f"{BASE}/funnel/{locked}/recall/text", {"section_label": "BASIC", "text": "x"}),
        ("get", f"{BASE}/funnel/{locked}/recall/BASIC", None),
        ("get", f"{BASE}/funnel/{locked}/mcq-lab/questions", None),
        ("get", f"{BASE}/funnel/{locked}/mcq-lab/result", None),
        ("get", f"{BASE}/funnel/{locked}/mains/questions", None),
        ("post", f"{BASE}/funnel/{locked}/mains/submit", {"question_id": 1, "body": "x"}),
    ]
    for method, url, body in calls:
        r = getattr(client, method)(url, **({"json": body} if body is not None else {}))
        assert r.status_code == 423, (url, r.status_code, r.text)
        assert "L1" in r.json()["detail"], url

    # first leaf is open
    assert client.get(f"{BASE}/funnel/{tree[1]}/state").status_code == 200
    assert client.get(f"{BASE}/topics/{tree[1]}/sections").status_code == 200
    assert client.get(f"{BASE}/funnel/{tree[1]}/mcq-lab/questions").status_code == 200


def test_next_leaf_unlocks_when_previous_mastered(client, db, tree):
    assert client.get(f"{BASE}/funnel/{tree[2]}/state").status_code == 423
    _finish(db, tree[1])
    db.commit()
    assert client.get(f"{BASE}/funnel/{tree[2]}/state").status_code == 200
    # but not two ahead
    assert client.get(f"{BASE}/funnel/{tree[3]}/state").status_code == 423


def test_admin_is_never_locked(client, who, tree):
    who["user"] = ADMIN
    assert client.get(f"{BASE}/funnel/{tree[3]}/state").status_code == 200
    assert client.get(f"{BASE}/funnel/{tree[3]}/mcq-lab/questions").status_code == 200
    r = client.post(f"{BASE}/discussion/start", json={"syllabus_node_id": tree[3]})
    assert r.status_code == 200


def test_allowlisted_admin_email_is_exempt(monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_EMAILS", ["boss@test.local"])
    assert prog.is_order_exempt(_Who(9, RoleEnum.STUDENT, "Boss@test.local"))
    assert not prog.is_order_exempt(STUDENT)


def test_setting_off_disables_lock(client, tree, monkeypatch):
    assert client.get(f"{BASE}/funnel/{tree[3]}/state").status_code == 423
    monkeypatch.setattr(settings, "GS_LMS_ENFORCE_ORDER", False)
    assert client.get(f"{BASE}/funnel/{tree[3]}/state").status_code == 200


def test_setting_defaults_to_on():
    assert settings.GS_LMS_ENFORCE_ORDER is True


def test_leaves_without_content_do_not_block(client, db, tree):
    db.query(GsLmsContentSection).filter_by(syllabus_node_id=tree[1]).delete()
    db.commit()
    assert client.get(f"{BASE}/funnel/{tree[2]}/state").status_code == 200


def _flat(nodes):
    for n in nodes:
        yield n
        yield from _flat(n["children"])


def test_syllabus_tree_lock_flags(client, db, tree):
    def leaves():
        data = client.get(f"{BASE}/syllabus").json()["data"]["tree"]
        return {n["title"]: n for n in _flat(data) if n["node_type"] == "LEAF_TOPIC"}

    l = leaves()
    assert l["L1"]["locked"] is False and l["L1"]["lock_reason"] is None and l["L1"]["mastered"] is False
    assert l["L2"]["locked"] is True and "L1" in l["L2"]["lock_reason"]
    assert l["L6"]["locked"] is True and l["L6"]["mastered"] is False

    _finish(db, tree[1])
    db.commit()
    l = leaves()
    assert l["L1"]["mastered"] is True
    assert l["L2"]["locked"] is False
    assert l["L3"]["locked"] is True

    mega = next(n for n in client.get(f"{BASE}/syllabus").json()["data"]["tree"])
    assert mega["locked"] is False and mega["mastered"] is None


def test_syllabus_tree_admin_has_no_locks(client, who, tree):
    who["user"] = ADMIN
    data = client.get(f"{BASE}/syllabus").json()["data"]["tree"]
    assert all(n["locked"] is False for n in _flat(data))


def test_progression_endpoint(client, db, tree):
    r = client.get(f"{BASE}/progression").json()
    assert r["next_leaf"] == {"node_id": tree[1], "title": "L1"}
    assert r["mastered_count"] == 0 and r["total_leaves"] == 6
    assert r["due_checkpoint"] is None and r["order_enforced"] is True

    _finish(db, tree[1])
    _finish(db, tree[2])
    _finish(db, tree[3])
    db.commit()
    r = client.get(f"{BASE}/progression").json()
    assert r["mastered_count"] == 3
    assert r["due_checkpoint"]["leaves"][0]["node_id"] == tree[1]
    assert [x["node_id"] for x in r["due_checkpoint"]["leaves"]] == [tree[1], tree[2], tree[3]]
    # next unlocked leaf stays None-ish: L4 is locked behind the review
    assert r["next_leaf"] is None


# ---------------------------------------------------------------------------
# Checkpoints
# ---------------------------------------------------------------------------

def test_checkpoint_due_after_three_mastered_leaves(client, db, tree):
    assert _finish(db, tree[1]) == []
    assert _finish(db, tree[2]) == []
    created = _finish(db, tree[3])
    db.commit()
    assert len(created) == 1
    cp = created[0]
    assert cp.status == "DUE" and cp.leaf_ids == [tree[1], tree[2], tree[3]]
    assert cp.sub_topic_node_id == tree["A"] and cp.attempts == 0

    # the next leaf stays locked and says why
    r = client.get(f"{BASE}/funnel/{tree[4]}/state")
    assert r.status_code == 423 and "review test" in r.json()["detail"]
    # earlier leaves remain open
    assert client.get(f"{BASE}/funnel/{tree[3]}/state").status_code == 200


def test_checkpoint_creation_is_idempotent(db, tree):
    _finish(db, tree[1])
    _finish(db, tree[2])
    _finish(db, tree[3])
    assert prog.refresh_mastery(db, 1, tree[3]) == []
    assert prog.refresh_mastery(db, 1, tree[1]) == []
    db.commit()
    assert db.query(GsLmsCheckpoint).count() == 1


def test_checkpoint_on_funnel_completion_through_api(client, db, tree):
    leaf = tree[1]
    _walk_to(client, db, leaf, 11)
    db.add(GsLmsMcqLabSession(
        student_id=1, syllabus_node_id=leaf, total_questions=15, correct_count=15, score=1.0,
        submitted_at=datetime.now(timezone.utc),
    ))
    db.commit()
    assert _complete(client, leaf, 12).status_code == 200
    assert _complete(client, leaf, 13).status_code == 200
    # make L2 and L3 mastered up-front so finishing L1 via the API completes the run of 3
    _finish(db, tree[2])
    _finish(db, tree[3])
    db.commit()
    assert db.query(GsLmsCheckpoint).count() == 0
    assert _complete(client, leaf, 14).status_code == 200
    assert db.query(GsLmsCheckpoint).count() == 1


def test_checkpoint_at_subtopic_end_needs_two_leaves(client, db, tree):
    # Sub A: three mastered -> checkpoint, then the 4th leaf alone -> none
    for i in (1, 2, 3):
        _finish(db, tree[i])
    cp = db.query(GsLmsCheckpoint).one()
    cp.status = "PASSED"
    assert _finish(db, tree[4]) == []
    # Sub B has two leaves: the first mastered alone does nothing, the last triggers
    assert _finish(db, tree[5]) == []
    created = _finish(db, tree[6])
    db.commit()
    assert len(created) == 1
    assert created[0].leaf_ids == [tree[5], tree[6]]
    assert created[0].sub_topic_node_id == tree["B"]
    assert db.query(GsLmsCheckpoint).count() == 2


def test_no_checkpoint_when_run_broken_by_unmastered_leaf(db, tree):
    _finish(db, tree[1])
    _finish(db, tree[2], score=0.3)  # completed but not mastered
    assert _finish(db, tree[3]) == []
    assert db.query(GsLmsCheckpoint).count() == 0


def _due_checkpoint(client, db, tree):
    for i in (1, 2, 3):
        _finish(db, tree[i])
    db.commit()
    listed = client.get(f"{BASE}/checkpoints").json()
    assert len(listed) == 1
    return listed[0]


def test_checkpoint_start_draws_even_questions_without_answers(client, db, tree):
    cp = _due_checkpoint(client, db, tree)
    assert [l["node_id"] for l in cp["leaves"]] == [tree[1], tree[2], tree[3]]
    r = client.post(f"{BASE}/checkpoints/{cp['checkpoint_id']}/start")
    assert r.status_code == 200
    body = r.json()
    assert body["total_questions"] == prog.CHECKPOINT_QUESTIONS == len(body["questions"])
    text = r.text
    assert "correct_option" not in text and "correct_answer" not in text and "explanation" not in text
    ids = [q["question_id"] for q in body["questions"]]
    assert len(set(ids)) == 10
    per_leaf = {}
    for q in db.query(GsLmsMcqQuestion).filter(GsLmsMcqQuestion.id.in_(ids)):
        per_leaf[q.syllabus_node_id] = per_leaf.get(q.syllabus_node_id, 0) + 1
    assert sorted(per_leaf.values()) == [3, 3, 4]


def _answers(client, cp_id, correct: bool):
    qs = client.post(f"{BASE}/checkpoints/{cp_id}/start").json()["questions"]
    return {"answers": [{"question_id": q["question_id"], "chosen_answer": "A" if correct else "B"} for q in qs]}


def test_checkpoint_submit_fail_then_pass_unlocks(client, db, tree):
    cp = _due_checkpoint(client, db, tree)
    cid = cp["checkpoint_id"]

    r = client.post(f"{BASE}/checkpoints/{cid}/submit", json=_answers(client, cid, False))
    assert r.status_code == 200, r.text
    res = r.json()
    assert res["passed"] is False and res["score"] == 0.0 and res["status"] == "DUE"
    assert sum(b["total"] for b in res["leaf_breakdown"]) == 10
    assert all(a["explanation"] == "because" and a["correct_answer"] == "A" for a in res["attempts"])
    assert client.get(f"{BASE}/funnel/{tree[4]}/state").status_code == 423

    r = client.post(f"{BASE}/checkpoints/{cid}/submit", json=_answers(client, cid, True))
    res = r.json()
    assert res["passed"] is True and res["score"] == 100.0 and res["status"] == "PASSED"
    db.expire_all()
    row = db.get(GsLmsCheckpoint, cid)
    assert row.status == "PASSED" and row.attempts == 2 and row.best_score == 1.0 and row.passed_at
    assert client.get(f"{BASE}/checkpoints").json() == []
    assert client.get(f"{BASE}/funnel/{tree[4]}/state").status_code == 200

    # a passed checkpoint cannot be started or submitted again
    assert client.post(f"{BASE}/checkpoints/{cid}/start").status_code == 409


def test_checkpoint_pass_mark_is_sixty_percent(client, db, tree):
    cp = _due_checkpoint(client, db, tree)
    cid = cp["checkpoint_id"]
    payload = _answers(client, cid, True)
    for a in payload["answers"][:4]:  # 6/10 correct
        a["chosen_answer"] = "B"
    res = client.post(f"{BASE}/checkpoints/{cid}/submit", json=payload).json()
    assert res["score"] == 60.0 and res["passed"] is True


def test_checkpoint_submit_validation_and_ownership(client, db, tree, who):
    cp = _due_checkpoint(client, db, tree)
    cid = cp["checkpoint_id"]
    one = {"answers": [{"question_id": 999999, "chosen_answer": "A"}]}
    assert client.post(f"{BASE}/checkpoints/{cid}/submit", json=one).status_code == 409  # not started
    short = _answers(client, cid, True)
    short["answers"] = short["answers"][:5]
    assert client.post(f"{BASE}/checkpoints/{cid}/submit", json=short).status_code == 422
    dup = _answers(client, cid, True)
    dup["answers"][1] = dup["answers"][0]
    assert client.post(f"{BASE}/checkpoints/{cid}/submit", json=dup).status_code == 422

    who["user"] = ADMIN  # someone else's checkpoint
    assert client.post(f"{BASE}/checkpoints/{cid}/start").status_code == 404
    assert client.get(f"{BASE}/checkpoints").json() == []


def test_checkpoint_submit_charges_mcq_quota():
    from app.api.v1.gs_lms import progression as api

    route = next(r for r in api.router.routes if r.path.endswith("/checkpoints/{checkpoint_id}/submit"))
    names = [getattr(d.call, "__qualname__", "") for d in route.dependant.dependencies]
    assert any("mcq_quota" in n for n in names)


# ---------------------------------------------------------------------------
# Mains rate limit
# ---------------------------------------------------------------------------

def test_mains_submit_has_ai_rate_limit():
    from app.api.v1.gs_lms import mains

    route = next(r for r in mains.router.routes if r.path.endswith("/mains/submit"))
    assert any(d.call is ai_rate_limit for d in route.dependant.dependencies)


# ---------------------------------------------------------------------------
# Master switch OFF, grandfathering, checkpoint integrity
# ---------------------------------------------------------------------------

def test_switch_off_keeps_old_behaviour(client, db, tree, monkeypatch):
    monkeypatch.setattr(settings, "GS_LMS_ENFORCE_PROGRESSION", False)
    assert settings.GS_LMS_ENFORCE_ORDER is True  # sub-switch alone does nothing
    leaf = tree[1]
    # steps 1, 3 and 12 complete in order with no discussion, recall or MCQ lab
    for step in range(1, 15):
        assert _complete(client, leaf, step).status_code == 200, step
    # step order is still enforced
    assert _complete(client, tree[2], 3).status_code == 409
    # any leaf opens, and the tree reports nothing locked
    for i in range(2, 7):
        assert client.get(f"{BASE}/funnel/{tree[i]}/state").status_code == 200
        assert client.get(f"{BASE}/topics/{tree[i]}/sections").status_code == 200
    assert client.post(f"{BASE}/discussion/start", json={"syllabus_node_id": tree[5]}).status_code == 200
    data = client.get(f"{BASE}/syllabus").json()["data"]["tree"]
    assert all(n["locked"] is False for n in _flat(data))
    assert client.get(f"{BASE}/progression").status_code == 200


def test_sub_switch_off_with_master_on(client, tree, monkeypatch):
    monkeypatch.setattr(settings, "GS_LMS_ENFORCE_ORDER", False)
    assert client.get(f"{BASE}/funnel/{tree[3]}/state").status_code == 200


def test_grandfathered_completion_counts_as_mastered(client, db, tree, monkeypatch):
    from datetime import timedelta

    old = datetime.now(timezone.utc) - timedelta(days=2)
    for step in range(1, 15):
        db.add(GsLmsFunnelProgress(student_id=1, syllabus_node_id=tree[1], step_number=step,
                                   completed=True, completed_at=old))
    db.commit()  # completed, no MCQ lab at all
    assert client.get(f"{BASE}/funnel/{tree[2]}/state").status_code == 423  # no start set

    monkeypatch.setattr(settings, "GS_LMS_PROGRESSION_START", datetime.now(timezone.utc) - timedelta(days=1))
    assert tree[1] in prog.mastered_topic_ids(db, 1, [tree[1]])
    assert client.get(f"{BASE}/funnel/{tree[2]}/state").status_code == 200

    # completed after the start moment: needs the MCQ score as usual
    monkeypatch.setattr(settings, "GS_LMS_PROGRESSION_START", datetime.now(timezone.utc) - timedelta(days=3))
    assert tree[1] not in prog.mastered_topic_ids(db, 1, [tree[1]])


def test_checkpoint_submit_requires_started_exact_ids(client, db, tree):
    cid = _due_checkpoint(client, db, tree)["checkpoint_id"]
    qs = client.post(f"{BASE}/checkpoints/{cid}/start").json()["questions"]
    ids = [q["question_id"] for q in qs]
    db.expire_all()
    assert db.get(GsLmsCheckpoint, cid).question_ids == ids

    def body(question_ids):
        return {"answers": [{"question_id": i, "chosen_answer": "A"} for i in question_ids]}

    other = [i for (i,) in db.query(GsLmsMcqQuestion.id).filter(
        GsLmsMcqQuestion.syllabus_node_id.in_([tree[1], tree[2], tree[3]])) if i not in ids][0]
    swapped = ids[:-1] + [other]
    assert client.post(f"{BASE}/checkpoints/{cid}/submit", json=body(swapped)).status_code == 422
    assert client.post(f"{BASE}/checkpoints/{cid}/submit", json=body(ids[:-1])).status_code == 422

    # a new /start replaces the stored set; the old one no longer matches
    new_ids = [q["question_id"] for q in client.post(f"{BASE}/checkpoints/{cid}/start").json()["questions"]]
    if set(new_ids) != set(ids):
        assert client.post(f"{BASE}/checkpoints/{cid}/submit", json=body(ids)).status_code == 422
    r = client.post(f"{BASE}/checkpoints/{cid}/submit", json=body(list(reversed(new_ids))))
    assert r.status_code == 200 and r.json()["passed"] is True

    # one submission per /start
    cid2 = cid  # passed now; a second checkpoint check is covered by the 409 below
    assert client.post(f"{BASE}/checkpoints/{cid2}/submit", json=body(new_ids)).status_code == 409


def test_checkpoint_failed_submit_needs_new_start(client, db, tree):
    cid = _due_checkpoint(client, db, tree)["checkpoint_id"]
    qs = client.post(f"{BASE}/checkpoints/{cid}/start").json()["questions"]
    wrong = {"answers": [{"question_id": q["question_id"], "chosen_answer": "B"} for q in qs]}
    assert client.post(f"{BASE}/checkpoints/{cid}/submit", json=wrong).json()["passed"] is False
    assert client.post(f"{BASE}/checkpoints/{cid}/submit", json=wrong).status_code == 409
