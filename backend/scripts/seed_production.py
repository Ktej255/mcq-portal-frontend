#!/usr/bin/env python3
"""Idempotent production seed for the GS Geography LMS.

Consolidates every step needed to bring a database (SQLite local OR RDS
PostgreSQL) to the current content state:

  1. Ensure all GS LMS tables exist (create_all — additive, never drops).
  2. Ensure the additive ``gs_paper`` column on ``gs_lms_pyqs`` (SQLite only;
     PostgreSQL is handled by Alembic).
  3. Ensure all GS subject rows exist, resolving their database IDs by stable slug.
  4. Import the merged ``gs_geography_syllabus.json`` as REVIEWED in place
     (idempotent importer — existing nodes/sections are updated by natural
     key, so learner progress and record IDs survive).
  5. Retire (hide, never delete) LEAF_TOPIC nodes that have no content
     sections, left over from earlier "Lecture N" titles that were
     renamed/restructured. Learner rows may reference those nodes, so they
     are marked UNREVIEWED instead of being deleted.
  6. Upsert the CSAT syllabus tree in place by natural key. Nodes and
     sections that are no longer part of the canonical tree are hidden
     (UNREVIEWED), never deleted, so learner progress stays resolvable.

Usage:
    # DATABASE_URL must be supplied by the operator environment or approved
    # secret injection mechanism before invoking this script. Seeding
    # replaces the reviewed content of the beta subjects, so the operator
    # must explicitly acknowledge the replacement:
    ALLOW_DESTRUCTIVE_SEED=true python scripts/seed_production.py

The script refuses to write anything unless the explicit confirmation flag is
present. Nothing is deleted: Geography and CSAT content are refreshed in
place, learner progress survives, and rows that fall out of the canonical
tree are hidden rather than removed. Failures abort the transaction rather
than being swallowed.
"""
from __future__ import annotations

import os
import sys
from datetime import datetime, timezone

if not os.environ.get("DATABASE_URL"):
    print("ERROR: DATABASE_URL must be supplied by the operator environment.", file=sys.stderr)
    raise SystemExit(2)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import bindparam, text

from app.db.session import Base, SessionLocal, engine

# Register the full model graph on Base.metadata.
import app.models.domain  # noqa: F401
import app.core.gs.models  # noqa: F401
import app.core.gs_lms.models  # noqa: F401
import app.core.gs_lms.student_models  # noqa: F401

from app.core.gs.models import GsSubject, GsReviewStatusEnum
from app.core.gs_lms.importer import import_gs_geography
from app.core.gs_lms.models import (
    GsLmsSyllabusNode,
    GsLmsContentSection,
    GsLmsNodeTypeEnum,
    GsLmsSectionLabelEnum,
)

SUBJECT_SLUG = "geography"
DESTRUCTIVE_CONFIRMATION_ENV = "ALLOW_DESTRUCTIVE_SEED"


def _require_destructive_confirmation() -> None:
    """Require an explicit operator acknowledgement before any DB write."""
    if os.environ.get(DESTRUCTIVE_CONFIRMATION_ENV, "").lower() != "true":
        print(
            f"ERROR: set {DESTRUCTIVE_CONFIRMATION_ENV}=true to acknowledge "
            "replacing reviewed content in place (no learner rows are deleted).",
            file=sys.stderr,
        )
        raise SystemExit(2)


def _ensure_gs_paper_column(connection) -> None:
    """Add the nullable gs_paper column using the seed transaction connection."""
    if engine.dialect.name == "postgresql":
        print("  [skip] PostgreSQL — gs_paper handled by Alembic")
        return
    cols = [
        row[1]
        for row in connection.execute(text("PRAGMA table_info('gs_lms_pyqs')"))
    ]
    if cols and "gs_paper" not in cols:
        connection.execute(text("ALTER TABLE gs_lms_pyqs ADD COLUMN gs_paper VARCHAR"))
        print("  [added] gs_lms_pyqs.gs_paper")
    else:
        print("  [ok] gs_lms_pyqs.gs_paper present")


def _ensure_subjects(session) -> dict[str, int]:
    """Ensure core GS subjects exist and return IDs resolved by stable slug."""
    now = datetime.now(timezone.utc)
    subjects_to_seed = [
        {"slug": "geography", "name": "Geography", "desc": "GS Paper 1 - Geography (Physical, Human, Indian)", "order": 1},
        {"slug": "polity-governance", "name": "Polity & Governance", "desc": "GS Paper 2 - Indian Constitution, Polity, Governance", "order": 2},
        {"slug": "economy", "name": "Economy", "desc": "GS Paper 3 - Economic Development, Budgeting, Planning", "order": 3},
        {"slug": "history", "name": "History", "desc": "GS Paper 1 - Ancient, Medieval, Modern History and Art & Culture", "order": 4},
        {"slug": "science-tech", "name": "Science & Tech", "desc": "GS Paper 3 - Science & Technology developments", "order": 5},
        {"slug": "environment", "name": "Environment", "desc": "GS Paper 3 - Environment, Ecology, Biodiversity", "order": 6},
        {"slug": "disaster-management", "name": "Disaster Management", "desc": "GS Paper 3 - Disaster Management framework", "order": 7},
        {"slug": "internal-security-society", "name": "Internal Security & Society", "desc": "GS Paper 3 Internal Security + GS Paper 1 Indian Society", "order": 8},
        {"slug": "csat", "name": "CSAT", "desc": "Civil Services Aptitude Test - Paper 2 (Qualifying)", "order": 9},
    ]

    subject_ids: dict[str, int] = {}
    for s_info in subjects_to_seed:
        existing = (
            session.query(GsSubject)
            .filter(GsSubject.slug == s_info["slug"])
            .one_or_none()
        )
        if existing is None:
            subject = GsSubject(
                slug=s_info["slug"],
                name=s_info["name"],
                description=s_info["desc"],
                display_order=s_info["order"],
                is_complete=False,
                created_at=now,
                updated_at=now,
            )
            session.add(subject)
            session.flush()
            existing = subject
            print(f"  [created] gs_subjects '{s_info['slug']}' (id={existing.id})")
        else:
            existing.name = s_info["name"]
            existing.description = s_info["desc"]
            existing.display_order = s_info["order"]
            print(f"  [ok] gs_subjects '{s_info['slug']}' exists (id={existing.id})")
        subject_ids[s_info["slug"]] = existing.id
    return subject_ids


def _ensure_csat_syllabus(session, csat_subject_id: int) -> dict[str, int]:
    """Upsert the CSAT syllabus tree in place, preserving learner references.

    Nodes are matched by natural key (subject + parent + title), sections by
    (node + label). Existing IDs are never rotated, so progress, recall and
    lab rows that point at them stay resolvable. Nodes that are no longer
    part of the canonical tree are hidden (UNREVIEWED) rather than deleted.
    """
    csat_subject = session.query(GsSubject).filter(GsSubject.id == csat_subject_id).one()

    csat_data = {
        "Quantitative Aptitude": [
            "Number System",
            "HCF & LCM",
            "Percentages",
            "Profit & Loss",
            "Simple & Compound Interest",
            "Ratio & Proportion & Partnership",
            "Averages & Mixtures",
            "Time & Work",
            "Time, Speed & Distance",
            "Permutations & Combinations",
            "Probability",
            "Data Interpretation",
        ],
        "Logical Reasoning": [
            "Syllogisms",
            "Blood Relations",
            "Coding-Decoding",
            "Direction Sense Test",
            "Seating Arrangement",
            "Puzzle Test",
            "Clocks & Calendars",
            "Non-Verbal Reasoning",
            "Critical Reasoning",
        ],
        "Reading Comprehension": [
            "Inference-based questions",
            "Theme-based questions",
            "Title-based questions",
            "Assumption-based questions",
            "Critical Analysis",
        ]
    }

    now = datetime.now(timezone.utc)
    counts = {"created_nodes": 0, "updated_nodes": 0, "hidden_nodes": 0}
    canonical_node_ids: set[int] = set()

    def upsert_node(*, parent_id, title, node_type, display_order):
        node = (
            session.query(GsLmsSyllabusNode)
            .filter(
                GsLmsSyllabusNode.subject_id == csat_subject.id,
                GsLmsSyllabusNode.parent_id.is_(None)
                if parent_id is None
                else GsLmsSyllabusNode.parent_id == parent_id,
                GsLmsSyllabusNode.title == title,
                GsLmsSyllabusNode.node_type == node_type,
            )
            .one_or_none()
        )
        if node is None:
            node = GsLmsSyllabusNode(
                subject_id=csat_subject.id,
                parent_id=parent_id,
                title=title,
                node_type=node_type,
                weight=1.0,
                display_order=display_order,
                review_status=GsReviewStatusEnum.REVIEWED,
                created_by="csat-seeder",
                updated_by="csat-seeder",
                created_at=now,
                updated_at=now,
            )
            session.add(node)
            session.flush()
            counts["created_nodes"] += 1
        else:
            node.display_order = display_order
            node.review_status = GsReviewStatusEnum.REVIEWED
            node.updated_by = "csat-seeder"
            node.updated_at = now
            counts["updated_nodes"] += 1
        canonical_node_ids.add(node.id)
        return node

    for mega_order, (mega_title, sub_topics) in enumerate(csat_data.items(), start=1):
        mega_node = upsert_node(
            parent_id=None,
            title=mega_title,
            node_type=GsLmsNodeTypeEnum.MEGA_TOPIC,
            display_order=mega_order,
        )

        for sub_order, sub_title in enumerate(sub_topics, start=1):
            sub_node = upsert_node(
                parent_id=mega_node.id,
                title=sub_title,
                node_type=GsLmsNodeTypeEnum.LEAF_TOPIC,
                display_order=sub_order,
            )

            for label_idx, label in enumerate([
                GsLmsSectionLabelEnum.BASIC,
                GsLmsSectionLabelEnum.ADVANCED,
                GsLmsSectionLabelEnum.NCERT_LEVEL,
                GsLmsSectionLabelEnum.EXAMINER_TRAPS,
            ], start=1):
                section = (
                    session.query(GsLmsContentSection)
                    .filter(
                        GsLmsContentSection.syllabus_node_id == sub_node.id,
                        GsLmsContentSection.section_label == label,
                    )
                    .one_or_none()
                )
                blocks = [
                    {
                        "type": "markdown",
                        "content": f"### Introduction to {sub_title} ({label.value})\n\nDetailed conceptual discussion for this CSAT section."
                    }
                ]
                if section is None:
                    session.add(
                        GsLmsContentSection(
                            syllabus_node_id=sub_node.id,
                            section_label=label,
                            title=f"{label.value} section",
                            blocks=blocks,
                            display_order=label_idx,
                            review_status=GsReviewStatusEnum.REVIEWED,
                            authored=True,
                            created_by="csat-seeder",
                            updated_by="csat-seeder",
                            created_at=now,
                            updated_at=now,
                        )
                    )
                else:
                    section.title = f"{label.value} section"
                    section.blocks = blocks
                    section.display_order = label_idx
                    section.review_status = GsReviewStatusEnum.REVIEWED
                    section.updated_by = "csat-seeder"
                    section.updated_at = now
        session.flush()

    stale_nodes = (
        session.query(GsLmsSyllabusNode)
        .filter(
            GsLmsSyllabusNode.subject_id == csat_subject.id,
            GsLmsSyllabusNode.id.notin_(canonical_node_ids),
            GsLmsSyllabusNode.review_status != GsReviewStatusEnum.UNREVIEWED,
        )
        .all()
    )
    for stale in stale_nodes:
        stale.review_status = GsReviewStatusEnum.UNREVIEWED
        stale.updated_by = "csat-seeder"
        stale.updated_at = now
    counts["hidden_nodes"] = len(stale_nodes)
    session.flush()
    return counts


def _retire_orphan_nodes(session, subject_id: int) -> int:
    """Hide (but never delete) LEAF_TOPIC nodes with no content sections.

    After renaming/restructuring, the importer creates new nodes (matched by
    title+parent) and leaves old ones without sections. Those old nodes may
    still be referenced by learner rows (progress, recall attempts, lab
    sessions, growth reports). Deleting them would silently destroy learner
    history, so they are marked UNREVIEWED — invisible to students while
    keeping every reference resolvable.
    """
    orphan_ids = [r[0] for r in session.execute(text(
        "SELECT n.id FROM gs_lms_syllabus_nodes n "
        "WHERE n.subject_id = :sid AND n.node_type = 'LEAF_TOPIC' "
        "AND NOT EXISTS (SELECT 1 FROM gs_lms_content_sections s "
        "WHERE s.syllabus_node_id = n.id)"
    ), {"sid": subject_id})]
    if not orphan_ids:
        return 0
    session.execute(
        text(
            "UPDATE gs_lms_syllabus_nodes "
            "SET review_status = 'UNREVIEWED' "
            "WHERE id IN :ids AND review_status != 'UNREVIEWED'"
        ).bindparams(bindparam("ids", expanding=True)),
        {"ids": orphan_ids},
    )
    session.flush()
    return len(orphan_ids)


def main() -> None:
    _require_destructive_confirmation()
    print("DB: configured via operator-supplied DATABASE_URL")

    session = SessionLocal()
    try:
        # Keep additive schema setup and every destructive content operation in
        # one explicit transaction. A later import/cleanup failure therefore
        # cannot leave the replacement half-applied.
        session.begin()
        connection = session.connection()

        print("Step 1: ensure tables")
        Base.metadata.create_all(connection)
        print("Step 2: ensure gs_paper column")
        _ensure_gs_paper_column(connection)

        print("Step 3: ensure all GS subjects exist")
        subject_ids = _ensure_subjects(session)
        geography_subject_id = subject_ids[SUBJECT_SLUG]

        print("Step 4: import geography content in place (REVIEWED)")
        result = import_gs_geography(session, review_status="REVIEWED")

        print("Step 5: retire orphan nodes for geography (hide, never delete)")
        retired = _retire_orphan_nodes(session, geography_subject_id)
        print(f"  [retired] {retired} orphan leaf nodes")

        print("Step 6: seed CSAT syllabus tree in place (hide, never delete)")
        csat_counts = _ensure_csat_syllabus(session, subject_ids["csat"])
        print(
            "  [csat] "
            f"{csat_counts['created_nodes']} nodes created, "
            f"{csat_counts['updated_nodes']} nodes updated, "
            f"{csat_counts['hidden_nodes']} stale nodes hidden"
        )

        session.commit()
    except Exception as exc:
        try:
            session.rollback()
        except Exception as rollback_exc:
            # Do not print exception text: DB driver errors can contain
            # connection details. Exit non-zero and make unknown state clear.
            print(
                "ERROR: seed failed and rollback also failed "
                f"({type(exc).__name__}/{type(rollback_exc).__name__}); "
                "database state is unknown.",
                file=sys.stderr,
            )
            raise SystemExit(1) from None
        # The original exception is intentionally represented by type only so
        # operator-supplied DATABASE_URL values never enter CLI output.
        print(
            f"ERROR: seed failed ({type(exc).__name__}); transaction rolled back.",
            file=sys.stderr,
        )
        raise SystemExit(1) from None
    finally:
        session.close()

    print("\n=== Seed complete (REVIEWED) ===")
    for k, v in result.items():
        print(f"  {k:<22} {v}")


if __name__ == "__main__":
    main()
