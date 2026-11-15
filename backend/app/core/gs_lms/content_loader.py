"""Load the reviewed Geography content into the database.

One implementation for every way the content gets loaded: the operator
script (``scripts/seed_production.py``) and the admin endpoint an operator
can press a button for once the backend is deployed. It is safe to run
again: rows are matched by natural key and updated in place, learner rows
are never deleted, and topics that fell out of the syllabus are hidden.

Nothing here creates tables. The schema belongs to the migrations.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Callable, Optional

from sqlalchemy import bindparam, text
from sqlalchemy.orm import Session

from app.core.gs.models import GsSubject

GEOGRAPHY_SLUG = "geography"

GS_SUBJECTS = [
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

Log = Optional[Callable[[str], None]]


def ensure_gs_subjects(session: Session, log: Log = None) -> dict[str, int]:
    """Ensure the GS subject rows exist and return their IDs by stable slug."""
    now = datetime.now(timezone.utc)
    subject_ids: dict[str, int] = {}
    for info in GS_SUBJECTS:
        existing = session.query(GsSubject).filter(GsSubject.slug == info["slug"]).one_or_none()
        if existing is None:
            existing = GsSubject(
                slug=info["slug"],
                name=info["name"],
                description=info["desc"],
                display_order=info["order"],
                is_complete=False,
                created_at=now,
                updated_at=now,
            )
            session.add(existing)
            session.flush()
            if log:
                log(f"  [created] gs_subjects '{info['slug']}' (id={existing.id})")
        else:
            existing.name = info["name"]
            existing.description = info["desc"]
            existing.display_order = info["order"]
            if log:
                log(f"  [ok] gs_subjects '{info['slug']}' exists (id={existing.id})")
        subject_ids[info["slug"]] = existing.id
    return subject_ids


def retire_orphan_nodes(session: Session, subject_id: int) -> int:
    """Hide (never delete) leaf topics that have no content sections.

    After a rename or restructure the importer creates new nodes and leaves
    the old ones without sections. Learner rows may still point at them, so
    they are marked UNREVIEWED: invisible to students, every reference intact.
    """
    orphan_ids = [row[0] for row in session.execute(text(
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


def load_geography_content(session: Session) -> dict:
    """Subjects, the reviewed Geography syllabus, then hide leftovers.

    Stages everything on the session; the caller commits or rolls back, so a
    failure part-way leaves the database as it was.
    """
    from app.core.gs_lms.importer import import_gs_geography

    subject_ids = ensure_gs_subjects(session)
    result = dict(import_gs_geography(session, review_status="REVIEWED"))
    result["orphan_topics_hidden"] = retire_orphan_nodes(session, subject_ids[GEOGRAPHY_SLUG])
    return result
