#!/usr/bin/env python3
"""Local-dev seed: load the (merged) GS Geography content into the running
app's SQLite DB so the upgraded topics show up immediately.

Avoids Alembic (the local sqlite was built via create_all, not migrations).
It (1) creates any missing tables, (2) ensures the additive ``gs_paper`` column
exists on ``gs_lms_pyqs``, then (3) runs the idempotent importer with
review_status=REVIEWED.

Usage (from backend/, with the local sqlite DATABASE_URL in .env):
    python scripts/local_seed_upgraded.py
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text

from app.db.session import Base, SessionLocal, engine

# Register the full model graph on Base.metadata.
import app.models.domain  # noqa: F401
import app.core.gs.models  # noqa: F401
import app.core.gs_lms.models  # noqa: F401
import app.core.gs_lms.student_models  # noqa: F401

from app.core.gs_lms.importer import import_gs_geography, load_artifact


def _ensure_gs_paper_column() -> None:
    """Add the nullable gs_paper column to gs_lms_pyqs if missing (sqlite)."""
    if engine.dialect.name == "postgresql":
        print("Dialect is PostgreSQL, skipping SQLite-specific column check")
        return
    with engine.begin() as conn:
        cols = [row[1] for row in conn.execute(text("PRAGMA table_info('gs_lms_pyqs')"))]
        if not cols:
            return  # table will be created by create_all below
        if "gs_paper" not in cols:
            conn.execute(text("ALTER TABLE gs_lms_pyqs ADD COLUMN gs_paper VARCHAR"))
            print("Added column gs_lms_pyqs.gs_paper")
        else:
            print("Column gs_lms_pyqs.gs_paper already present")


def main() -> None:
    if engine.dialect.name != "sqlite":
        raise RuntimeError(
            "local_seed_upgraded.py requires a SQLite database; refusing to run "
            "against a non-local database"
        )

    # Validate the artifact before any schema or content write. The committed
    # artifact is geography content; its subject_id is remapped to the
    # slug-resolved local Geography row below rather than assuming ID 1.
    artifact = load_artifact()
    if not isinstance(artifact.get("subject_id"), int) or isinstance(
        artifact["subject_id"], bool
    ):
        raise ValueError("Geography artifact must contain an integer subject_id")
    tree = artifact.get("tree")
    if not isinstance(tree, list) or not tree or not all(
        isinstance(node, dict) for node in tree
    ):
        raise ValueError(
            "Geography artifact must contain a non-empty tree of mapping nodes"
        )

    from scripts.seed_production import (
        _clear_subject_content,
        _ensure_csat_syllabus,
        _ensure_subjects,
    )

    print("DB: local SQLite")
    # 1. Create any missing tables (new answer-eval tables, etc.). Existing
    #    tables are left untouched.
    Base.metadata.create_all(engine)
    # 2. Ensure the additive column exists on the existing PYQ table.
    _ensure_gs_paper_column()

    # 3. Resolve subjects by stable slug and use the existing cleanup helper,
    #    which flushes and propagates cleanup failures.
    session = SessionLocal()
    try:
        print("Ensuring core subjects exist...")
        subject_ids = _ensure_subjects(session)
        geography_subject_id = subject_ids["geography"]

        # The artifact is the fixed geography seed, but database IDs are not
        # stable across local databases. Pass the resolved ID to the importer.
        artifact = dict(artifact)
        artifact["subject_id"] = geography_subject_id

        print("Clearing geography content...")
        _clear_subject_content(session, geography_subject_id)

        print("Importing geography content...")
        result = import_gs_geography(
            session, artifact, review_status="REVIEWED"
        )

        print("Seeding CSAT syllabus...")
        _ensure_csat_syllabus(session, subject_ids["csat"])

        session.commit()
    except Exception as exc:
        session.rollback()
        print(f"ERROR: {type(exc).__name__}: {exc}", file=sys.stderr)
        raise
    finally:
        session.close()

    print("\n=== Import complete (REVIEWED) ===")
    for k, v in result.items():
        print(f"  {k:<22} {v}")


if __name__ == "__main__":
    main()
