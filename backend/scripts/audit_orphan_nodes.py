"""Read-only integrity audit for GS LMS syllabus nodes (no writes, ever).

This replaces the old ``delete_orphan_nodes.py`` helper, which opened the
learner database with ``PRAGMA foreign_keys=OFF`` and deleted syllabus nodes
plus dependent progress rows. Running that script is how the June 2026 reseed
silently orphaned learner history; nothing in the codebase referenced it.

Deletion is never the repair path:

* Leaf topics without reviewed content are expected mid-curation. The seed
  importer refreshes canonical nodes in place and hides stale ones as
  UNREVIEWED, so learner rows stay resolvable.
* Dangling learner references are repaired explicitly, with a backup, after
  the affected node is identified (see the onboarding repair in the audit docs).

Usage:
    python scripts/audit_orphan_nodes.py [--db production.db] [--subject-id 1]

Exit code is 0 when the audit runs, 1 when dangling learner references are
found, so it can gate a release check without mutating anything. The database
is opened in SQLite read-only mode.
"""
from __future__ import annotations

import argparse
import sqlite3
import sys
from pathlib import Path

# Learner tables that point at gs_lms_syllabus_nodes.
LEARNER_NODE_REFERENCES: list[tuple[str, str]] = [
    ("gs_lms_funnel_progress", "syllabus_node_id"),
    ("gs_lms_video_watches", "syllabus_node_id"),
    ("gs_lms_revisit_schedule", "syllabus_node_id"),
    ("gs_lms_reading_times", "syllabus_node_id"),
    ("gs_lms_recall_attempts", "syllabus_node_id"),
    ("gs_lms_onboarding", "first_topic_id"),
]


def _table_exists(conn: sqlite3.Connection, table: str) -> bool:
    row = conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (table,)
    ).fetchone()
    return row is not None


def _column_exists(conn: sqlite3.Connection, table: str, column: str) -> bool:
    return any(
        row[1] == column for row in conn.execute(f"PRAGMA table_info({table})")
    )


def audit(db_path: Path, subject_id: int | None) -> int:
    uri = f"file:{db_path.as_posix()}?mode=ro"
    conn = sqlite3.connect(uri, uri=True)
    try:
        dangling_total = 0
        print(f"Read-only audit of {db_path}")
        print("No rows will be modified or deleted.\n")

        subject_filter = "WHERE n.subject_id = ?" if subject_id is not None else ""
        params: tuple = (subject_id,) if subject_id is not None else ()

        node_count = conn.execute(
            f"SELECT COUNT(*) FROM gs_lms_syllabus_nodes n {subject_filter}", params
        ).fetchone()[0]
        print(f"Syllabus nodes: {node_count}")

        empty_leaves = conn.execute(
            f"""
            SELECT COUNT(*) FROM gs_lms_syllabus_nodes n
            {subject_filter + ' AND' if subject_filter else 'WHERE'}
                n.node_type = 'LEAF_TOPIC'
                AND NOT EXISTS (
                    SELECT 1 FROM gs_lms_content_sections s
                    WHERE s.syllabus_node_id = n.id
                )
            """,
            params,
        ).fetchone()[0]
        print(
            f"Leaf topics without any content section: {empty_leaves} "
            "(expected mid-curation; hidden/UNREVIEWED nodes are not defects)"
        )

        print("\nDangling learner references (must be 0):")
        for table, column in LEARNER_NODE_REFERENCES:
            if not _table_exists(conn, table) or not _column_exists(conn, table, column):
                print(f"  {table}.{column}: table/column absent, skipped")
                continue
            dangling = conn.execute(
                f"""
                SELECT COUNT(*) FROM {table} t
                WHERE t.{column} IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM gs_lms_syllabus_nodes n
                      WHERE n.id = t.{column}
                  )
                """
            ).fetchone()[0]
            status = "OK" if dangling == 0 else "DANGLING"
            print(f"  {table}.{column}: {dangling} [{status}]")
            dangling_total += dangling

        if dangling_total:
            print(
                "\nAction: restore the missing node from a backup if its identity "
                "is known; otherwise back up the database and set the affected "
                "column to NULL. Do not delete learner rows or drop FK enforcement."
            )
            return 1
        print("\nNo dangling learner references.")
        return 0
    finally:
        conn.close()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", default="production.db", help="Path to the SQLite DB")
    parser.add_argument(
        "--subject-id",
        type=int,
        default=None,
        help="Restrict node counts to one subject (learner checks are global)",
    )
    args = parser.parse_args()
    db_path = Path(args.db)
    if not db_path.exists():
        print(f"Database not found: {db_path}", file=sys.stderr)
        return 2
    return audit(db_path, args.subject_id)


if __name__ == "__main__":
    raise SystemExit(main())
