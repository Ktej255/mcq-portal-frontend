"""Exam-neutral GS LMS: exams table + migration, exam profiles, content check
and import per exam, funnel step skipping, exam-scoped subjects / search, and
the learner profile's exam."""

from __future__ import annotations

import copy
import importlib.util
import json
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
from app.api.v1.gs_lms import router as gs_lms_router
from app.core.config import settings
from app.core.gs.models import GsExam, GsReviewStatusEnum as RS, GsSubject
from app.core.gs_lms import exam_profiles as ep
from app.core.gs_lms import progression as prog
from app.core.gs_lms.content_check import check_subject_content
from app.core.gs_lms.funnel_engine import (
    StepDisabledError,
    StepNotReachableError,
    complete_step,
    get_funnel_state,
    is_funnel_complete,
)
from app.core.gs_lms.funnel_models import GsLmsFunnelProgress
from app.core.gs_lms.importer import DEFAULT_ARTIFACT_PATH, import_gs_subject
from app.core.gs_lms.models import (
    GsLmsConcept,
    GsLmsContentSection,
    GsLmsExamTypeEnum,
    GsLmsLearnerProfile,
    GsLmsNodeTypeEnum as NT,
    GsLmsQuestionTypeEnum,
    GsLmsSectionLabelEnum,
    GsLmsSyllabusNode,
)
from app.db.session import Base, get_db
from app.models.domain import RoleEnum, User

TEMPLATES = DEFAULT_ARTIFACT_PATH.parent / "templates"
NEET_TEMPLATE = TEMPLATES / "neet_subject_template.json"
UPSC_TEMPLATE = TEMPLATES / "gs_subject_template.json"
MIGRATION_PATH = (
    Path(__file__).resolve().parents[2] / "alembic" / "versions" / "p3d4e5f6a7b8_add_gs_exams.py"
)
API = "/api/v1/gs-lms"


class _Who:
    def __init__(self, id, role, email):
        self.id, self.role, self.email = id, role, email


STUDENT = _Who(1, RoleEnum.STUDENT, "s@test.local")
STUDENT2 = _Who(2, RoleEnum.STUDENT, "s2@test.local")


def _neet_template() -> dict:
    return json.loads(NEET_TEMPLATE.read_text(encoding="utf-8"))


def _leaf_of(data: dict) -> dict:
    return data["tree"][0]["children"][0]["children"][0]


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
        db.add_all([
            GsExam(code="upsc", name="UPSC", display_order=0, is_active=True),
            GsExam(code="neet", name="NEET", display_order=1, is_active=True),
            GsExam(code="jee", name="JEE", display_order=2, is_active=False),
        ])
        db.flush()
        exams = {e.code: e.id for e in db.query(GsExam)}
        db.add(GsSubject(id=1, slug="history", name="History", display_order=1, exam_id=exams["upsc"]))
        db.add(GsSubject(id=2, slug="neet-biology", name="NEET Biology", display_order=2, exam_id=exams["neet"]))
        db.add(GsSubject(id=3, slug="jee-maths", name="JEE Maths", display_order=3, exam_id=exams["jee"]))
        for i, email in enumerate(["s@test.local", "s2@test.local"], 1):
            db.add(User(id=i, email=email, full_name=f"U{i}", role=RoleEnum.STUDENT, google_uid=f"g{i}"))
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
    app_.include_router(gs_lms_router, prefix=API)

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


def _leaf(db, subject_id, title, labels, concept_title=None):
    m = GsLmsSyllabusNode(subject_id=subject_id, title=f"{title} mega", node_type=NT.MEGA_TOPIC,
                          display_order=1, review_status=RS.REVIEWED)
    db.add(m)
    db.flush()
    s = GsLmsSyllabusNode(subject_id=subject_id, title=f"{title} sub", node_type=NT.SUB_TOPIC,
                          parent_id=m.id, display_order=1, review_status=RS.REVIEWED)
    db.add(s)
    db.flush()
    leaf = GsLmsSyllabusNode(subject_id=subject_id, title=title, node_type=NT.LEAF_TOPIC,
                             parent_id=s.id, display_order=1, review_status=RS.REVIEWED)
    db.add(leaf)
    db.flush()
    for i, label in enumerate(labels):
        db.add(GsLmsContentSection(
            syllabus_node_id=leaf.id, section_label=GsLmsSectionLabelEnum(label), title=label,
            blocks=[{"type": "text", "content": "x"}], display_order=i,
            review_status=RS.REVIEWED, authored=True,
        ))
    if concept_title:
        db.add(GsLmsConcept(
            syllabus_node_id=leaf.id, title=concept_title, key_points=["alpha beta", "gamma delta"],
            display_order=1, review_status=RS.REVIEWED,
        ))
    db.flush()
    return leaf


# ---------------------------------------------------------------------------
# Migration
# ---------------------------------------------------------------------------

def _load_migration():
    spec = importlib.util.spec_from_file_location("p3d4e5f6a7b8", MIGRATION_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_migration_up_down_up_backfills_existing_subjects_to_upsc():
    mig = _load_migration()
    engine = create_engine("sqlite:///:memory:", future=True, poolclass=StaticPool,
                           connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    with engine.begin() as conn:
        with Operations.context(MigrationContext.configure(conn)):
            # Rewind to the schema before the exam concept (stamped at o2c3d4e5f6a7).
            mig.downgrade()
            insp = sa.inspect(conn)
            assert "gs_exams" not in insp.get_table_names()
            assert "exam_id" not in {c["name"] for c in insp.get_columns("gs_subjects")}
            assert "exam_code" not in {c["name"] for c in insp.get_columns("gs_lms_learner_profiles")}
            for sid, slug in ((1, "geography"), (2, "history")):
                conn.execute(sa.text(
                    "INSERT INTO gs_subjects (id, slug, name, display_order, is_complete, created_at, updated_at) "
                    "VALUES (:i, :s, :n, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"), {"i": sid, "s": slug, "n": slug})

            mig.upgrade()
            insp = sa.inspect(conn)
            cols = {c["name"]: c for c in insp.get_columns("gs_subjects")}
            assert cols["exam_id"]["nullable"] is False
            assert "exam_code" in {c["name"] for c in insp.get_columns("gs_lms_learner_profiles")}
            exams = {r[0]: (r[1], r[2]) for r in conn.execute(sa.text("SELECT code, is_active, id FROM gs_exams"))}
            assert set(exams) == {"upsc", "neet", "jee"}
            assert bool(exams["upsc"][0]) is True and not exams["neet"][0] and not exams["jee"][0]
            rows = conn.execute(sa.text("SELECT slug, exam_id FROM gs_subjects ORDER BY id")).fetchall()
            assert [r[0] for r in rows] == ["geography", "history"]
            assert {r[1] for r in rows} == {exams["upsc"][1]}
            assert any("exam_id" in fk["constrained_columns"] for fk in insp.get_foreign_keys("gs_subjects"))
            # slug stays globally unique
            assert any(i["unique"] and i["column_names"] == ["slug"] for i in insp.get_indexes("gs_subjects"))

            mig.upgrade()  # idempotent
            mig.downgrade()
            assert "gs_exams" not in sa.inspect(conn).get_table_names()
            assert conn.execute(sa.text("SELECT count(*) FROM gs_subjects")).scalar() == 2
            mig.upgrade()
            assert conn.execute(sa.text("SELECT count(*) FROM gs_subjects WHERE exam_id IS NOT NULL")).scalar() == 2


def test_migration_head_is_this_revision():
    from alembic.config import Config
    from alembic.script import ScriptDirectory

    root = Path(__file__).resolve().parents[2]
    cfg = Config(str(root / "alembic.ini"))
    cfg.set_main_option("script_location", str(root / "alembic"))
    script = ScriptDirectory.from_config(cfg)
    assert script.get_heads() == ["q4e5f6a7b8c9"]
    assert script.get_revision("p3d4e5f6a7b8").down_revision == "o2c3d4e5f6a7"


def test_subject_created_without_exam_defaults_to_upsc():
    engine = create_engine("sqlite:///:memory:", future=True, poolclass=StaticPool,
                           connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine, future=True)() as db:
        db.add(GsSubject(slug="economy", name="Economy"))
        db.commit()
        subject = db.query(GsSubject).one()
        assert subject.exam.code == "upsc"
        db.add(GsSubject(slug="polity", name="Polity"))
        db.commit()
        assert db.query(GsExam).count() == 1


# ---------------------------------------------------------------------------
# Profiles
# ---------------------------------------------------------------------------

def test_upsc_profile_reproduces_todays_constants():
    p = ep.get_profile("upsc")
    assert p.progression == prog.default_rules()
    assert p.progression.recall_pass_score == 0.5 and p.progression.recall_max_attempts == 3
    assert p.progression.topic_mcq_pass == 0.6 and p.progression.checkpoint_every == 3
    assert p.progression.checkpoint_min_leaves == 2 and p.progression.checkpoint_questions == 10
    assert p.progression.checkpoint_pass == 0.6
    assert p.enabled_funnel_steps == frozenset(range(1, 15)) and not p.disabled_funnel_steps
    assert set(p.section_labels) == {e.value for e in GsLmsSectionLabelEnum}
    assert p.pyq_exam_types == ("PRELIMS", "MAINS")
    assert set(p.question_types) == {
        "STATEMENT_BASED", "MATCH_THE_FOLLOWING", "ASSERTION_REASON", "MAP_BASED",
        "CAUSE_EFFECT", "CHRONOLOGICAL", "FACTUAL",
    }
    assert (p.default_marking.correct, p.default_marking.wrong, p.default_marking.unattempted) == (2, -0.66, 0)
    assert p.answer_writing_enabled is True
    assert prog.rules_for_subject(None, None) == prog.default_rules()


def test_neet_and_jee_profiles():
    neet, jee = ep.get_profile("neet"), ep.get_profile("jee")
    for p in (neet, jee):
        assert set(p.section_labels) == {"BASIC", "NCERT_LEVEL", "ADVANCED", "EXAMINER_TRAPS"}
        assert p.disabled_funnel_steps == frozenset({8, 9, 13})
        assert p.answer_writing_enabled is False
        assert p.unsupported_question_types == ()
        assert set(p.question_types) >= {"FACTUAL", "ASSERTION_REASON", "STATEMENT_BASED", "MATCH_THE_FOLLOWING"}
        assert p.supports_question_type("FACTUAL")
        assert (p.default_marking.correct, p.default_marking.wrong, p.default_marking.unattempted) == (4, -1, 0)
    # NEET is single-correct only; JEE also has numerical and multi-correct questions.
    assert not neet.supports_question_type("NUMERICAL") and not neet.supports_question_type("MULTI_CORRECT")
    assert jee.supports_question_type("NUMERICAL") and jee.supports_question_type("MULTI_CORRECT")
    assert neet.pyq_exam_types == ("NEET",)
    assert jee.pyq_exam_types == ("JEE_MAIN", "JEE_ADVANCED")
    # every profile value is a real enum value
    for p in ep.PROFILES.values():
        assert set(p.pyq_exam_types) <= {e.value for e in GsLmsExamTypeEnum}
        assert set(p.question_types) <= {e.value for e in GsLmsQuestionTypeEnum}
        assert set(p.section_labels) <= {e.value for e in GsLmsSectionLabelEnum}


def test_unknown_exam_rejected_and_overrides_are_safe():
    with pytest.raises(ep.UnknownExamError):
        ep.get_profile("gmat")
    assert ep.get_profile(None).code == "upsc" and ep.get_profile(" NEET ").code == "neet"
    base = ep.get_profile("neet")
    s = type("S", (), {"exam": type("E", (), {"code": "neet"})(), "config": {"exam_overrides": {
        "enabled_funnel_steps": [1, 2, 3, 14], "progression": {"checkpoint_every": 4, "topic_mcq_pass": -1},
        "section_labels": ["BASIC", "BOGUS"]}}})()
    eff = ep.profile_for_subject(s)
    assert eff.enabled_funnel_steps == frozenset({1, 2, 3, 14})
    assert eff.progression.checkpoint_every == 4 and eff.progression.topic_mcq_pass == 0.6
    assert eff.section_labels == base.section_labels  # invalid override ignored
    # step 14 must stay enabled
    s.config = {"exam_overrides": {"enabled_funnel_steps": [1, 2]}}
    assert ep.profile_for_subject(s).enabled_funnel_steps == base.enabled_funnel_steps
    # a subject whose exam has no profile behaves as UPSC
    s.exam = type("E", (), {"code": "mystery"})()
    s.config = None
    assert ep.profile_for_subject(s).code == "upsc"


# ---------------------------------------------------------------------------
# Content check and import
# ---------------------------------------------------------------------------

def test_neet_template_is_ready_under_neet_profile():
    data = _neet_template()
    report = check_subject_content(data)
    assert report.errors == [] and report.gaps == []
    assert report.ready and report.exam_code == "neet"
    assert (report.topics, report.mcqs, report.pyqs, report.sections) == (1, 15, 1, 4)
    assert report.summary()["exam"] == "neet"
    leaf = _leaf_of(data)
    assert {s["section_label"] for s in leaf["content_sections"]} == {"BASIC", "NCERT_LEVEL", "ADVANCED", "EXAMINER_TRAPS"}
    assert {m["question_type"] for m in leaf["mcq_questions"]} <= set(ep.get_profile("neet").question_types)
    assert leaf["pyqs"][0]["exam_type"] == "NEET" and "SAMPLE" in leaf["pyqs"][0]["question_text"]


def test_same_file_without_neet_exam_needs_current_affairs_under_upsc():
    data = _neet_template()
    data["exam"] = "upsc"
    report = check_subject_content(data)
    assert not report.ready
    assert any("CURRENT_AFFAIRS" in g for g in report.gaps)
    assert any("exam_type" in e and "PRELIMS or MAINS" in e for e in report.errors)  # NEET PYQ is not a UPSC type


def test_upsc_template_unchanged_and_summary_has_no_exam_key():
    report = check_subject_content(json.loads(UPSC_TEMPLATE.read_text(encoding="utf-8")))
    assert report.ready and report.exam_code == "upsc" and "exam" not in report.summary()


def test_checker_validates_per_exam_enums():
    data = _neet_template()
    leaf = _leaf_of(data)
    leaf["pyqs"][0]["exam_type"] = "PRELIMS"
    leaf["mcq_questions"][0]["question_type"] = "NUMERICAL"
    leaf["mcq_questions"][1]["question_type"] = "MAP_BASED"
    leaf["content_sections"].append({"section_label": "CURRENT_AFFAIRS", "blocks": [{"type": "para"}]})
    errors = check_subject_content(data).errors
    assert any("exam_type 'PRELIMS' must be NEET" in e for e in errors)
    assert any("NUMERICAL" in e and "must be one of" in e for e in errors)  # NEET is single-correct only
    assert any("MAP_BASED" in e for e in errors)
    assert any("section_label 'CURRENT_AFFAIRS'" in e for e in errors)

    jee = _neet_template()
    jee["exam"] = "jee"
    _leaf_of(jee)["pyqs"][0]["exam_type"] = "JEE_ADVANCED"
    assert check_subject_content(jee).ready

    upsc = json.loads(UPSC_TEMPLATE.read_text(encoding="utf-8"))
    _leaf_of(upsc)["mcq_questions"][0]["question_type"] = "NUMERICAL"
    assert any("NUMERICAL" in e for e in check_subject_content(upsc).errors)

    bogus = _neet_template()
    bogus["exam"] = "gmat"
    assert any("Unknown exam" in e for e in check_subject_content(bogus).errors)


def test_import_refused_when_file_exam_differs_from_subject_exam(db):
    neet_file = _neet_template()
    neet_file["subject_slug"] = "history"  # a UPSC subject
    with pytest.raises(ValueError, match="exam 'neet'.*'history'.*'upsc'"):
        import_gs_subject(db, neet_file)
    assert db.query(GsLmsSyllabusNode).count() == 0

    upsc_file = json.loads(UPSC_TEMPLATE.read_text(encoding="utf-8"))
    upsc_file["subject_slug"] = "neet-biology"
    with pytest.raises(ValueError, match="exam 'upsc'"):
        import_gs_subject(db, upsc_file)
    assert db.query(GsLmsSyllabusNode).count() == 0


def test_neet_file_imports_into_neet_subject_and_subject_is_complete(db):
    result = import_gs_subject(db, _neet_template(), review_status="REVIEWED")
    db.commit()
    subject = db.query(GsSubject).filter_by(slug="neet-biology").one()
    assert result["topics_ready"] == "1/1"
    assert subject.is_complete is True and subject.completeness_status["exam"] == "neet"
    from app.core.gs_lms.models import GsLmsPyq
    assert db.query(GsLmsPyq).one().exam_type == GsLmsExamTypeEnum.NEET


# ---------------------------------------------------------------------------
# Funnel
# ---------------------------------------------------------------------------

def test_neet_funnel_skips_disabled_steps_and_reaches_step_14(db):
    leaf = _leaf(db, 2, "Cell", ["BASIC", "NCERT_LEVEL", "ADVANCED", "EXAMINER_TRAPS"])
    db.commit()
    enabled = ep.get_profile("neet").enabled_funnel_steps
    state = get_funnel_state(db, 1, leaf.id, enabled)
    assert state.current_step == 1 and not is_funnel_complete(state)

    order = []
    for _ in range(11):
        step = get_funnel_state(db, 1, leaf.id, enabled).current_step
        order.append(step)
        complete_step(db, 1, leaf.id, step, enabled)
    assert order == [1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 14]
    final = get_funnel_state(db, 1, leaf.id, enabled)
    assert final.current_step == 15 and is_funnel_complete(final)
    assert final.completed_steps == frozenset(enabled)
    # no rows were stored for the skipped steps
    stored = {r.step_number for r in db.query(GsLmsFunnelProgress).filter_by(syllabus_node_id=leaf.id)}
    assert stored == set(enabled) and not stored & {8, 9, 13}
    # step 14 completed => the topic counts as completed for progression
    assert prog.completed_topic_ids(db, 1, [leaf.id]) == {leaf.id}


def test_disabled_step_cannot_be_completed_and_upsc_is_unchanged(db):
    leaf = _leaf(db, 2, "Cell", ["BASIC"])
    db.commit()
    enabled = ep.get_profile("neet").enabled_funnel_steps
    for step in range(1, 8):
        complete_step(db, 1, leaf.id, step, enabled)
    with pytest.raises(StepDisabledError):
        complete_step(db, 1, leaf.id, 8, enabled)
    assert issubclass(StepDisabledError, StepNotReachableError)
    # Without enabled_steps (UPSC), step 8 is the next step.
    assert get_funnel_state(db, 1, leaf.id).current_step == 8
    assert get_funnel_state(db, 1, leaf.id).enabled_steps == frozenset(range(1, 15))


def test_funnel_endpoints_report_enabled_steps(client, db):
    hist = _leaf(db, 1, "Plassey", ["BASIC"])
    cell = _leaf(db, 2, "Cell", ["BASIC"])
    db.commit()
    upsc = client.get(f"{API}/history/funnel/{hist.id}/state").json()
    assert upsc["enabled_steps"] == list(range(1, 15)) and upsc["current_step"] == 1
    neet = client.get(f"{API}/neet-biology/funnel/{cell.id}/state").json()
    assert neet["enabled_steps"] == [1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 14]
    for step in range(1, 8):
        r = client.post(f"{API}/neet-biology/funnel/{cell.id}/complete-step", json={"step": step})
        assert r.status_code == 200, r.text
    assert r.json()["current_step"] == 10
    assert client.post(f"{API}/neet-biology/funnel/{cell.id}/complete-step", json={"step": 8}).status_code == 409


def test_recall_gate_uses_subject_profile_rules(db, monkeypatch):
    monkeypatch.setattr(settings, "GS_LMS_ENFORCE_PROGRESSION", True)
    subject = db.get(GsSubject, 2)
    subject.config = {"exam_overrides": {"progression": {"recall_max_attempts": 1}}}
    leaf = _leaf(db, 2, "Cell", ["BASIC"])
    from app.core.gs_lms.funnel_models import GsLmsRecallAttempt
    db.add(GsLmsRecallAttempt(student_id=1, syllabus_node_id=leaf.id, section_label="BASIC",
                              recall_score=0.1, confidence_score=0.1))
    db.commit()
    # one attempt is enough for this subject (UPSC would need three)
    prog.check_step_gate(db, 1, leaf.id, 3)
    other = _leaf(db, 1, "Plassey", ["BASIC"])
    db.add(GsLmsRecallAttempt(student_id=1, syllabus_node_id=other.id, section_label="BASIC",
                              recall_score=0.1, confidence_score=0.1))
    db.commit()
    with pytest.raises(prog.StepGateError):
        prog.check_step_gate(db, 1, other.id, 3)


# ---------------------------------------------------------------------------
# Exams, subjects, search, profile
# ---------------------------------------------------------------------------

def test_exams_endpoint_lists_active_exams_only(client):
    r = client.get(f"{API}/exams")
    assert r.status_code == 200
    assert [e["code"] for e in r.json()] == ["upsc", "neet"]
    assert r.json()[1]["name"] == "NEET"


def test_subjects_scoped_to_students_exam_and_exam_param(client, db, who):
    # UPSC student (no profile): exactly the UPSC subjects, in the pre-exam shape.
    listing = client.get(f"{API}/subjects").json()
    assert [s["slug"] for s in listing] == ["history"]
    assert "exam" not in listing[0]
    neet = client.get(f"{API}/subjects", params={"exam": "neet"}).json()
    assert [(s["slug"], s["exam"]) for s in neet] == [("neet-biology", "neet")]
    assert client.get(f"{API}/subjects", params={"exam": "gmat"}).status_code == 404
    # A NEET student sees NEET subjects by default.
    assert client.put(f"{API}/profile", json={"exam_code": "neet"}).status_code == 200
    assert [s["slug"] for s in client.get(f"{API}/subjects").json()] == ["neet-biology"]
    assert [s["slug"] for s in client.get(f"{API}/subjects", params={"exam": "upsc"}).json()] == ["history"]


def test_study_search_and_next_do_not_mix_exams(client, db, who):
    _leaf(db, 1, "Cell wall history", ["BASIC"], "Cell structure story")
    _leaf(db, 2, "Cell wall biology", ["BASIC"], "Cell structure basics")
    db.commit()
    study = f"{API}/study"

    def slugs(q):
        return {h["subject_slug"] for h in client.get(f"{study}/search", params={"q": q}).json()["data"]}

    assert slugs("cell structure") == {"history"}
    client.put(f"{API}/profile", json={"exam_code": "neet"})
    assert slugs("cell structure") == {"neet-biology"}
    assert client.get(f"{study}/next").json()["data"]["subject_slug"] == "neet-biology"
    # An explicit subject still wins.
    explicit = client.get(f"{study}/search", params={"q": "cell structure", "subject": "history"}).json()["data"]
    assert {h["subject_slug"] for h in explicit} == {"history"}


def test_books_scoped_to_students_exam(client, db):
    from app.core.gs_lms.models import GsLmsBook
    db.add(GsLmsBook(slug="polity-b", title="Polity", author="A", edition="1", exam_tag="UPSC"))
    db.add(GsLmsBook(slug="bio-b", title="Biology", author="B", edition="1", exam_tag="NEET"))
    db.commit()
    assert [b["slug"] for b in client.get(f"{API}/books").json()["data"]] == ["polity-b"]
    client.put(f"{API}/profile", json={"exam_code": "neet"})
    assert [b["slug"] for b in client.get(f"{API}/books").json()["data"]] == ["bio-b"]


def test_profile_exam_code_round_trip_and_validation(client, db):
    base = client.get(f"{API}/profile").json()["data"]
    assert "exam_code" not in base  # unset: UPSC, and the pre-exam response shape is unchanged
    r = client.put(f"{API}/profile", json={"exam_code": "NEET", "study_path": "MIXED"})
    assert r.status_code == 200, r.text
    assert r.json()["data"]["exam_code"] == "neet"
    assert client.get(f"{API}/profile").json()["data"]["exam_code"] == "neet"
    # Saving reading preferences without exam_code keeps the exam.
    client.put(f"{API}/profile", json={"study_path": "COACHING"})
    data = client.get(f"{API}/profile").json()["data"]
    assert data["exam_code"] == "neet" and data["study_path"] == "COACHING"
    # Unknown or inactive exams are rejected.
    assert client.put(f"{API}/profile", json={"exam_code": "gmat"}).status_code == 422
    assert client.put(f"{API}/profile", json={"exam_code": "jee"}).status_code == 422
    assert client.get(f"{API}/profile").json()["data"]["exam_code"] == "neet"
    # Explicit null resets to the default.
    client.put(f"{API}/profile", json={"exam_code": None})
    assert "exam_code" not in client.get(f"{API}/profile").json()["data"]
    db.expire_all()
    assert db.query(GsLmsLearnerProfile).one().exam_code is None


def test_pyq_exam_type_filter_follows_subject_profile(client, db):
    from app.core.gs_lms.models import GsLmsPyq
    leaf = _leaf(db, 2, "Cell", ["BASIC"])
    db.add(GsLmsPyq(subject_id=2, syllabus_node_id=leaf.id, exam_type=GsLmsExamTypeEnum.NEET, year=2020,
                    question_text="q", review_status=RS.REVIEWED))
    hleaf = _leaf(db, 1, "Plassey", ["BASIC"])
    db.commit()
    ok = client.get(f"{API}/neet-biology/topics/{leaf.id}/pyqs", params={"exam_type": "neet"})
    assert ok.status_code == 200, ok.text
    bad = client.get(f"{API}/neet-biology/topics/{leaf.id}/pyqs", params={"exam_type": "PRELIMS"})
    assert bad.status_code == 422 and bad.json()["detail"] == "exam_type must be NEET"
    upsc_bad = client.get(f"{API}/history/topics/{hleaf.id}/pyqs", params={"exam_type": "NEET"})
    assert upsc_bad.status_code == 422 and upsc_bad.json()["detail"] == "exam_type must be PRELIMS or MAINS"
