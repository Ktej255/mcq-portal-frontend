"""Add exams (gs_exams), subject.exam_id, learner-profile exam and NEET/JEE enum values

Revision ID: p3d4e5f6a7b8
Revises: o2c3d4e5f6a7
Create Date: 2026-10-23

Makes the GS LMS exam-neutral (docs/EXAMS.md):

* ``gs_exams`` (code unique: upsc / neet / jee). UPSC is active; NEET and JEE
  are inserted inactive until their content is ready.
* ``gs_subjects.exam_id`` (FK, NOT NULL). Every existing subject is backfilled
  to UPSC, so UPSC behaviour, slugs and stored progress are unchanged. Slugs
  stay globally unique.
* ``gs_lms_learner_profiles.exam_code`` (nullable; null = upsc).
* PostgreSQL native enums gain PYQ exam types NEET, JEE_MAIN, JEE_ADVANCED
  (``gslmsexamtypeenum``) and question types NUMERICAL, MULTI_CORRECT
  (``gslmsquestiontypeenum``). SQLite stores enums as plain strings (no CHECK
  constraint), so it needs nothing.

Idempotent: skips whatever already exists (e.g. a database built by
``create_all``). Portable to SQLite (batch operations) and PostgreSQL.

Downgrade drops ``exam_id``, ``exam_code`` and ``gs_exams``. PostgreSQL cannot
remove enum values, so the added enum values stay in the database (harmless:
nothing references them once the exam columns are gone).
"""
from datetime import datetime
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "p3d4e5f6a7b8"
down_revision: Union[str, None] = "o2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_EXAMS = [("upsc", "UPSC", 0, True), ("neet", "NEET", 1, False), ("jee", "JEE", 2, False)]
_NEW_ENUM_VALUES = {
    "gslmsexamtypeenum": ["NEET", "JEE_MAIN", "JEE_ADVANCED"],
    "gslmsquestiontypeenum": ["NUMERICAL", "MULTI_CORRECT"],
}


def _add_postgres_enum_values(bind) -> None:
    if bind.dialect.name != "postgresql":
        return
    # ALTER TYPE ... ADD VALUE cannot run inside a transaction block on older
    # PostgreSQL, so it runs in an autocommit block before the other changes.
    with op.get_context().autocommit_block():
        for type_name, values in _NEW_ENUM_VALUES.items():
            exists = bind.execute(
                sa.text("SELECT 1 FROM pg_type WHERE typname = :n"), {"n": type_name}
            ).scalar()
            if not exists:
                continue
            for value in values:
                op.execute(f"ALTER TYPE {type_name} ADD VALUE IF NOT EXISTS '{value}'")


def upgrade() -> None:
    bind = op.get_bind()
    _add_postgres_enum_values(bind)

    inspector = sa.inspect(bind)
    if "gs_exams" not in inspector.get_table_names():
        op.create_table(
            "gs_exams",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("code", sa.String(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_gs_exams_id", "gs_exams", ["id"])
        op.create_index("ix_gs_exams_code", "gs_exams", ["code"], unique=True)

    exams = sa.table(
        "gs_exams",
        sa.column("code", sa.String),
        sa.column("name", sa.String),
        sa.column("display_order", sa.Integer),
        sa.column("is_active", sa.Boolean),
        sa.column("created_at", sa.DateTime),
    )
    have = {row[0] for row in bind.execute(sa.select(exams.c.code))}
    missing = [e for e in _EXAMS if e[0] not in have]
    if missing:
        op.bulk_insert(
            exams,
            [
                {"code": c, "name": n, "display_order": o, "is_active": a, "created_at": datetime.utcnow()}
                for c, n, o, a in missing
            ],
        )

    subject_columns = {c["name"] for c in inspector.get_columns("gs_subjects")}
    if "exam_id" not in subject_columns:
        with op.batch_alter_table("gs_subjects") as batch:
            batch.add_column(sa.Column("exam_id", sa.Integer(), nullable=True))
    # Every existing subject is a UPSC subject.
    op.execute(
        "UPDATE gs_subjects SET exam_id = (SELECT id FROM gs_exams WHERE code = 'upsc') "
        "WHERE exam_id IS NULL"
    )
    with op.batch_alter_table("gs_subjects") as batch:
        batch.alter_column("exam_id", existing_type=sa.Integer(), nullable=False)
        fk_exists = any(
            "exam_id" in (fk.get("constrained_columns") or [])
            for fk in sa.inspect(bind).get_foreign_keys("gs_subjects")
        )
        if not fk_exists:
            batch.create_foreign_key("fk_gs_subjects_exam_id", "gs_exams", ["exam_id"], ["id"])
    existing_indexes = {i["name"] for i in sa.inspect(bind).get_indexes("gs_subjects")}
    if "ix_gs_subjects_exam_id" not in existing_indexes:
        op.create_index("ix_gs_subjects_exam_id", "gs_subjects", ["exam_id"])

    profile_columns = {c["name"] for c in inspector.get_columns("gs_lms_learner_profiles")}
    if "exam_code" not in profile_columns:
        with op.batch_alter_table("gs_lms_learner_profiles") as batch:
            batch.add_column(sa.Column("exam_code", sa.String(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "exam_code" in {c["name"] for c in inspector.get_columns("gs_lms_learner_profiles")}:
        with op.batch_alter_table("gs_lms_learner_profiles") as batch:
            batch.drop_column("exam_code")

    if "exam_id" in {c["name"] for c in inspector.get_columns("gs_subjects")}:
        if "ix_gs_subjects_exam_id" in {i["name"] for i in inspector.get_indexes("gs_subjects")}:
            op.drop_index("ix_gs_subjects_exam_id", table_name="gs_subjects")
        with op.batch_alter_table("gs_subjects") as batch:
            batch.drop_column("exam_id")

    if "gs_exams" in inspector.get_table_names():
        op.drop_table("gs_exams")
