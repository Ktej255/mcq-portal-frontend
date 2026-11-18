"""Regression tests for the GS Geography LMS seed/refresh path.

The coverage page tells operators to "re-run the GS LMS importer" after
authoring content. These tests pin the properties that make that instruction
safe:

  - a refresh updates content by natural key and never clears tables, so
    syllabus node / content section IDs and the learner progress rows that
    reference them survive;
  - a refresh is idempotent (second run creates nothing);
  - a missing subject fails with an actionable message instead of a raw
    foreign-key error;
  - structurally malformed MCQs are rejected before any row is written, so
    broken authoring output cannot be stamped REVIEWED and shown to learners.
"""

from __future__ import annotations

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base
from app.core.gs.models import GsSubject, GsReviewStatusEnum
from app.core.gs_lms.models import (
    GsLmsSyllabusNode,
    GsLmsContentSection,
    GsLmsMcqQuestion,
    GsLmsNodeTypeEnum,
    GsLmsSectionLabelEnum,
)
from app.core.gs_lms.student_models import GsLmsStudentSectionProgress
from app.core.gs_lms.importer import import_mcq_questions
from app.core.gs_lms.data.import_geography import run_import

# Ensure every FK target model is registered on Base.metadata.
from app.models.domain import User, RoleEnum  # noqa: F401
from app.core.gs_lms import models as _gs_lms_models  # noqa: F401
from app.core.gs_lms import student_models as _gs_lms_student  # noqa: F401


_REQUIRED_TABLES = (
    "users",
    "gs_subjects",
    "gs_day_lessons",
    "gs_lms_syllabus_nodes",
    "gs_lms_content_sections",
    "gs_lms_pyqs",
    "gs_lms_mcq_questions",
    "gs_lms_student_section_progress",
)


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    tables = [
        table
        for name, table in Base.metadata.tables.items()
        if name in _REQUIRED_TABLES
    ]
    Base.metadata.create_all(engine, tables=tables)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = SessionLocal()
    try:
        session.add(
            User(
                id=1,
                google_uid="gs-lms-import-test-uid",
                email="gs-lms-import@upsc.local",
                full_name="GS LMS Import Test Student",
                role=RoleEnum.STUDENT,
            )
        )
        session.add(
            GsSubject(id=1, slug="geography", name="Geography", display_order=1)
        )
        session.flush()
        yield session
    finally:
        session.close()


def _add_operator_only_topic(session) -> tuple[int, int]:
    """Add rows that exist only in the DB, never in the JSON artifact.

    A destructive pre-import clear would delete these; an in-place refresh
    must leave them untouched with stable IDs.
    """
    node = GsLmsSyllabusNode(
        subject_id=1,
        title="Operator-authored local topic (not in artifact)",
        node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
        weight=1.0,
        display_order=9999,
        review_status=GsReviewStatusEnum.REVIEWED,
        created_by="test",
        updated_by="test",
    )
    session.add(node)
    session.flush()

    section = GsLmsContentSection(
        syllabus_node_id=node.id,
        section_label=GsLmsSectionLabelEnum.BASIC,
        title="Operator-authored local section",
        blocks=[{"type": "paragraph", "text": "Local authoring draft."}],
        display_order=1,
        review_status=GsReviewStatusEnum.REVIEWED,
        authored=True,
        created_by="test",
        updated_by="test",
    )
    session.add(section)
    session.flush()
    return node.id, section.id


# ===========================================================================
# Non-destructive refresh
# ===========================================================================


def test_refresh_preserves_ids_content_and_learner_progress(db_session):
    first = run_import(db_session)
    db_session.commit()
    assert first["nodes_created"] > 0
    assert first["review_status"] == "REVIEWED"

    node_ids_before = {
        row.id for row in db_session.query(GsLmsSyllabusNode.id).all()
    }
    section_ids_before = {
        row.id for row in db_session.query(GsLmsContentSection.id).all()
    }

    # A learner has completed a real, artifact-backed section.
    section = (
        db_session.query(GsLmsContentSection)
        .order_by(GsLmsContentSection.id)
        .first()
    )
    progress = GsLmsStudentSectionProgress(
        student_id=1,
        section_id=section.id,
        syllabus_node_id=section.syllabus_node_id,
        completed=True,
    )
    db_session.add(progress)

    # An operator has added local content that is not in the artifact.
    local_node_id, local_section_id = _add_operator_only_topic(db_session)
    db_session.commit()

    nodes_before = db_session.query(GsLmsSyllabusNode).count()
    sections_before = db_session.query(GsLmsContentSection).count()

    second = run_import(db_session)
    db_session.commit()

    # The refresh creates nothing; it only updates matched rows.
    assert second["nodes_created"] == 0
    assert second["sections_created"] == 0
    assert second["pyqs_created"] == 0
    assert second["mcqs_created"] == 0
    assert second["nodes_updated"] > 0

    # No row was deleted and no ID rotated.
    assert db_session.query(GsLmsSyllabusNode).count() == nodes_before
    assert db_session.query(GsLmsContentSection).count() == sections_before
    assert {row.id for row in db_session.query(GsLmsSyllabusNode.id).all()} == (
        node_ids_before | {local_node_id}
    )
    assert {row.id for row in db_session.query(GsLmsContentSection.id).all()} == (
        section_ids_before | {local_section_id}
    )

    # Local authoring survived.
    local_node = db_session.get(GsLmsSyllabusNode, local_node_id)
    assert local_node is not None
    assert local_node.title.startswith("Operator-authored local topic")
    assert db_session.get(GsLmsContentSection, local_section_id) is not None

    # The learner's progress still points at a live section on the same node.
    stored = db_session.query(GsLmsStudentSectionProgress).one()
    assert stored.completed is True
    assert stored.section_id == section.id
    live_section = db_session.get(GsLmsContentSection, stored.section_id)
    assert live_section is not None
    assert live_section.syllabus_node_id == stored.syllabus_node_id


def test_run_import_refuses_missing_subject_with_actionable_error():
    engine = create_engine(
        "sqlite:///:memory:",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    tables = [
        table
        for name, table in Base.metadata.tables.items()
        if name in _REQUIRED_TABLES
    ]
    Base.metadata.create_all(engine, tables=tables)
    session = sessionmaker(bind=engine, autoflush=False, autocommit=False)()

    try:
        with pytest.raises(ValueError, match="Seed the GS subject"):
            run_import(session)
        assert session.query(GsLmsSyllabusNode).count() == 0
    finally:
        session.close()


# ===========================================================================
# MCQ structural validation
# ===========================================================================


def _valid_question() -> dict:
    return {
        "question_text": "Which agent is primarily responsible for erosion?",
        "options": [
            {"label": "A", "text": "Flowing water"},
            {"label": "B", "text": "Moonlight"},
            {"label": "C", "text": "Sunlight"},
            {"label": "D", "text": "Vacuum"},
        ],
        "correct_option": "A",
        "explanation": "Water is a primary erosional agent.",
        "question_type": "FACTUAL",
        "display_order": 1,
    }


def _leaf_node(session) -> int:
    node = GsLmsSyllabusNode(
        subject_id=1,
        title="MCQ validation leaf",
        node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
        weight=1.0,
        display_order=1,
        review_status=GsReviewStatusEnum.UNREVIEWED,
        created_by="test",
        updated_by="test",
    )
    session.add(node)
    session.flush()
    return node.id


def _drop_an_option(q):
    q["options"] = q["options"][:3]


def _wrong_correct_option(q):
    q["correct_option"] = "E"


def _duplicate_option_label(q):
    q["options"][1]["label"] = "A"


def _empty_option_text(q):
    q["options"][0]["text"] = "   "


def _blank_question_text(q):
    q["question_text"] = "   "


@pytest.mark.parametrize(
    ("mutate", "message"),
    [
        (_drop_an_option, "exactly 4 options"),
        (_wrong_correct_option, "does not match any option label"),
        (_duplicate_option_label, "labels must be unique"),
        (_empty_option_text, "has empty text"),
        (_blank_question_text, "question_text must be a non-empty string"),
    ],
)
def test_malformed_mcq_is_rejected_before_any_write(db_session, mutate, message):
    node_id = _leaf_node(db_session)
    question = _valid_question()
    mutate(question)

    with pytest.raises(ValueError, match=message):
        import_mcq_questions(db_session, [question], node_id)

    assert db_session.query(GsLmsMcqQuestion).count() == 0


def test_duplicate_question_text_in_batch_is_rejected(db_session):
    node_id = _leaf_node(db_session)
    batch = [_valid_question(), _valid_question()]

    with pytest.raises(ValueError, match="duplicate question_text"):
        import_mcq_questions(db_session, batch, node_id)

    assert db_session.query(GsLmsMcqQuestion).count() == 0


def test_valid_batch_still_imports_as_reviewed(db_session):
    node_id = _leaf_node(db_session)
    second = _valid_question()
    second["question_text"] = "Which rock type forms from cooling lava?"
    second["correct_option"] = "C"
    second["display_order"] = 2

    result = import_mcq_questions(
        db_session, [_valid_question(), second], node_id, review_status="REVIEWED"
    )
    db_session.commit()

    assert result == {"created": 2, "updated": 0}
    rows = db_session.query(GsLmsMcqQuestion).all()
    assert len(rows) == 2
    assert all(row.review_status == GsReviewStatusEnum.REVIEWED for row in rows)
