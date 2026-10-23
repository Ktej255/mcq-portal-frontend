"""Concept versions, books, book refs and learner profiles for the GS LMS:
model/migration, content checker, importer, version selection and the API."""

from __future__ import annotations

import copy
import importlib.util
import json
from pathlib import Path

import pytest
import sqlalchemy as sa
from alembic.operations import Operations
from alembic.runtime.migration import MigrationContext
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.main  # noqa: F401  (registers every model on Base.metadata)
from app.api.dependencies import get_current_user
from app.api.v1.gs_lms import router as gs_lms_router
from app.core.config import settings
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.content_check import check_subject_content
from app.core.gs_lms.importer import DEFAULT_ARTIFACT_PATH, import_gs_subject
from app.core.gs_lms.models import (
    GsLmsBook,
    GsLmsBookChapter,
    GsLmsConcept,
    GsLmsConceptBookRef,
    GsLmsConceptVersion,
    GsLmsContentSection,
    GsLmsLearnerProfile,
    GsLmsMcqQuestion,
    GsLmsNodeTypeEnum,
    GsLmsQuestionTypeEnum,
    GsLmsSectionLabelEnum,
    GsLmsStudyPathEnum as Path_,
    GsLmsSyllabusNode,
    GsLmsVersionLevelEnum as L,
    GsLmsVersionSourceEnum as S,
    GsLmsVersionStyleEnum as St,
)
from app.core.gs_lms.student_models import GsLmsConceptMastery, GsLmsConceptMasteryStatusEnum
from app.core.gs_lms.versions import pick_version, rank_versions
from app.db.session import Base, get_db
from app.models.domain import RoleEnum, User

BASE = "/api/v1/gs-lms/polity-governance"
TEMPLATE_PATH = DEFAULT_ARTIFACT_PATH.parent / "templates" / "gs_subject_template.json"
MIGRATION_PATH = (
    Path(__file__).resolve().parents[2]
    / "alembic" / "versions" / "j7d8e9f0a1b2_add_gs_lms_concept_versions_books_profile.py"
)
NEW_TABLES = [
    "gs_lms_concept_versions", "gs_lms_books", "gs_lms_book_chapters",
    "gs_lms_concept_book_refs", "gs_lms_learner_profiles",
]


class _Who:
    def __init__(self, id, role, email):
        self.id, self.role, self.email = id, role, email


STUDENT = _Who(1, RoleEnum.STUDENT, "s@test.local")


def _template() -> dict:
    return json.loads(TEMPLATE_PATH.read_text(encoding="utf-8"))


def _concept_of(data: dict, index: int = 1) -> dict:
    leaf = data["tree"][0]["children"][0]["children"][0]
    return leaf["concepts"][index]


def _errors(data: dict) -> list[str]:
    return check_subject_content(data).errors


def _new_version(**kw) -> dict:
    v = {"level": "STANDARD", "style": "TEXT", "source": "NCERT", "title": "T",
         "blocks": [{"type": "para", "text": "x"}]}
    v.update(kw)
    return v


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
        db.add(User(id=2, email="t@test.local", full_name="T", role=RoleEnum.STUDENT, google_uid="g2"))
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


def _leaf(db, title="Leaf", order=1, reviewed=True):
    n = GsLmsSyllabusNode(
        subject_id=1, title=title, node_type=GsLmsNodeTypeEnum.LEAF_TOPIC, display_order=order,
        review_status=GsReviewStatusEnum.REVIEWED,
    )
    db.add(n)
    db.flush()
    return n


def _concept(db, leaf, title="C", reviewed=True):
    c = GsLmsConcept(
        syllabus_node_id=leaf.id, title=title, key_points=["a", "b"],
        review_status=GsReviewStatusEnum.REVIEWED if reviewed else GsReviewStatusEnum.UNREVIEWED,
    )
    db.add(c)
    db.flush()
    return c


def _version(db, concept, level=L.STANDARD, style=St.TEXT, source=S.ORIGINAL, order=0, reviewed=True, **kw):
    v = GsLmsConceptVersion(
        concept_id=concept.id, level=level, style=style, source=source, title=f"{level.value}-{style.value}-{source.value}",
        blocks=[{"type": "para", "text": "body"}], display_order=order,
        review_status=GsReviewStatusEnum.REVIEWED if reviewed else GsReviewStatusEnum.UNREVIEWED, **kw,
    )
    db.add(v)
    db.flush()
    return v


def _profile(db, student=1, **kw):
    p = GsLmsLearnerProfile(student_id=student, **kw)
    db.add(p)
    db.flush()
    return p


def _mastery(db, concept, attempts, passed=False, student=1):
    db.add(GsLmsConceptMastery(
        student_id=student, concept_id=concept.id, score=0.9 if passed else 0.2, attempts=attempts,
        status=GsLmsConceptMasteryStatusEnum.PASSED if passed else GsLmsConceptMasteryStatusEnum.LEARNING,
    ))
    db.flush()


def _book(db, slug="b1", chapters=(1,)):
    b = GsLmsBook(slug=slug, title="Indian Polity", author="A", edition="7th")
    db.add(b)
    db.flush()
    chs = []
    for n in chapters:
        ch = GsLmsBookChapter(book_id=b.id, number=n, title=f"Ch {n}")
        db.add(ch)
        chs.append(ch)
    db.flush()
    return b, chs


# ---------------------------------------------------------------------------
# Models and migration
# ---------------------------------------------------------------------------

def test_version_combination_is_unique(db):
    c = _concept(db, _leaf(db))
    _version(db, c)
    db.commit()
    with pytest.raises(IntegrityError):
        _version(db, c)
    db.rollback()


def test_book_slug_unique_and_chapter_number_unique_per_book(db):
    b, _ = _book(db, chapters=(1,))
    db.add(GsLmsBookChapter(book_id=b.id, number=2, title="other"))
    db.commit()
    db.add(GsLmsBookChapter(book_id=b.id, number=1, title="dup"))
    with pytest.raises(IntegrityError):
        db.flush()
    db.rollback()
    db.add(GsLmsBook(slug="b1", title="x", author="y", edition="1"))
    with pytest.raises(IntegrityError):
        db.flush()
    db.rollback()


def test_profile_is_unique_per_student_and_book_exam_tag_defaults(db):
    b, _ = _book(db)
    assert b.exam_tag == "UPSC"
    _profile(db)
    db.commit()
    db.add(GsLmsLearnerProfile(student_id=1))
    with pytest.raises(IntegrityError):
        db.flush()
    db.rollback()


def _load_migration():
    spec = importlib.util.spec_from_file_location("mig_j7d8", MIGRATION_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_migration_up_down_on_sqlite():
    mig = _load_migration()
    assert mig.down_revision == "f9c2d5e8a3b6"
    engine = create_engine("sqlite:///:memory:", future=True, poolclass=StaticPool)
    # Prerequisites only: users and concepts (and what they reference).
    wanted = {"users", "gs_lms_concepts", "gs_lms_syllabus_nodes", "gs_subjects", "gs_day_lessons"}
    Base.metadata.create_all(engine, tables=[t for n, t in Base.metadata.tables.items() if n in wanted])
    with engine.begin() as conn:
        with Operations.context(MigrationContext.configure(conn)):
            mig.upgrade()
            insp = sa.inspect(conn)
            assert set(NEW_TABLES) <= set(insp.get_table_names())
            uniques = {tuple(u["column_names"]) for u in insp.get_unique_constraints("gs_lms_concept_versions")}
            assert ("concept_id", "level", "style", "source") in uniques
            assert {c["name"] for c in insp.get_columns("gs_lms_learner_profiles")} >= {
                "student_id", "preferred_style", "preferred_level", "study_path", "book_ids"}
            mig.upgrade()  # idempotent
            mig.downgrade()
            assert not set(NEW_TABLES) & set(sa.inspect(conn).get_table_names())


def test_migration_is_the_single_alembic_head():
    from alembic.config import Config
    from alembic.script import ScriptDirectory

    cfg = Config(str(Path(__file__).resolve().parents[2] / "alembic.ini"))
    cfg.set_main_option("script_location", str(Path(__file__).resolve().parents[2] / "alembic"))
    assert ScriptDirectory.from_config(cfg).get_heads() == ["p3d4e5f6a7b8"]


# ---------------------------------------------------------------------------
# Checker
# ---------------------------------------------------------------------------

def test_template_with_versions_and_books_is_ready():
    data = _template()
    report = check_subject_content(data)
    assert report.errors == [] and report.gaps == [] and report.ready
    assert report.versions == 2 and report.books == 1


def test_existing_files_do_not_need_versions():
    data = _template()
    for c in data["tree"][0]["children"][0]["children"][0]["concepts"]:
        c.pop("versions", None)
    assert check_subject_content(data).ready


def test_require_versions_makes_missing_versions_a_gap():
    data = _template()
    data["require_versions"] = True
    report = check_subject_content(data)
    assert report.errors == [] and not report.ready
    assert sum("has no versions" in g for g in report.gaps) == 4
    leaf = data["tree"][0]["children"][0]["children"][0]
    for c in leaf["concepts"]:
        c["versions"] = c.get("versions") or [_new_version()]
    assert check_subject_content(data).ready


@pytest.mark.parametrize("field,value", [("level", "EXPERT"), ("style", "AUDIO"), ("source", "BLOG"), ("level", None)])
def test_checker_rejects_unknown_enum_values(field, value):
    data = _template()
    _concept_of(data)["versions"][0][field] = value
    assert any(field in e and "must be one of" in e for e in _errors(data))


def test_checker_rejects_duplicate_combination():
    data = _template()
    c = _concept_of(data)
    c["versions"].append(copy.deepcopy(c["versions"][0]))
    assert any("already" in e for e in _errors(data))


def test_checker_rejects_version_without_content_and_bad_video_url():
    data = _template()
    c = _concept_of(data)
    c["versions"] = [_new_version(blocks=[]), _new_version(level="BASIC", video_url="ftp://x"),
                     _new_version(level="ADVANCED", blocks=None, video_url="https://youtu.be/x"),
                     _new_version(level="BASIC", style="VIDEO", blocks=None, video_url="http://v/1")]
    errs = _errors(data)
    assert any("neither blocks nor a video_url" in e for e in errs)
    assert any("must start with http" in e for e in errs)
    assert len([e for e in errs if "version 3" in e or "version 4" in e]) == 0  # video-only is fine


def test_checker_rejects_bad_blocks_and_duration():
    data = _template()
    _concept_of(data)["versions"] = [_new_version(blocks="text"), _new_version(level="BASIC", duration_minutes="5")]
    errs = _errors(data)
    assert any("blocks must be a list" in e for e in errs)
    assert any("duration_minutes" in e for e in errs)


def test_checker_book_ref_errors():
    data = _template()
    c = _concept_of(data)
    c["book_refs"] = [
        {"book": "nope", "chapter": 1},
        {"book": "laxmikanth-indian-polity-7e", "chapter": 99},
        {"book": ["x"], "chapter": [1]},
    ]
    errs = _errors(data)
    assert any("is not listed under" in e and "nope" in e for e in errs)
    assert any("chapter 99" in e for e in errs)
    assert len([e for e in errs if "book_ref" in e]) == 3


def test_checker_duplicate_book_slug_and_chapter_numbers():
    data = _template()
    data["books"].append(copy.deepcopy(data["books"][0]))
    data["books"][0]["chapters"].append({"number": 1, "title": "again"})
    errs = _errors(data)
    assert any("already uses the slug" in e for e in errs)
    assert any("listed twice" in e for e in errs)


def test_checker_book_needs_fields():
    data = _template()
    data["books"] = [{"slug": "", "chapters": [{"number": "1", "title": "x"}]}]
    errs = _errors(data)
    assert any("no slug" in e for e in errs)
    assert any("no author" in e for e in errs)
    assert any("whole-number" in e for e in errs)


# ---------------------------------------------------------------------------
# Importer
# ---------------------------------------------------------------------------

def test_import_upserts_books_versions_and_refs_idempotently(session_factory):
    data = _template()
    with session_factory() as db:
        db.add(GsSubject(id=2, slug="other", name="Other", display_order=2))
        db.commit()
        first = import_gs_subject(db, data, review_status="REVIEWED")
        second = import_gs_subject(db, data, review_status="REVIEWED")
        db.commit()
        assert (first["books_created"], first["chapters_created"]) == (1, 1)
        assert (first["versions_created"], first["book_refs_created"]) == (2, 1)
        assert (second["books_created"], second["chapters_created"], second["versions_created"],
                second["book_refs_created"]) == (0, 0, 0, 0)
        assert (second["books_updated"], second["versions_updated"], second["book_refs_updated"]) == (1, 2, 1)
        assert db.query(GsLmsBook).count() == 1
        assert db.query(GsLmsBookChapter).count() == 1
        assert db.query(GsLmsConceptVersion).count() == 2
        assert db.query(GsLmsConceptBookRef).count() == 1
        assert db.query(GsLmsConceptVersion).filter_by(review_status=GsReviewStatusEnum.REVIEWED).count() == 2
        assert db.query(GsLmsBook).one().publisher == "McGraw Hill Education"


def test_import_updates_changed_version_and_unreviewed_by_default(session_factory):
    data = _template()
    with session_factory() as db:
        import_gs_subject(db, data)
        v = db.query(GsLmsConceptVersion).filter_by(level=L.BASIC).one()
        assert v.review_status == GsReviewStatusEnum.UNREVIEWED
        _concept_of(data)["versions"][0]["title"] = "New title"
        _concept_of(data)["versions"][0]["video_url"] = "https://example.com/v"
        _concept_of(data)["book_refs"][0]["pages"] = "12-15"
        import_gs_subject(db, data, review_status="REVIEWED")
        db.commit()
        v = db.query(GsLmsConceptVersion).filter_by(level=L.BASIC).one()
        assert (v.title, v.video_url, v.review_status) == ("New title", "https://example.com/v", GsReviewStatusEnum.REVIEWED)
        assert db.query(GsLmsConceptBookRef).one().pages == "12-15"


def test_import_refuses_a_file_with_bad_book_ref(session_factory):
    data = _template()
    _concept_of(data)["book_refs"][0]["chapter"] = 7
    with session_factory() as db:
        with pytest.raises(ValueError, match="nothing was imported"):
            import_gs_subject(db, data)
        assert db.query(GsLmsBook).count() == 0


# ---------------------------------------------------------------------------
# Version selection
# ---------------------------------------------------------------------------

@pytest.fixture()
def concept(db):
    return _concept(db, _leaf(db))


def _all_versions(db, concept):
    return {
        (lv, st, so): _version(db, concept, lv, st, so)
        for lv in L for st in St for so in S
    }


def test_no_versions_returns_none_and_unreviewed_are_ignored(db, concept):
    assert pick_version(db, 1, concept.id) is None
    _version(db, concept, reviewed=False)
    assert pick_version(db, 1, concept.id) is None and rank_versions(db, 1, concept.id) == []


def test_default_choice_is_standard_text_original(db, concept):
    vs = _all_versions(db, concept)
    assert pick_version(db, 1, concept.id) is vs[(L.STANDARD, St.TEXT, S.ORIGINAL)]
    assert len(rank_versions(db, 1, concept.id)) == 48


def test_level_fallback_order(db, concept):
    only = {k: _version(db, concept, *k) for k in [
        (L.ADVANCED, St.TEXT, S.ORIGINAL), (L.BASIC, St.TEXT, S.ORIGINAL)]}
    assert pick_version(db, 1, concept.id).level == L.BASIC  # standard missing -> basic before advanced
    assert only


def test_struggling_student_gets_basic_first(db, concept):
    vs = _all_versions(db, concept)
    _profile(db, preferred_level=L.ADVANCED)
    assert pick_version(db, 1, concept.id).level == L.ADVANCED
    _mastery(db, concept, attempts=2)
    assert pick_version(db, 1, concept.id) is vs[(L.BASIC, St.TEXT, S.ORIGINAL)]


def test_one_attempt_or_passed_is_not_struggling(db, concept):
    _all_versions(db, concept)
    _mastery(db, concept, attempts=1)
    assert pick_version(db, 1, concept.id).level == L.STANDARD
    _mastery(db, concept, attempts=5, passed=True, student=2)
    assert pick_version(db, 2, concept.id).level == L.STANDARD


def test_preferred_level_then_standard_basic_advanced(db, concept):
    _all_versions(db, concept)
    _profile(db, preferred_level=L.BASIC)
    assert [v.level for v in rank_versions(db, 1, concept.id)][::16] == [L.BASIC, L.STANDARD, L.ADVANCED]


def test_preferred_style_then_default_order(db, concept):
    _all_versions(db, concept)
    _profile(db, preferred_style=St.STORY)
    ranked = [v for v in rank_versions(db, 1, concept.id) if v.level == L.STANDARD and v.source == S.ORIGINAL]
    assert [v.style for v in ranked] == [St.STORY, St.TEXT, St.VISUAL, St.VIDEO]
    db.query(GsLmsLearnerProfile).delete()
    ranked = [v for v in rank_versions(db, 1, concept.id) if v.level == L.STANDARD and v.source == S.ORIGINAL]
    assert [v.style for v in ranked] == [St.TEXT, St.VISUAL, St.STORY, St.VIDEO]


def test_level_outranks_style_and_style_outranks_source(db, concept):
    a = _version(db, concept, L.STANDARD, St.VIDEO, S.COACHING)
    b = _version(db, concept, L.BASIC, St.TEXT, S.ORIGINAL)
    c = _version(db, concept, L.STANDARD, St.TEXT, S.COACHING)
    d = _version(db, concept, L.STANDARD, St.VISUAL, S.ORIGINAL)
    assert rank_versions(db, 1, concept.id) == [c, d, a, b]


def _by_source(db, concept):
    return {s: _version(db, concept, source=s) for s in S}


def test_source_default_is_original_then_ncert(db, concept):
    vs = _by_source(db, concept)
    assert [v.source for v in rank_versions(db, 1, concept.id)] == [S.ORIGINAL, S.NCERT, S.COACHING, S.REFERENCE_BOOK]
    _profile(db, study_path=Path_.MIXED)
    assert rank_versions(db, 1, concept.id)[0] is vs[S.ORIGINAL]


def test_source_ncert_only(db, concept):
    vs = _by_source(db, concept)
    _profile(db, study_path=Path_.NCERT_ONLY)
    assert rank_versions(db, 1, concept.id)[0] is vs[S.NCERT]


def test_source_coaching(db, concept):
    vs = _by_source(db, concept)
    _profile(db, study_path=Path_.COACHING)
    assert rank_versions(db, 1, concept.id)[0] is vs[S.COACHING]


def test_source_reference_books_needs_a_matching_book_ref(db, concept):
    vs = _by_source(db, concept)
    book, (ch,) = _book(db)
    other, (other_ch,) = _book(db, slug="b2")
    _profile(db, study_path=Path_.REFERENCE_BOOKS, book_ids=[book.id])
    # No ref at all: default order.
    assert rank_versions(db, 1, concept.id)[0] is vs[S.ORIGINAL]
    # Ref to a book the student does not use: still default.
    db.add(GsLmsConceptBookRef(concept_id=concept.id, chapter_id=other_ch.id))
    db.flush()
    assert rank_versions(db, 1, concept.id)[0] is vs[S.ORIGINAL]
    # Ref to the student's book: reference book first.
    db.add(GsLmsConceptBookRef(concept_id=concept.id, chapter_id=ch.id, pages="1-2"))
    db.flush()
    assert rank_versions(db, 1, concept.id)[0] is vs[S.REFERENCE_BOOK]


def test_ranking_is_deterministic_and_display_order_is_the_last_tiebreak(db, concept):
    a = _version(db, concept, L.STANDARD, St.TEXT, S.ORIGINAL, order=5)
    b = _version(db, concept, L.STANDARD, St.TEXT, S.NCERT, order=1)
    assert rank_versions(db, 1, concept.id) == [a, b]  # source rank decides before display_order
    assert rank_versions(db, 1, concept.id) == rank_versions(db, 1, concept.id)


# ---------------------------------------------------------------------------
# API: profile and books
# ---------------------------------------------------------------------------

def test_profile_get_defaults_and_put_roundtrip(client, db):
    book, _ = _book(db)
    db.commit()
    r = client.get("/api/v1/gs-lms/profile")
    assert r.status_code == 200
    assert r.json()["data"] == {"preferred_style": None, "preferred_level": None, "study_path": None,
                                "book_ids": [], "updated_at": None}
    r = client.put("/api/v1/gs-lms/profile", json={
        "preferred_style": "VIDEO", "preferred_level": "BASIC", "study_path": "REFERENCE_BOOKS",
        "book_ids": [book.id, book.id]})
    assert r.status_code == 200, r.text
    data = r.json()["data"]
    assert (data["preferred_style"], data["preferred_level"], data["study_path"], data["book_ids"]) == (
        "VIDEO", "BASIC", "REFERENCE_BOOKS", [book.id])
    assert client.get("/api/v1/gs-lms/profile").json()["data"]["preferred_style"] == "VIDEO"
    # PUT replaces: omitted fields clear; still one row.
    client.put("/api/v1/gs-lms/profile", json={"study_path": "MIXED"})
    data = client.get("/api/v1/gs-lms/profile").json()["data"]
    assert data["preferred_style"] is None and data["study_path"] == "MIXED" and data["book_ids"] == []
    db.expire_all()
    assert db.query(GsLmsLearnerProfile).count() == 1


@pytest.mark.parametrize("body", [
    {"preferred_style": "AUDIO"}, {"preferred_level": "EXPERT"}, {"study_path": "SELF"}, {"book_ids": ["x"]},
])
def test_profile_put_rejects_bad_enums(client, body):
    assert client.put("/api/v1/gs-lms/profile", json=body).status_code == 422


def test_profile_put_rejects_unknown_book_ids(client, db):
    r = client.put("/api/v1/gs-lms/profile", json={"book_ids": [999]})
    assert r.status_code == 422 and "999" in r.json()["detail"]
    assert db.query(GsLmsLearnerProfile).count() == 0


def test_profile_is_per_student(client, db):
    _profile(db, student=2, preferred_style=St.STORY)
    db.commit()
    assert client.get("/api/v1/gs-lms/profile").json()["data"]["preferred_style"] is None


def test_books_endpoint_filters_by_subject(client, db):
    b, _ = _book(db, chapters=(2, 1))
    b.subject_slug = "polity-governance"
    _book(db, slug="geo")
    db.commit()
    all_books = client.get("/api/v1/gs-lms/books").json()["data"]
    assert {x["slug"] for x in all_books} == {"b1", "geo"}
    only = client.get("/api/v1/gs-lms/books", params={"subject": "polity-governance"}).json()["data"]
    assert [x["slug"] for x in only] == ["b1"]
    assert [c["number"] for c in only[0]["chapters"]] == [1, 2]
    assert only[0]["edition"] == "7th" and only[0]["exam_tag"] == "UPSC"
    assert client.get("/api/v1/gs-lms/books", params={"subject": "zzz"}).json()["data"] == []


# ---------------------------------------------------------------------------
# API: versions
# ---------------------------------------------------------------------------

def test_picked_version_endpoint_returns_blocks_and_alternatives(client, db, concept):
    best = _version(db, concept, L.STANDARD, St.TEXT, S.ORIGINAL, duration_minutes=4)
    alt = _version(db, concept, L.BASIC, St.VISUAL, S.NCERT)
    _version(db, concept, L.ADVANCED, St.TEXT, S.ORIGINAL, reviewed=False)
    db.commit()
    r = client.get(f"{BASE}/concepts/{concept.id}/version")
    assert r.status_code == 200, r.text
    data = r.json()["data"]
    assert data["version"]["id"] == best.id and data["version"]["blocks"] == [{"type": "para", "text": "body"}]
    assert data["version"]["duration_minutes"] == 4
    assert data["alternatives"] == [
        {"id": alt.id, "level": "BASIC", "style": "VISUAL", "source": "NCERT", "title": alt.title}]


def test_picked_version_follows_the_students_profile(client, db, concept):
    _version(db, concept, L.STANDARD, St.TEXT, S.ORIGINAL)
    video = _version(db, concept, L.STANDARD, St.VIDEO, S.ORIGINAL, video_url="https://example.com/v")
    _profile(db, preferred_style=St.VIDEO)
    db.commit()
    data = client.get(f"{BASE}/concepts/{concept.id}/version").json()["data"]
    assert data["version"]["id"] == video.id and data["version"]["video_url"] == "https://example.com/v"


def test_version_endpoints_404(client, db, concept):
    hidden = _concept(db, _leaf(db, "L2", 2), "Hidden", reviewed=False)
    _version(db, hidden)
    db.commit()
    assert client.get(f"{BASE}/concepts/{concept.id}/version").status_code == 404  # no versions
    assert client.get(f"{BASE}/concepts/{hidden.id}/version").status_code == 404  # concept unreviewed
    assert client.get(f"{BASE}/concepts/9999/version").status_code == 404
    assert client.get(f"{BASE}/concepts/{concept.id}/versions/9999").status_code == 404
    assert client.get("/api/v1/gs-lms/nope/concepts/1/version").status_code == 404


def test_specific_version_endpoint(client, db, concept):
    v = _version(db, concept, L.ADVANCED, St.STORY, S.COACHING)
    draft = _version(db, concept, L.BASIC, reviewed=False)
    other = _concept(db, _leaf(db, "L2", 2), "Other")
    foreign = _version(db, other)
    db.commit()
    r = client.get(f"{BASE}/concepts/{concept.id}/versions/{v.id}")
    assert r.status_code == 200 and r.json()["data"]["style"] == "STORY"
    assert client.get(f"{BASE}/concepts/{concept.id}/versions/{draft.id}").status_code == 404
    assert client.get(f"{BASE}/concepts/{concept.id}/versions/{foreign.id}").status_code == 404


def _locked_setup(db):
    """L1 is unmastered, so L2 is locked while progression is enforced."""
    leaves = []
    for i in (1, 2):
        leaf = _leaf(db, f"L{i}", i)
        for j, label in enumerate(["BASIC", "NCERT_LEVEL", "ADVANCED", "CURRENT_AFFAIRS", "EXAMINER_TRAPS"]):
            db.add(GsLmsContentSection(
                syllabus_node_id=leaf.id, section_label=GsLmsSectionLabelEnum(label), title=label,
                blocks=[{"type": "text", "content": "x"}], display_order=j,
                review_status=GsReviewStatusEnum.REVIEWED, authored=True))
        for j in range(5):
            db.add(GsLmsMcqQuestion(
                syllabus_node_id=leaf.id, question_text=f"{leaf.title} q{j}",
                options=[{"label": "A", "text": "a"}, {"label": "B", "text": "b"}], correct_option="A",
                question_type=GsLmsQuestionTypeEnum.FACTUAL, display_order=j,
                review_status=GsReviewStatusEnum.REVIEWED))
        leaves.append(leaf)
    db.flush()
    return leaves


def test_locked_leaf_returns_423_on_both_version_endpoints(client, db, monkeypatch):
    monkeypatch.setattr(settings, "GS_LMS_ENFORCE_PROGRESSION", True)
    monkeypatch.setattr(settings, "GS_LMS_PROGRESSION_START", None)
    l1, l2 = _locked_setup(db)
    c1, c2 = _concept(db, l1, "C1"), _concept(db, l2, "C2")
    v1, v2 = _version(db, c1), _version(db, c2)
    db.commit()
    assert client.get(f"{BASE}/concepts/{c2.id}/version").status_code == 423
    assert client.get(f"{BASE}/concepts/{c2.id}/versions/{v2.id}").status_code == 423
    # The first topic is open.
    assert client.get(f"{BASE}/concepts/{c1.id}/version").status_code == 200
    assert client.get(f"{BASE}/concepts/{c1.id}/versions/{v1.id}").status_code == 200


def test_unlocked_when_progression_is_off(client, db, monkeypatch):
    monkeypatch.setattr(settings, "GS_LMS_ENFORCE_PROGRESSION", False)
    _, l2 = _locked_setup(db)
    c2 = _concept(db, l2, "C2")
    _version(db, c2)
    db.commit()
    assert client.get(f"{BASE}/concepts/{c2.id}/version").status_code == 200


# ---------------------------------------------------------------------------
# API: concepts endpoint extras
# ---------------------------------------------------------------------------

def test_concepts_endpoint_has_versions_count_and_book_refs(client, db):
    leaf = _leaf(db)
    c1, c2 = _concept(db, leaf, "C1"), _concept(db, leaf, "C2")
    _version(db, c1, L.BASIC)
    _version(db, c1, L.STANDARD)
    _version(db, c1, L.ADVANCED, reviewed=False)  # does not count
    book, (ch1, ch2) = _book(db, chapters=(1, 2))
    db.add(GsLmsConceptBookRef(concept_id=c1.id, chapter_id=ch2.id, pages="12-15"))
    db.add(GsLmsConceptBookRef(concept_id=c1.id, chapter_id=ch1.id))
    db.commit()
    r = client.get(f"{BASE}/topics/{leaf.id}/concepts")
    assert r.status_code == 200, r.text
    items = {c["title"]: c for c in r.json()["data"]["concepts"]}
    assert items["C1"]["versions_count"] == 2 and items["C2"]["versions_count"] == 0
    assert items["C2"]["book_refs"] == []
    assert items["C1"]["book_refs"] == [
        {"book_slug": "b1", "book_title": "Indian Polity", "edition": "7th", "chapter_number": 1,
         "chapter_title": "Ch 1", "pages": None},
        {"book_slug": "b1", "book_title": "Indian Polity", "edition": "7th", "chapter_number": 2,
         "chapter_title": "Ch 2", "pages": "12-15"},
    ]
