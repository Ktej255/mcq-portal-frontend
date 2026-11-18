"""NEET/JEE question formats (single / multi-correct / numerical) for topic MCQs:
scoring and marking schemes, the content checker, the importer, spreadsheets,
the MCQ lab and checkpoint endpoints, and the migration."""

from __future__ import annotations

import copy
import csv
import importlib.util
import json
import math
from pathlib import Path
from types import SimpleNamespace

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
from app.core.gs.models import GsExam, GsReviewStatusEnum, GsSubject
from app.core.gs_lms import exam_profiles as ep
from app.core.gs_lms import scoring
from app.core.gs_lms import sheets
from app.core.gs_lms.content_check import check_subject_content
from app.core.gs_lms.funnel_models import GsLmsCheckpoint, GsLmsMcqLabAttempt
from app.core.gs_lms.importer import import_gs_subject
from app.core.gs_lms.models import GsLmsMcqQuestion, GsLmsNodeTypeEnum, GsLmsSyllabusNode
from app.core.gs_lms.scoring import Response, grade, marks_for
from app.db.session import Base, get_db
from app.models.domain import RoleEnum, User

TEMPLATES = Path(__file__).resolve().parents[1] / "core" / "gs_lms" / "data" / "templates"
JEE_TEMPLATE = TEMPLATES / "jee_subject_template.json"
NEET_TEMPLATE = TEMPLATES / "neet_subject_template.json"
UPSC_TEMPLATE = TEMPLATES / "gs_subject_template.json"
MIGRATION_PATH = Path(__file__).resolve().parents[2] / "alembic" / "versions" / "q4e5f6a7b8c9_add_mcq_question_formats.py"


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _leaf_of(data: dict) -> dict:
    return data["tree"][0]["children"][0]["children"][0]


def _q(qtype: str = "FACTUAL", **kw):
    """A question-like object (scoring only reads attributes)."""
    base = dict(question_type=qtype, correct_option=None, correct_options=None, numeric_answer=None, numeric_tolerance=None)
    base.update(kw)
    return SimpleNamespace(**base)


SINGLE_Q = _q(correct_option="B")
MULTI_Q = _q("MULTI_CORRECT", correct_option="A,C,D", correct_options=["A", "C", "D"])
NUM_Q = _q("NUMERICAL", correct_option="12.5", numeric_answer=12.5, numeric_tolerance=0.0)

UPSC = ep.get_profile("upsc")
NEET = ep.get_profile("neet")
JEE = ep.get_profile("jee")
JEE_ADV = ep.apply_overrides(JEE, {"exam_overrides": {"marking_paper": "JEE_ADVANCED"}})


# ---------------------------------------------------------------------------
# Scoring: formats and correctness
# ---------------------------------------------------------------------------

def test_answer_format_of():
    assert scoring.answer_format_of(SINGLE_Q) == "single"
    assert scoring.answer_format_of(MULTI_Q) == "multi"
    assert scoring.answer_format_of(NUM_Q) == "numerical"
    assert scoring.answer_format_of(_q("ASSERTION_REASON")) == "single"
    from app.core.gs_lms.models import GsLmsQuestionTypeEnum as T
    assert scoring.answer_format_of(_q(T.NUMERICAL)) == "numerical"
    assert scoring.answer_format_of(_q(None)) == "single"


def test_single_correctness_is_case_and_space_insensitive():
    assert scoring.is_correct(SINGLE_Q, Response(option="B"))
    assert scoring.is_correct(SINGLE_Q, Response(option=" b "))
    assert not scoring.is_correct(SINGLE_Q, Response(option="A"))
    assert not scoring.is_correct(SINGLE_Q, Response(option="B,C"))
    assert not scoring.is_correct(SINGLE_Q, None)
    assert not scoring.is_correct(SINGLE_Q, Response())
    assert not scoring.is_correct(SINGLE_Q, Response(numeric=2))


@pytest.mark.parametrize("options,expected", [
    (["A", "C", "D"], True),
    (["d", "a", "c"], True),
    (["A", "A", "C", "D"], True),     # duplicates collapse
    ("A,C,D", True),
    ("ACD", True),
    (["A", "C"], False),              # subset
    (["A", "B", "C", "D"], False),    # superset
    (["A", "C", "Z"], False),
    ([], False),
    (None, False),
])
def test_multi_correctness_needs_the_exact_set(options, expected):
    assert scoring.is_correct(MULTI_Q, Response(options=options)) is expected


def test_multi_uses_joined_correct_option_when_list_missing():
    q = _q("MULTI_CORRECT", correct_option="A,C", correct_options=None)
    assert scoring.is_correct(q, Response(options=["C", "A"]))


@pytest.mark.parametrize("given,tol,expected", [
    (12.5, 0.0, True),
    (12.504, 0.0, True),     # exact after rounding to 2 decimals
    (12.496, 0.0, True),
    (12.51, 0.0, False),
    (12.6, 0.1, True),
    (12.61, 0.1, False),
    ("12.5", 0.0, True),     # numeric text
    (" 12.50 ", 0.0, True),
    (-12.5, 0.0, False),
    (float("nan"), 0.0, False),
    (float("inf"), 0.0, False),
    (float("-inf"), 0.0, False),
    ("abc", 0.0, False),
    ("", 0.0, False),
    (None, 0.0, False),
    (True, 0.0, False),
    ([12.5], 0.0, False),
    ({"a": 1}, 0.0, False),
])
def test_numerical_tolerance_and_garbage(given, tol, expected):
    q = _q("NUMERICAL", correct_option="12.5", numeric_answer=12.5, numeric_tolerance=tol)
    assert scoring.is_correct(q, Response(numeric=given)) is expected


def test_numerical_negative_answer_and_corrupt_question_do_not_crash():
    neg = _q("NUMERICAL", numeric_answer=-5.0, correct_option="-5")
    assert scoring.is_correct(neg, Response(numeric=-5)) and not scoring.is_correct(neg, Response(numeric=5))
    broken = _q("NUMERICAL", numeric_answer=None, correct_option="oops")
    assert not scoring.is_correct(broken, Response(numeric=1))
    nan_answer = _q("NUMERICAL", numeric_answer=float("nan"), correct_option="nan")
    assert not scoring.is_correct(nan_answer, Response(numeric=1))


def test_response_text_round_trip():
    assert scoring.response_text(SINGLE_Q, Response(option="b")) == "b"
    assert scoring.response_text(MULTI_Q, Response(options=["D", "A", "A"])) == "A,D"
    assert scoring.response_text(NUM_Q, Response(numeric=3.0)) == "3"
    assert scoring.response_text(NUM_Q, Response(numeric="junk")) == "junk"
    assert scoring.response_text(NUM_Q, None) == "" and scoring.response_text(SINGLE_Q, Response()) == ""
    assert scoring.response_from_text(MULTI_Q, "A,D") == Response(options=["A", "D"])
    assert scoring.response_from_text(NUM_Q, "") is None
    assert scoring.correct_answer_text(MULTI_Q) == "A,C,D" and scoring.correct_answer_text(NUM_Q) == "12.5"
    assert scoring.stored_correct_option("multi", correct_options=["C", "A"]) == "A,C"
    assert scoring.stored_correct_option("numerical", numeric_answer=-2.0) == "-2"
    assert scoring.stored_correct_option("single", correct_option=" b ") == "B"


# ---------------------------------------------------------------------------
# Scoring: marking schemes
# ---------------------------------------------------------------------------

def _marks(profile, q, response):
    return marks_for(q, response, profile.scheme_for(scoring.answer_format_of(q)))


def test_upsc_marking_is_unchanged():
    s = UPSC.scheme_for("single")
    assert (s.correct, s.wrong, s.unattempted) == (2, -0.66, 0)
    assert (UPSC.default_marking.correct, UPSC.default_marking.wrong) == (2, -0.66)
    assert _marks(UPSC, SINGLE_Q, Response(option="B")) == 2
    assert _marks(UPSC, SINGLE_Q, Response(option="A")) == -0.66
    assert _marks(UPSC, SINGLE_Q, None) == 0


def test_neet_marking_is_plus4_minus1():
    assert [_marks(NEET, SINGLE_Q, r) for r in (Response(option="B"), Response(option="C"), None)] == [4, -1, 0]
    s = NEET.scheme_for("single")
    assert (s.correct, s.wrong, s.unattempted) == (4, -1, 0)


def test_jee_main_single_and_numerical():
    paper = ep.apply_overrides(JEE, {"exam_overrides": {"marking_paper": "JEE_MAIN"}})
    assert paper.marking_paper == "JEE_MAIN"
    for profile in (JEE, paper):
        assert [_marks(profile, SINGLE_Q, r) for r in (Response(option="B"), Response(option="D"), None)] == [4, -1, 0]
        assert [_marks(profile, NUM_Q, r) for r in (Response(numeric=12.5), Response(numeric=1), None)] == [4, -1, 0]
        assert _marks(profile, NUM_Q, Response(numeric=float("nan"))) == -1  # an attempt, wrong


def test_jee_advanced_single_and_numerical():
    assert [_marks(JEE_ADV, SINGLE_Q, r) for r in (Response(option="B"), Response(option="A"), None)] == [3, -1, 0]
    assert [_marks(JEE_ADV, NUM_Q, r) for r in (Response(numeric=12.5), Response(numeric=9), None)] == [3, 0, 0]


@pytest.mark.parametrize("correct,chosen,expected", [
    # all correct options chosen: +4
    (["A", "B", "C", "D"], ["A", "B", "C", "D"], 4),
    (["A", "C"], ["C", "A"], 4),
    (["B"], ["B"], 4),
    # only correct options chosen, not all: +1 per option chosen (2023 style)
    (["A", "B", "C", "D"], ["A", "B", "C"], 3),
    (["A", "B", "C", "D"], ["B", "D"], 2),
    (["A", "B", "C", "D"], ["C"], 1),
    (["A", "B", "C"], ["A", "C"], 2),
    (["A", "B", "C"], ["B"], 1),
    (["A", "C"], ["A"], 1),
    # any wrong option: -2
    (["A", "C"], ["A", "B"], -2),
    (["A", "C"], ["A", "C", "D"], -2),
    (["A", "C"], ["B"], -2),
    (["A", "B", "C"], ["A", "B", "D"], -2),
    (["A"], ["A", "B"], -2),
    (["A", "C"], ["A", "Z"], -2),
    # unanswered: 0
    (["A", "C"], [], 0),
    (["A", "C"], None, 0),
])
def test_jee_advanced_multi_correct(correct, chosen, expected):
    q = _q("MULTI_CORRECT", correct_options=correct, correct_option=",".join(correct))
    response = None if chosen is None else Response(options=chosen)
    assert _marks(JEE_ADV, q, response) == expected
    assert (expected == 4) == scoring.is_correct(q, response)  # full marks iff correct


def test_jee_default_paper_scores_multi_with_the_advanced_scheme():
    q = _q("MULTI_CORRECT", correct_options=["A", "B"], correct_option="A,B")
    assert [_marks(JEE, q, Response(options=o)) for o in (["A", "B"], ["A"], ["C"], [])] == [4, 1, -2, 0]


def test_a_scheme_without_partial_credit_marks_a_subset_wrong():
    flat = ep.MarkingScheme(4, -1, 0)
    q = _q("MULTI_CORRECT", correct_options=["A", "B"], correct_option="A,B")
    assert marks_for(q, Response(options=["A"]), flat) == -1


def test_scheme_for_falls_back_to_single_and_profile_exposes_formats():
    assert NEET.scheme_for("numerical") == NEET.scheme_for("single")
    public = JEE.to_public()["format_marking"]
    assert set(public) == {"default", "JEE_MAIN", "JEE_ADVANCED"}
    assert public["JEE_ADVANCED"]["multi"]["partial_per_correct_option"] == 1
    assert ep.apply_overrides(JEE, {"exam_overrides": {"marking_paper": "NOPE"}}).marking_paper == "default"


def test_grade_and_summary():
    g = [grade(SINGLE_Q, Response(option="A"), NEET), grade(SINGLE_Q, Response(option="B"), NEET)]
    assert scoring.marks_summary(NEET, g) == {
        "marks_total": 3, "marks_max": 8,
        "marking_scheme": {"single": {"correct": 4, "wrong": -1, "unattempted": 0}},
    }
    assert scoring.include_marks(None, ["single"]) is False
    assert scoring.include_marks("upsc", ["single", "multi"]) is True
    assert scoring.include_marks("neet", ["single"]) is True


# ---------------------------------------------------------------------------
# Content checker
# ---------------------------------------------------------------------------

def test_jee_template_is_ready_under_jee():
    data = _load(JEE_TEMPLATE)
    report = check_subject_content(data)
    assert report.errors == [] and report.gaps == []
    assert report.ready and report.exam_code == "jee" and report.mcqs == 15
    leaf = _leaf_of(data)
    formats = [scoring.answer_format_of(SimpleNamespace(question_type=q["question_type"])) for q in leaf["mcq_questions"]]
    assert {f: formats.count(f) for f in ("single", "multi", "numerical")} == {"single": 7, "multi": 4, "numerical": 4}
    assert len(leaf["pyqs"]) == 1 and leaf["pyqs"][0]["year"] == 0 and "SAMPLE" in leaf["pyqs"][0]["question_text"]


def test_jee_template_answers_are_well_formed():
    for q in _leaf_of(_load(JEE_TEMPLATE))["mcq_questions"]:
        fmt = scoring.answer_format_of(SimpleNamespace(question_type=q["question_type"]))
        if fmt == "single":
            assert q["correct_option"] in "ABCD" and len(q["options"]) == 4
        elif fmt == "multi":
            assert len(q["options"]) == 4 and q["correct_options"] == sorted(set(q["correct_options"]))
        else:
            assert q["options"] == [] and math.isfinite(q["numeric_answer"])


def _jee_with(question: dict) -> dict:
    data = _load(JEE_TEMPLATE)
    _leaf_of(data)["mcq_questions"][0] = question
    return data


def _numerical(**over) -> dict:
    q = {"question_text": "N?", "options": [], "numeric_answer": 4, "explanation": "e", "question_type": "NUMERICAL"}
    q.update(over)
    return q


def _multi(**over) -> dict:
    q = {
        "question_text": "M?", "explanation": "e", "question_type": "MULTI_CORRECT", "correct_options": ["A", "C"],
        "options": [{"label": l, "text": t} for l, t in zip("ABCD", ["a", "b", "c", "d"])],
    }
    q.update(over)
    return q


def test_checker_accepts_valid_multi_and_numerical_for_jee():
    for q in (_numerical(), _numerical(numeric_tolerance=0.5), _numerical(numeric_answer=-3.25), _numerical(options=None),
              _multi(), _multi(correct_options=["B"]), _multi(correct_options=["A", "B", "C", "D"])):
        assert check_subject_content(_jee_with(q)).errors == [], q


@pytest.mark.parametrize("bad", [
    _numerical(numeric_answer=None), _numerical(numeric_answer="4"), _numerical(numeric_answer=float("nan")),
    _numerical(numeric_answer=float("inf")), _numerical(numeric_answer=True),
    _numerical(numeric_tolerance=-1), _numerical(numeric_tolerance="x"),
    _numerical(options=[{"label": "A", "text": "x"}]),
    _multi(correct_options=[]), _multi(correct_options=None), _multi(correct_options="AC"),
    _multi(correct_options=["A", "A"]), _multi(correct_options=["A", "E"]), _multi(correct_options=["a"]),
    _multi(options=[{"label": "A", "text": "a"}]),
])
def test_checker_rejects_malformed_multi_and_numerical(bad):
    assert check_subject_content(_jee_with(bad)).errors


@pytest.mark.parametrize("q", [_numerical(), _multi()])
def test_neet_and_upsc_reject_the_new_formats(q):
    neet = _load(NEET_TEMPLATE)
    _leaf_of(neet)["mcq_questions"][0] = q
    assert any(q["question_type"] in e and "must be one of" in e for e in check_subject_content(neet).errors)
    upsc = _load(UPSC_TEMPLATE)
    _leaf_of(upsc)["mcq_questions"][0] = q
    assert any(q["question_type"] in e for e in check_subject_content(upsc).errors)


def test_single_correct_still_needs_a_valid_correct_option_under_every_exam():
    data = _load(JEE_TEMPLATE)
    _leaf_of(data)["mcq_questions"][0]["correct_option"] = "E"
    assert any("correct_option" in e for e in check_subject_content(data).errors)


# ---------------------------------------------------------------------------
# Database fixtures
# ---------------------------------------------------------------------------

STUDENT = SimpleNamespace(id=1, role=RoleEnum.STUDENT, email="s@test.local")


@pytest.fixture()
def session_factory():
    engine = create_engine("sqlite:///:memory:", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    with SessionLocal() as db:
        db.add_all([
            GsExam(code="upsc", name="UPSC", display_order=0, is_active=True),
            GsExam(code="neet", name="NEET", display_order=1, is_active=True),
            GsExam(code="jee", name="JEE", display_order=2, is_active=True),
        ])
        db.flush()
        ids = {e.code: e.id for e in db.query(GsExam)}
        db.add_all([
            GsSubject(id=1, slug="polity-governance", name="Polity", display_order=1, exam_id=ids["upsc"]),
            GsSubject(id=2, slug="neet-biology", name="NEET Biology", display_order=2, exam_id=ids["neet"]),
            GsSubject(id=3, slug="jee-maths", name="JEE Maths", display_order=3, exam_id=ids["jee"]),
        ])
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
    app_.include_router(gs_lms_router, prefix="/api/v1/gs-lms")

    def _db():
        s = session_factory()
        try:
            yield s
        finally:
            s.close()

    app_.dependency_overrides[get_db] = _db
    app_.dependency_overrides[get_current_user] = lambda: STUDENT
    return TestClient(app_)


def _import(db, template: Path, slug: str, status: str = "REVIEWED") -> dict:
    data = _load(template)
    data["subject_slug"] = slug
    import_gs_subject(db, data, review_status=status)
    db.commit()
    return data


def _leaf_node(db, slug: str) -> GsLmsSyllabusNode:
    subject = db.query(GsSubject).filter_by(slug=slug).one()
    return db.query(GsLmsSyllabusNode).filter_by(subject_id=subject.id, node_type=GsLmsNodeTypeEnum.LEAF_TOPIC).one()


# ---------------------------------------------------------------------------
# Importer
# ---------------------------------------------------------------------------

def test_importer_round_trips_the_new_fields(db):
    _import(db, JEE_TEMPLATE, "jee-maths", "UNREVIEWED")
    rows = {q.question_text: q for q in db.query(GsLmsMcqQuestion).all()}
    assert len(rows) == 15
    multi = next(q for q in rows.values() if q.question_text.startswith("Which of the following equations"))
    assert multi.correct_options == ["B", "C"] and multi.correct_option == "B,C"
    assert multi.numeric_answer is None and len(multi.options) == 4
    num = next(q for q in rows.values() if q.question_text.startswith("If alpha and beta are the roots of x^2 - 5x + 6"))
    assert num.numeric_answer == 0.83 and num.numeric_tolerance == 0.005 and num.correct_option == "0.83" and num.options == []
    other = next(q for q in rows.values() if q.question_text.startswith("Find the minimum value"))
    assert other.numeric_answer == -5 and other.correct_option == "-5" and other.numeric_tolerance == 0.0
    single = next(q for q in rows.values() if q.question_text.startswith("The sum of the roots of 3x^2"))
    assert (single.correct_option, single.correct_options, single.numeric_answer, single.numeric_tolerance) == ("A", None, None, None)


def test_reimport_keeps_review_status_and_compares_the_new_fields(db):
    data = _import(db, JEE_TEMPLATE, "jee-maths", "UNREVIEWED")
    for q in db.query(GsLmsMcqQuestion).all():
        q.review_status = GsReviewStatusEnum.REVIEWED
    db.commit()

    import_gs_subject(db, copy.deepcopy(data))
    db.commit()
    assert {q.review_status for q in db.query(GsLmsMcqQuestion)} == {GsReviewStatusEnum.REVIEWED}

    def reset(mutate) -> list[str]:
        import_gs_subject(db, copy.deepcopy(data))  # back to the original content
        for q in db.query(GsLmsMcqQuestion).all():
            q.review_status = GsReviewStatusEnum.REVIEWED
        db.commit()
        edited = copy.deepcopy(data)
        mutate(_leaf_of(edited)["mcq_questions"])
        import_gs_subject(db, edited)
        db.commit()
        db.expire_all()
        return [q.question_text[:40] for q in db.query(GsLmsMcqQuestion) if q.review_status != GsReviewStatusEnum.REVIEWED]

    def find(qs, kind):
        return next(q for q in qs if q["question_type"] == kind)

    assert len(reset(lambda qs: find(qs, "NUMERICAL").update(numeric_answer=find(qs, "NUMERICAL")["numeric_answer"] + 1))) == 1
    assert len(reset(lambda qs: find(qs, "NUMERICAL").update(numeric_tolerance=0.5))) == 1
    assert len(reset(lambda qs: find(qs, "MULTI_CORRECT").update(correct_options=["A", "D"]))) == 1
    assert len(reset(lambda qs: find(qs, "MULTI_CORRECT")["options"][0].update(text="changed"))) == 1
    assert reset(lambda qs: None) == []


def test_importer_refuses_a_jee_file_for_a_neet_subject(db):
    data = _load(JEE_TEMPLATE)
    data["subject_slug"] = "neet-biology"
    with pytest.raises(ValueError):
        import_gs_subject(db, data)


# ---------------------------------------------------------------------------
# Spreadsheets
# ---------------------------------------------------------------------------

def _jee_without_mcqs() -> dict:
    data = _load(JEE_TEMPLATE)
    _leaf_of(data)["mcq_questions"] = []
    return data


def _write_mcq_sheet(folder: Path, rows: list[dict]) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    with (folder / "mcqs.csv").open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=sheets.MCQ_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)


TITLE = "Quadratic Equations: roots and discriminant"
OPTS = {"option_a": "a", "option_b": "b", "option_c": "c", "option_d": "d"}


def test_template_has_the_new_mcq_columns(tmp_path):
    assert sheets.MCQ_COLUMNS[-3:] == ["correct_options", "numeric_answer", "numeric_tolerance"]
    sheets.write_templates(_jee_without_mcqs(), tmp_path)
    header = (tmp_path / "mcqs.csv").read_text(encoding="utf-8-sig").splitlines()[0].split(",")
    assert header == sheets.MCQ_COLUMNS


def test_sheet_rows_build_multi_and_numerical_questions(tmp_path):
    _write_mcq_sheet(tmp_path, [
        {"topic_title": TITLE, "question_text": "Multi?", "question_type": "MULTI_CORRECT", "correct_options": "C;A", "explanation": "e", **OPTS},
        {"topic_title": TITLE, "question_text": "Num?", "question_type": "NUMERICAL", "numeric_answer": "-2.5", "numeric_tolerance": "0.1", "explanation": "e"},
        {"topic_title": TITLE, "question_text": "Num2?", "question_type": "NUMERICAL", "numeric_answer": "7", "explanation": "e"},
        {"topic_title": TITLE, "question_text": "Single?", "correct_option": "d", "explanation": "e", **OPTS},
    ])
    result = sheets.build_from_dir(_jee_without_mcqs(), tmp_path)
    assert result.problems == [] and result.counts["mcqs.csv"] == 4
    built = {q["question_text"]: q for q in _leaf_of(result.data)["mcq_questions"]}
    assert built["Multi?"]["correct_options"] == ["A", "C"] and built["Multi?"]["correct_option"] == "A,C"
    assert built["Num?"]["numeric_answer"] == -2.5 and built["Num?"]["numeric_tolerance"] == 0.1 and built["Num?"]["options"] == []
    assert "numeric_tolerance" not in built["Num2?"] and built["Num2?"]["correct_option"] == "7"
    assert built["Single?"]["correct_option"] == "D" and "correct_options" not in built["Single?"]
    assert check_subject_content(result.data).errors == []


def test_bad_sheet_rows_are_reported_with_row_numbers(tmp_path):
    _write_mcq_sheet(tmp_path, [
        {"topic_title": TITLE, "question_text": "m1", "question_type": "MULTI_CORRECT", "correct_options": "", **OPTS},
        {"topic_title": TITLE, "question_text": "m2", "question_type": "MULTI_CORRECT", "correct_options": "A;E", **OPTS},
        {"topic_title": TITLE, "question_text": "n1", "question_type": "NUMERICAL", "numeric_answer": "abc"},
        {"topic_title": TITLE, "question_text": "n2", "question_type": "NUMERICAL", "numeric_answer": "1", "numeric_tolerance": "-1"},
        {"topic_title": TITLE, "question_text": "n3", "question_type": "NUMERICAL", "numeric_answer": "nan"},
    ])
    result = sheets.build_from_dir(_jee_without_mcqs(), tmp_path)
    assert result.counts["mcqs.csv"] == 0 and len(result.problems) == 5
    for number, problem in zip(range(2, 7), result.problems):
        assert f"mcqs.csv, row {number}" in problem


# ---------------------------------------------------------------------------
# MCQ lab
# ---------------------------------------------------------------------------

LAB = "/api/v1/gs-lms/{slug}/funnel/{node}/mcq-lab"
LEAK_WORDS = ("correct_option", "correct_options", "numeric_answer", "numeric_tolerance", "correct_answer", "explanation", "marks")


def _lab_questions(client, slug, node):
    r = client.get(LAB.format(slug=slug, node=node) + "/questions")
    assert r.status_code == 200, r.text
    return r, r.json()


def _by_id(db, served):
    return {q["question_id"]: db.get(GsLmsMcqQuestion, q["question_id"]) for q in served}


def _wrong_label(q):
    return next(l for l in "ABCD" if l != q.correct_option)


def _plan_answers(db, served):
    """Answer every served question following a fixed plan; returns (answers, expected marks, expected correct)."""
    questions = _by_id(db, served)
    seen = {"single": 0, "multi": 0, "numerical": 0}
    answers, marks, correct = [], 0.0, 0
    for item in served:
        q = questions[item["question_id"]]
        fmt = item["answer_format"]
        seen[fmt] += 1
        n = seen[fmt]
        base = {"question_id": q.id}
        if fmt == "single":
            if n == 2:
                answers.append({**base, "chosen_answer": _wrong_label(q)}); marks -= 1
            elif n == 3:
                answers.append(base)  # unanswered
            else:
                answers.append({**base, "chosen_answer": q.correct_option.lower()}); marks += 4; correct += 1
        elif fmt == "multi":
            right = sorted(q.correct_options)
            extra = next(l for l in "ABCD" if l not in right)
            if n == 1:
                answers.append({**base, "selected_options": list(reversed(right))}); marks += 4; correct += 1
            elif n == 2:
                answers.append({**base, "selected_options": right[:1]}); marks += 1  # partial
            elif n == 3:
                answers.append({**base, "selected_options": right + [extra]}); marks -= 2
            else:
                answers.append({**base, "selected_options": []})  # unanswered
        else:
            if n == 2:
                answers.append({**base, "numeric_answer": q.numeric_answer + 7}); marks -= 1
            elif n == 3:
                answers.append(base)
            else:
                answers.append({**base, "numeric_answer": q.numeric_answer}); marks += 4; correct += 1
    return answers, marks, correct


def test_jee_lab_serves_formats_without_answers(client, db):
    _import(db, JEE_TEMPLATE, "jee-maths")
    node = _leaf_node(db, "jee-maths")
    r, served = _lab_questions(client, "jee-maths", node.id)
    assert len(served) == 15
    assert {q["answer_format"] for q in served} == {"single", "multi", "numerical"}
    for q in served:
        assert set(q) == {"question_id", "question_type", "answer_format", "question_text", "statements", "options", "display_order"}
        assert (q["options"] == []) == (q["answer_format"] == "numerical")
        assert q["answer_format"] == {"NUMERICAL": "numerical", "MULTI_CORRECT": "multi"}.get(q["question_type"], "single")
    for word in LEAK_WORDS:  # nothing about the answers before submission, neither as keys nor as text
        assert f'"{word}"' not in r.text, word
    for row in db.query(GsLmsMcqQuestion):
        assert row.explanation not in r.text


def test_jee_lab_grades_mixed_formats_and_totals_marks(client, db):
    _import(db, JEE_TEMPLATE, "jee-maths")
    node = _leaf_node(db, "jee-maths")
    _, served = _lab_questions(client, "jee-maths", node.id)
    answers, expected_marks, expected_correct = _plan_answers(db, served)
    assert expected_marks == 29 and expected_correct == 8  # 19 single + 3 multi + 7 numerical

    r = client.post(LAB.format(slug="jee-maths", node=node.id) + "/submit", json={"answers": answers})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["marks_total"] == expected_marks and body["marks_max"] == 60
    assert body["correct_count"] == expected_correct and body["total_questions"] == 15
    assert body["score"] == round(expected_correct / 15 * 100, 1)  # accuracy, not marks
    assert set(body["marking_scheme"]) == {"single", "multi", "numerical"}
    assert body["marking_scheme"]["single"] == {"correct": 4, "wrong": -1, "unattempted": 0}
    assert body["marking_scheme"]["multi"]["partial_per_correct_option"] == 1
    assert round(sum(a["marks"] for a in body["attempts"]), 2) == expected_marks
    unanswered = [a for a in body["attempts"] if a["chosen_answer"] == ""]
    assert len(unanswered) == 3 and all(a["marks"] == 0 and not a["is_correct"] for a in unanswered)
    multi = [a for a in body["attempts"] if a["answer_format"] == "multi"]
    assert all(a["correct_answer"] == ",".join(sorted(a["correct_answer"].split(","))) for a in multi)

    stored = db.query(GsLmsMcqLabAttempt).all()  # marks are persisted; GET /result returns the same numbers
    assert round(sum(a.marks for a in stored), 2) == expected_marks
    again = client.get(LAB.format(slug="jee-maths", node=node.id) + "/result").json()
    assert again["marks_total"] == expected_marks and again["marks_max"] == 60
    assert sorted((a["question_id"], a["marks"]) for a in again["attempts"]) == sorted((a["question_id"], a["marks"]) for a in body["attempts"])
    assert again["marking_scheme"] == body["marking_scheme"] and again["score"] == body["score"]


def test_lab_pass_mark_stays_accuracy_based(client, db):
    """Negative marks do not change mastery: 9 of 15 correct is 60%, which masters the topic."""
    from app.core.gs_lms import progression as prog

    _import(db, JEE_TEMPLATE, "jee-maths")
    node = _leaf_node(db, "jee-maths")
    _, served = _lab_questions(client, "jee-maths", node.id)
    questions = _by_id(db, served)
    answers = []
    for i, item in enumerate(served):
        q = questions[item["question_id"]]
        right = i < 9
        if item["answer_format"] == "single":
            answers.append({"question_id": q.id, "chosen_answer": q.correct_option if right else _wrong_label(q)})
        elif item["answer_format"] == "multi":
            answers.append({"question_id": q.id, "selected_options": q.correct_options if right else [next(l for l in "ABCD" if l not in q.correct_options)]})
        else:
            answers.append({"question_id": q.id, "numeric_answer": q.numeric_answer if right else q.numeric_answer + 1})
    body = client.post(LAB.format(slug="jee-maths", node=node.id) + "/submit", json={"answers": answers}).json()
    assert body["correct_count"] == 9 and body["score"] == 60.0
    assert body["marks_total"] < 9 * 4  # penalties applied...
    assert prog.best_mcq_scores(db, 1, [node.id])[node.id] == pytest.approx(0.6)  # ...but accuracy decides mastery


def test_wrongly_shaped_answers_are_wrong_not_errors(client, db):
    _import(db, JEE_TEMPLATE, "jee-maths")
    node = _leaf_node(db, "jee-maths")
    _, served = _lab_questions(client, "jee-maths", node.id)
    answers = []
    for item in served:
        qid = item["question_id"]
        if item["answer_format"] == "numerical":
            answers.append({"question_id": qid, "chosen_answer": "A"})        # a letter for a number
        elif item["answer_format"] == "multi":
            answers.append({"question_id": qid, "selected_options": ["Z", "a"]})
        else:
            answers.append({"question_id": qid, "numeric_answer": 3, "selected_options": ["A", "B"]})
    r = client.post(LAB.format(slug="jee-maths", node=node.id) + "/submit", json={"answers": answers})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["correct_count"] == 0 and all(not a["is_correct"] for a in body["attempts"])


def test_neet_lab_marks_plus4_minus1(client, db):
    _import(db, NEET_TEMPLATE, "neet-biology")
    node = _leaf_node(db, "neet-biology")
    _, served = _lab_questions(client, "neet-biology", node.id)
    assert {q["answer_format"] for q in served} == {"single"}
    questions = _by_id(db, served)
    answers = []
    for i, item in enumerate(served):
        q = questions[item["question_id"]]
        if i < 10:
            answers.append({"question_id": q.id, "chosen_answer": q.correct_option})
        elif i < 13:
            answers.append({"question_id": q.id, "chosen_answer": _wrong_label(q)})
        else:
            answers.append({"question_id": q.id})
    body = client.post(LAB.format(slug="neet-biology", node=node.id) + "/submit", json={"answers": answers}).json()
    assert body["correct_count"] == 10 and body["score"] == 66.7
    assert body["marks_total"] == 10 * 4 - 3 and body["marks_max"] == 60
    assert body["marking_scheme"] == {"single": {"correct": 4, "wrong": -1, "unattempted": 0}}
    assert sorted(a["marks"] for a in body["attempts"]) == [-1] * 3 + [0] * 2 + [4] * 10


def test_selected_option_is_an_alias_of_chosen_answer(client, db):
    _import(db, NEET_TEMPLATE, "neet-biology")
    node = _leaf_node(db, "neet-biology")
    _, served = _lab_questions(client, "neet-biology", node.id)
    questions = _by_id(db, served)
    answers = [{"question_id": q["question_id"], "selected_option": questions[q["question_id"]].correct_option} for q in served]
    body = client.post(LAB.format(slug="neet-biology", node=node.id) + "/submit", json={"answers": answers}).json()
    assert body["score"] == 100.0 and body["marks_total"] == 60


def test_upsc_lab_is_unchanged(client, db):
    _import(db, UPSC_TEMPLATE, "polity-governance")
    node = _leaf_node(db, "polity-governance")
    r, served = _lab_questions(client, "polity-governance", node.id)
    assert len(served) == 15
    assert {q["answer_format"] for q in served} == {"single"}
    assert all(q["options"] for q in served)
    for word in LEAK_WORDS:
        assert f'"{word}"' not in r.text, word
    questions = _by_id(db, served)
    answers = [{"question_id": q["question_id"], "chosen_answer": questions[q["question_id"]].correct_option} for q in served]
    answers[0]["chosen_answer"] = _wrong_label(questions[answers[0]["question_id"]])
    body = client.post(LAB.format(slug="polity-governance", node=node.id) + "/submit", json={"answers": answers}).json()
    # exactly the pre-existing response shape: no marks keys for UPSC single-answer results
    assert set(body) == {"total_questions", "correct_count", "score", "attempts", "type_breakdown"}
    assert all(set(a) == {"question_id", "chosen_answer", "correct_answer", "is_correct", "question_type", "explanation"} for a in body["attempts"])
    assert body["correct_count"] == 14 and body["score"] == 93.3
    again = client.get(LAB.format(slug="polity-governance", node=node.id) + "/result").json()
    assert set(again) == set(body) and set(again["attempts"][0]) == set(body["attempts"][0])


# ---------------------------------------------------------------------------
# Checkpoints
# ---------------------------------------------------------------------------

def _make_checkpoint(db, slug: str) -> int:
    subject = db.query(GsSubject).filter_by(slug=slug).one()
    leaf = _leaf_node(db, slug)
    cp = GsLmsCheckpoint(
        student_id=1, subject_id=subject.id, sub_topic_node_id=leaf.parent_id, leaf_ids=[leaf.id],
        status="DUE", attempts=0, created_by="1",
    )
    db.add(cp)
    db.commit()
    return cp.id


def _cp_answers(db, qs, correct: bool):
    answers = []
    for item in qs:
        q = db.get(GsLmsMcqQuestion, item["question_id"])
        fmt = item["answer_format"]
        if fmt == "single":
            answers.append({"question_id": q.id, "chosen_answer": q.correct_option if correct else _wrong_label(q)})
        elif fmt == "multi":
            labels = q.correct_options if correct else [next(l for l in "ABCD" if l not in q.correct_options)]
            answers.append({"question_id": q.id, "selected_options": labels})
        else:
            answers.append({"question_id": q.id, "numeric_answer": q.numeric_answer if correct else q.numeric_answer - 3})
    return {"answers": answers}


def _counts(qs):
    return {f: sum(1 for q in qs if q["answer_format"] == f) for f in ("single", "multi", "numerical")}


def test_jee_checkpoint_formats_marks_and_accuracy_pass_mark(client, db):
    _import(db, JEE_TEMPLATE, "jee-maths")
    base = f"/api/v1/gs-lms/jee-maths/checkpoints/{_make_checkpoint(db, 'jee-maths')}"

    started = client.post(base + "/start")
    assert started.status_code == 200, started.text
    qs = started.json()["questions"]
    assert len(qs) == 10
    for word in LEAK_WORDS:
        assert f'"{word}"' not in started.text, word
    for row in db.query(GsLmsMcqQuestion):
        assert row.explanation not in started.text
    for q in qs:
        assert set(q) == {"question_id", "question_type", "answer_format", "question_text", "options", "display_order"}
        assert (q["options"] == []) == (q["answer_format"] == "numerical")

    # all wrong: accuracy 0 fails the checkpoint and the marks are negative
    wrong = client.post(base + "/submit", json=_cp_answers(db, qs, False))
    assert wrong.status_code == 200, wrong.text
    res, counts = wrong.json(), _counts(qs)
    assert res["passed"] is False and res["score"] == 0.0 and res["correct_count"] == 0
    assert res["marks_total"] == -(counts["single"] + counts["numerical"]) - 2 * counts["multi"]
    assert res["marks_max"] == 40
    assert all(a["marks"] < 0 and a["answer_format"] for a in res["attempts"])

    qs = client.post(base + "/start").json()["questions"]
    ok = client.post(base + "/submit", json=_cp_answers(db, qs, True)).json()
    assert ok["passed"] is True and ok["score"] == 100.0 and ok["status"] == "PASSED"
    assert ok["marks_total"] == 40 and ok["marks_max"] == 40
    assert set(ok["marking_scheme"]) == {f for f, n in _counts(qs).items() if n}


def test_neet_checkpoint_marks(client, db):
    _import(db, NEET_TEMPLATE, "neet-biology")
    base = f"/api/v1/gs-lms/neet-biology/checkpoints/{_make_checkpoint(db, 'neet-biology')}"
    qs = client.post(base + "/start").json()["questions"]
    answers = _cp_answers(db, qs, True)
    for a in answers["answers"][:4]:
        a["chosen_answer"] = _wrong_label(db.get(GsLmsMcqQuestion, a["question_id"]))
    res = client.post(base + "/submit", json=answers).json()
    assert res["correct_count"] == 6 and res["score"] == 60.0 and res["passed"] is True
    assert res["marks_total"] == 6 * 4 - 4 and res["marks_max"] == 40
    assert res["marking_scheme"] == {"single": {"correct": 4, "wrong": -1, "unattempted": 0}}


def test_upsc_checkpoint_is_unchanged(client, db):
    _import(db, UPSC_TEMPLATE, "polity-governance")
    base = f"/api/v1/gs-lms/polity-governance/checkpoints/{_make_checkpoint(db, 'polity-governance')}"
    started = client.post(base + "/start")
    qs = started.json()["questions"]
    assert all(q["answer_format"] == "single" and q["options"] for q in qs)
    for word in LEAK_WORDS:
        assert f'"{word}"' not in started.text, word
    res = client.post(base + "/submit", json=_cp_answers(db, qs, True)).json()
    assert set(res) == {
        "checkpoint_id", "total_questions", "correct_count", "score", "passed", "pass_score", "status", "attempts", "leaf_breakdown",
    }
    assert all(set(a) == {"question_id", "leaf_id", "chosen_answer", "correct_answer", "is_correct", "explanation"} for a in res["attempts"])
    assert res["passed"] is True and res["score"] == 100.0


# ---------------------------------------------------------------------------
# Sequential practice only serves single-correct questions
# ---------------------------------------------------------------------------

def test_sequential_practice_skips_multi_and_numerical(db):
    from app.api.v1.gs_lms.practice import _get_questions_for_session

    _import(db, JEE_TEMPLATE, "jee-maths")
    served = _get_questions_for_session(db, _leaf_node(db, "jee-maths").id)
    assert len(served) == 7 and all(scoring.answer_format_of(q) == "single" for q in served)


# ---------------------------------------------------------------------------
# Migration
# ---------------------------------------------------------------------------

def _load_migration():
    spec = importlib.util.spec_from_file_location("q4e5f6a7b8c9", MIGRATION_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_migration_up_down_up_keeps_existing_questions():
    mig = _load_migration()
    assert mig.down_revision == "p3d4e5f6a7b8"
    engine = create_engine("sqlite:///:memory:", future=True, poolclass=StaticPool, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    q_cols = {"numeric_answer", "numeric_tolerance", "correct_options"}
    with engine.begin() as conn:
        conn.execute(sa.text(  # a legacy single-correct question
            "INSERT INTO gs_lms_mcq_questions (id, syllabus_node_id, question_text, options, correct_option, question_type, "
            "display_order, review_status, created_at, updated_at) VALUES (1, 1, 'q', '[]', 'B', 'FACTUAL', 0, 'REVIEWED', "
            "CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"))
        with Operations.context(MigrationContext.configure(conn)):
            mig.downgrade()
            insp = sa.inspect(conn)
            assert not q_cols & {c["name"] for c in insp.get_columns("gs_lms_mcq_questions")}
            assert "marks" not in {c["name"] for c in insp.get_columns("gs_lms_mcq_lab_attempts")}
            assert conn.execute(sa.text("SELECT correct_option FROM gs_lms_mcq_questions WHERE id = 1")).scalar() == "B"

            mig.upgrade()
            insp = sa.inspect(conn)
            cols = {c["name"]: c for c in insp.get_columns("gs_lms_mcq_questions")}
            assert q_cols <= set(cols)
            assert cols["correct_option"]["nullable"] is False and cols["options"]["nullable"] is False
            assert "marks" in {c["name"] for c in insp.get_columns("gs_lms_mcq_lab_attempts")}
            row = conn.execute(sa.text(
                "SELECT correct_option, numeric_answer, numeric_tolerance, correct_options FROM gs_lms_mcq_questions WHERE id = 1")).one()
            assert tuple(row) == ("B", None, None, None)

            conn.execute(sa.text(
                "INSERT INTO gs_lms_mcq_lab_attempts (id, session_id, question_id, question_type, chosen_answer, correct_answer, "
                "is_correct, created_at, updated_at) VALUES (1, 1, 1, 'FACTUAL', 'A,B,C,D', '-123456.789', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"))
            mig.upgrade()  # idempotent
            mig.downgrade()  # answers longer than the old width are cut, nothing fails
            assert tuple(conn.execute(sa.text("SELECT chosen_answer, correct_answer FROM gs_lms_mcq_lab_attempts")).one()) == ("A,B,C,D", "-123456.78")
            mig.upgrade()
            assert conn.execute(sa.text("SELECT count(*) FROM gs_lms_mcq_questions")).scalar() == 1


def test_single_alembic_head_is_this_revision():
    from alembic.config import Config
    from alembic.script import ScriptDirectory

    root = Path(__file__).resolve().parents[2]
    cfg = Config(str(root / "alembic.ini"))
    cfg.set_main_option("script_location", str(root / "alembic"))
    script = ScriptDirectory.from_config(cfg)
    assert script.get_heads() == ["q4e5f6a7b8c9"]
    assert script.get_revision("q4e5f6a7b8c9").down_revision == "p3d4e5f6a7b8"
