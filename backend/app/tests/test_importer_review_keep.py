"""Re-importing as UNREVIEWED keeps approvals for unchanged content."""

from __future__ import annotations

import copy
import json

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.main  # noqa: F401  (registers every model on Base.metadata)
from app.core.gs.models import GsReviewStatusEnum, GsSubject
from app.core.gs_lms.importer import DEFAULT_ARTIFACT_PATH, import_gs_subject
from app.core.gs_lms.models import (
    GsLmsConcept,
    GsLmsConceptVersion,
    GsLmsContentSection,
    GsLmsMcqQuestion,
    GsLmsPyq,
    GsLmsSyllabusNode,
)
from app.db.session import Base

TEMPLATE_PATH = DEFAULT_ARTIFACT_PATH.parent / "templates" / "gs_subject_template.json"
REVIEWED, UNREVIEWED = GsReviewStatusEnum.REVIEWED, GsReviewStatusEnum.UNREVIEWED
MODELS = [GsLmsSyllabusNode, GsLmsContentSection, GsLmsMcqQuestion, GsLmsPyq, GsLmsConcept, GsLmsConceptVersion]


@pytest.fixture()
def db():
    engine = create_engine("sqlite:///:memory:", future=True, connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)() as session:
        session.add(GsSubject(id=1, slug="polity-governance", name="Polity", display_order=1))
        session.commit()
        yield session


def _data() -> dict:
    return json.loads(TEMPLATE_PATH.read_text(encoding="utf-8"))


def _leaf(data: dict) -> dict:
    return data["tree"][0]["children"][0]["children"][0]


def _approve_all(db) -> None:
    for model in MODELS:
        for row in db.query(model).all():
            row.review_status = REVIEWED
    db.commit()


def _statuses(db, model) -> list[GsReviewStatusEnum]:
    return [r.review_status for r in db.query(model).all()]


def test_unchanged_reimport_keeps_every_approval(db):
    data = _data()
    import_gs_subject(db, data)
    db.commit()
    _approve_all(db)
    import_gs_subject(db, copy.deepcopy(data))
    db.commit()
    for model in MODELS:
        statuses = _statuses(db, model)
        assert statuses and set(statuses) == {REVIEWED}, model.__name__


def test_editing_one_mcq_resets_only_that_mcq(db):
    data = _data()
    import_gs_subject(db, data)
    db.commit()
    _approve_all(db)

    edited = copy.deepcopy(data)
    edited_text = _leaf(edited)["mcq_questions"][3]["question_text"]
    _leaf(edited)["mcq_questions"][3]["explanation"] = "A corrected explanation."
    import_gs_subject(db, edited)
    db.commit()

    mcqs = db.query(GsLmsMcqQuestion).all()
    assert [m.question_text for m in mcqs if m.review_status == UNREVIEWED] == [edited_text]
    assert sum(m.review_status == REVIEWED for m in mcqs) == len(mcqs) - 1
    for model in MODELS:
        if model is not GsLmsMcqQuestion:
            assert set(_statuses(db, model)) == {REVIEWED}, model.__name__


def test_editing_a_section_concept_or_version_resets_that_row(db):
    data = _data()
    import_gs_subject(db, data)
    db.commit()
    _approve_all(db)

    edited = copy.deepcopy(data)
    leaf = _leaf(edited)
    leaf["content_sections"][0]["blocks"][0]["text"] = "Changed text."
    leaf["concepts"][0]["key_points"] = leaf["concepts"][0]["key_points"] + ["one more point"]
    leaf["concepts"][1]["versions"][0]["title"] = "A new heading"
    import_gs_subject(db, edited)
    db.commit()

    assert [s.review_status for s in db.query(GsLmsContentSection).all()].count(UNREVIEWED) == 1
    assert [c.review_status for c in db.query(GsLmsConcept).all()].count(UNREVIEWED) == 1
    assert [v.review_status for v in db.query(GsLmsConceptVersion).all()].count(UNREVIEWED) == 1
    assert set(_statuses(db, GsLmsSyllabusNode)) == {REVIEWED}


def test_new_rows_are_unreviewed_and_reviewed_import_still_approves(db):
    data = _data()
    import_gs_subject(db, data)
    db.commit()
    _approve_all(db)

    grown = copy.deepcopy(data)
    _leaf(grown)["mcq_questions"].append(copy.deepcopy(_leaf(grown)["mcq_questions"][0]) | {"question_text": "A brand new question?"})
    import_gs_subject(db, grown)
    db.commit()
    new = db.query(GsLmsMcqQuestion).filter_by(question_text="A brand new question?").one()
    assert new.review_status == UNREVIEWED

    import_gs_subject(db, grown, review_status="REVIEWED")
    db.commit()
    for model in MODELS:
        assert set(_statuses(db, model)) == {REVIEWED}, model.__name__


def test_unreviewed_content_stays_unreviewed_on_reimport(db):
    data = _data()
    import_gs_subject(db, data)
    import_gs_subject(db, data)
    db.commit()
    for model in MODELS:
        assert set(_statuses(db, model)) == {UNREVIEWED}, model.__name__
