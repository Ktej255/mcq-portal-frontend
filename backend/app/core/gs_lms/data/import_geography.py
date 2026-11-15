"""Seed or refresh the GS Geography LMS content from the JSON artifact.

Usage: python -m app.core.gs_lms.data.import_geography

Safe to re-run. The importer is idempotent (records are matched by natural
keys and updated in place), so this script never clears content tables and
never rotates primary keys. Learner progress rows that reference syllabus
nodes and content sections therefore survive a refresh.

If you genuinely need a clean slate, do it explicitly and knowingly — this
script will not do it for you.
"""

from __future__ import annotations

import os
import sys
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.core.gs_lms.importer import import_gs_geography, load_artifact
from app.core.gs.models import GsSubject
from app.db.session import SessionLocal
from app.models.domain import User  # noqa: F401  (registers the User mapper)


def run_import(
    session: Session,
    artifact_path_or_data: Optional[os.PathLike | str | dict[str, Any]] = None,
) -> dict[str, Any]:
    """Import/refresh GS Geography in place with REVIEWED status.

    Never deletes existing rows: nodes, sections, PYQs and MCQs are matched by
    their natural keys and updated, so IDs referenced by learner progress
    stay stable. Raises ValueError if the artifact targets a subject that is
    not seeded yet (run the subject seed first).
    """
    if artifact_path_or_data is None:
        data = load_artifact()
    elif isinstance(artifact_path_or_data, dict):
        data = artifact_path_or_data
    else:
        data = load_artifact(artifact_path_or_data)

    subject_id = data["subject_id"]
    if session.get(GsSubject, subject_id) is None:
        raise ValueError(
            f"Subject id={subject_id} does not exist. Seed the GS subject "
            f"(e.g. scripts/seed_production.py) before importing content. "
            f"Refusing to import against a missing subject."
        )

    return import_gs_geography(session, data, review_status="REVIEWED")


def main() -> None:
    """Run the GS Geography content import with REVIEWED status."""
    session = SessionLocal()
    try:
        print("Importing GS Geography LMS content in place (review_status=REVIEWED)...")
        print("Existing nodes and sections are updated by natural key; nothing is deleted.")
        result = run_import(session)
        session.commit()
    except Exception as exc:
        session.rollback()
        print(f"ERROR: Import failed — {exc}", file=sys.stderr)
        print("No changes were committed.", file=sys.stderr)
        raise SystemExit(1) from exc
    finally:
        session.close()

    print("\n=== GS Geography LMS import complete ===")
    print("Summary:")
    for key, value in result.items():
        print(f"  {key:<22} {value}")
    print("\nAll imported content is REVIEWED (immediately visible to students).")
    print("Learner progress and existing record IDs were preserved.")


if __name__ == "__main__":
    main()
