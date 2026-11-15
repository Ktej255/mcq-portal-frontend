"""CSAT seeding must refresh in place, never delete learner references.

The production seed used to delete and rebuild every CSAT node and section on
each run, which can silently orphan progress, recall and lab rows. These
tests pin the replacement contract: match by natural key, keep IDs stable,
restore canonical copy, hide (never delete) nodes that fall out of the tree.
"""

from __future__ import annotations

import importlib
import sys
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base
from app.core.gs.models import GsSubject, GsReviewStatusEnum
from app.core.gs_lms.models import (
    GsLmsSyllabusNode,
    GsLmsContentSection,
    GsLmsNodeTypeEnum,
    GsLmsSectionLabelEnum,
)
from app.core.gs_lms.student_models import GsLmsStudentSectionProgress
from app.models.domain import User, RoleEnum  # noqa: F401

_REQUIRED_TABLES = (
    "users",
    "gs_subjects",
    "gs_lms_syllabus_nodes",
    "gs_lms_content_sections",
    "gs_lms_student_section_progress",
)


@pytest.fixture()
def seed_module(tmp_path, monkeypatch):
    """Import the script without consulting a repository environment file."""
    backend_dir = Path(__file__).resolve().parents[2]
    monkeypatch.syspath_prepend(str(backend_dir))
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")
    sys.modules.pop("scripts.seed_production", None)
    return importlib.import_module("scripts.seed_production")


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
                google_uid="csat-seed-test-uid",
                email="csat-seed@upsc.local",
                full_name="CSAT Seed Test Student",
                role=RoleEnum.STUDENT,
            )
        )
        session.add(
            GsSubject(id=1, slug="csat", name="CSAT", display_order=9)
        )
        session.add(
            GsSubject(id=2, slug="geography", name="Geography", display_order=1)
        )
        session.flush()
        yield session
    finally:
        session.close()


def _add_stale_csat_node_with_progress(session):
    """Simulate a learner-linked node that fell out of the canonical tree.

    The old seeder deleted this node and its section, orphaning the progress
    row. The in-place seeder must keep both and only hide the node.
    """
    node = GsLmsSyllabusNode(
        subject_id=1,
        parent_id=None,
        title="Retired CSAT topic",
        node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
        weight=1.0,
        display_order=999,
        review_status=GsReviewStatusEnum.REVIEWED,
        created_by="operator",
        updated_by="operator",
    )
    session.add(node)
    session.flush()
    section = GsLmsContentSection(
        syllabus_node_id=node.id,
        section_label=GsLmsSectionLabelEnum.BASIC,
        title="Retired section",
        blocks=[{"type": "markdown", "content": "Retired copy"}],
        display_order=1,
        review_status=GsReviewStatusEnum.REVIEWED,
        authored=True,
        created_by="operator",
        updated_by="operator",
    )
    session.add(section)
    session.flush()
    progress = GsLmsStudentSectionProgress(
        student_id=1,
        section_id=section.id,
        syllabus_node_id=node.id,
        completed=True,
    )
    session.add(progress)
    session.flush()
    return node.id, section.id, progress.id


def test_csat_seed_is_idempotent_and_preserves_ids(seed_module, db_session):
    first = seed_module._ensure_csat_syllabus(db_session, 1)
    assert first == {"created_nodes": 29, "updated_nodes": 0, "hidden_nodes": 0}
    db_session.flush()

    node_ids = {
        (n.parent_id, n.title): n.id
        for n in db_session.query(GsLmsSyllabusNode).all()
    }
    number_system = (
        db_session.query(GsLmsSyllabusNode)
        .filter(GsLmsSyllabusNode.title == "Number System")
        .one()
    )
    section_ids = {
        (s.syllabus_node_id, s.section_label): s.id
        for s in db_session.query(GsLmsContentSection)
        .filter(GsLmsContentSection.syllabus_node_id == number_system.id)
        .all()
    }
    assert len(section_ids) == 4

    # Simulate an out-of-date edit; the canonical refresh must rewrite it.
    basic = (
        db_session.query(GsLmsContentSection)
        .filter(
            GsLmsContentSection.syllabus_node_id == number_system.id,
            GsLmsContentSection.section_label == GsLmsSectionLabelEnum.BASIC,
        )
        .one()
    )
    basic.blocks = [{"type": "markdown", "content": "stale copy"}]
    db_session.flush()

    second = seed_module._ensure_csat_syllabus(db_session, 1)
    assert second == {"created_nodes": 0, "updated_nodes": 29, "hidden_nodes": 0}
    db_session.flush()

    assert {
        (n.parent_id, n.title): n.id
        for n in db_session.query(GsLmsSyllabusNode).all()
    } == node_ids
    assert (
        db_session.query(GsLmsContentSection)
        .filter(GsLmsContentSection.syllabus_node_id == number_system.id)
        .count()
    ) == 4
    assert basic.blocks[0]["content"].startswith("### Introduction to Number System")
    assert db_session.query(GsLmsContentSection).count() == 104


def test_csat_seed_hides_stale_nodes_instead_of_deleting_learner_links(
    seed_module, db_session
):
    stale_node_id, stale_section_id, progress_id = (
        _add_stale_csat_node_with_progress(db_session)
    )

    result = seed_module._ensure_csat_syllabus(db_session, 1)
    db_session.flush()

    assert result["hidden_nodes"] == 1
    stale_node = db_session.get(GsLmsSyllabusNode, stale_node_id)
    assert stale_node is not None
    assert stale_node.review_status == GsReviewStatusEnum.UNREVIEWED
    assert db_session.get(GsLmsContentSection, stale_section_id) is not None
    progress = db_session.get(GsLmsStudentSectionProgress, progress_id)
    assert progress is not None
    assert progress.section_id == stale_section_id
    assert progress.syllabus_node_id == stale_node_id

    # A later refresh neither recreates the hidden node nor counts it again.
    again = seed_module._ensure_csat_syllabus(db_session, 1)
    assert again == {"created_nodes": 0, "updated_nodes": 29, "hidden_nodes": 0}


def test_csat_seed_leaves_other_subjects_untouched(seed_module, db_session):
    geography_node = GsLmsSyllabusNode(
        subject_id=2,
        title="Geography operator topic",
        node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
        weight=1.0,
        display_order=1,
        review_status=GsReviewStatusEnum.REVIEWED,
        created_by="operator",
        updated_by="operator",
    )
    db_session.add(geography_node)
    db_session.flush()

    seed_module._ensure_csat_syllabus(db_session, 1)
    db_session.flush()

    assert db_session.get(GsLmsSyllabusNode, geography_node.id).review_status == (
        GsReviewStatusEnum.REVIEWED
    )
