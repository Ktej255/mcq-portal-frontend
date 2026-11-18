"""
SQLite → PostgreSQL Data Migration Script
==========================================

Copies all data from the local production.db SQLite database into
the target Neon/PostgreSQL database.

Usage:
    SQLITE_PATH=../production.db \
    TARGET_DB_URL="postgresql://user:pass@host/db?sslmode=require" \
    python scripts/migrate_sqlite_to_postgres.py

Requirements:
    pip install sqlalchemy psycopg2-binary
"""

import os
import sys
from pathlib import Path

# Add backend root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.pool import NullPool


SQLITE_PATH = os.environ.get("SQLITE_PATH", "../production.db")
TARGET_DB_URL = os.environ.get("TARGET_DB_URL", "")

if not TARGET_DB_URL:
    print("❌  ERROR: Set TARGET_DB_URL to your Neon PostgreSQL connection string.")
    print("   Example: export TARGET_DB_URL='postgresql://user:pass@host/db?sslmode=require'")
    sys.exit(1)

sqlite_url = f"sqlite:///{SQLITE_PATH}"
print(f"📂  Source SQLite: {SQLITE_PATH}")
print(f"🐘  Target PostgreSQL: {TARGET_DB_URL[:40]}...")

# --- Connect ---
src_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
dst_engine = create_engine(TARGET_DB_URL, poolclass=NullPool)

# --- Apply migrations to target DB first ---
print("\n🔄  Running Alembic migrations on target database...")
import subprocess
result = subprocess.run(
    ["python", "-m", "alembic", "upgrade", "head"],
    env={**os.environ, "DATABASE_URL": TARGET_DB_URL},
    capture_output=True,
    text=True,
)
if result.returncode != 0:
    print("❌  Alembic migration failed:")
    print(result.stderr)
    sys.exit(1)
print("✅  Migrations applied.")

# --- Get table list from SQLite ---
src_inspector = inspect(src_engine)
tables = src_inspector.get_table_names()
print(f"\n📋  Found {len(tables)} tables to migrate: {', '.join(tables)}")

def clear_target_table(dst_conn, table: str) -> None:
    """Clear one target table without poisoning the outer migration transaction."""
    try:
        # PostgreSQL marks the current transaction failed after a statement error.
        # A savepoint contains a TRUNCATE failure so the DELETE fallback is legal.
        with dst_conn.begin_nested():
            dst_conn.execute(text(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE'))
    except Exception:
        print(f"   ⚠  {table}: TRUNCATE failed; rolled back savepoint, using DELETE fallback")
        dst_conn.execute(text(f'DELETE FROM "{table}"'))


def target_row_count(dst_conn, table: str) -> int:
    """Return the target row count used to verify source/target equivalence."""
    result = dst_conn.execute(text(f'SELECT COUNT(*) FROM "{table}"')).scalar_one()
    return int(result)


# --- Copy data table by table ---
with src_engine.connect() as src_conn, dst_engine.connect() as dst_conn:
    try:
        dst_conn.execute(text("SET session_replication_role = 'replica'"))  # Disable FK checks during import

        for table in tables:
            if table in ("alembic_version",):
                print(f"   ⏭  Skipping {table}")
                continue

            rows = src_conn.execute(text(f"SELECT * FROM {table}")).fetchall()
            source_row_count = len(rows)
            cols = src_inspector.get_columns(table)
            col_names = [c["name"] for c in cols]

            # Clear before the empty-source branch too; otherwise stale target
            # rows survive and the migration can report a false success.
            clear_target_table(dst_conn, table)

            if source_row_count == 0:
                print(f"   ⬜  {table}: empty, target cleared")
            else:
                # Insert in batches
                col_list = ", ".join(f'"{c}"' for c in col_names)
                placeholders = ", ".join(f":{c}" for c in col_names)
                insert_sql = text(f'INSERT INTO "{table}" ({col_list}) VALUES ({placeholders})')

                batch = [dict(zip(col_names, row)) for row in rows]
                dst_conn.execute(insert_sql, batch)
                print(f"   ✅  {table}: {source_row_count} rows migrated")

            target_count = target_row_count(dst_conn, table)
            if target_count != source_row_count:
                raise RuntimeError(
                    f"Row-count verification failed for {table}: "
                    f"source={source_row_count}, target={target_count}"
                )
            print(f"   🔍  {table}: row count verified ({target_count})")

        dst_conn.execute(text("SET session_replication_role = 'origin'"))
        dst_conn.commit()
    except Exception:
        # Do not leave the connection in replica mode after a failed migration.
        dst_conn.rollback()
        try:
            dst_conn.execute(text("SET session_replication_role = 'origin'"))
            dst_conn.commit()
        except Exception:
            dst_conn.rollback()
        raise

print("\n🎉  Migration complete! All data copied to PostgreSQL and row counts verified.")
print("   Next steps:")
print("   1. Verify row counts match between SQLite and PostgreSQL")
print("   2. Deploy backend to Vercel with the new DATABASE_URL")
print("   3. Run a quick health check: curl https://your-backend.vercel.app/health")
