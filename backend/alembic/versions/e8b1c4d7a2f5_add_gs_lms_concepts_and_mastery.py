"""Add gs_lms_concepts and gs_lms_concept_mastery tables

Revision ID: e8b1c4d7a2f5
Revises: d3a8f6c2e1b7
Create Date: 2026-10-22

Concepts are the smallest learning unit under a GS LMS leaf topic (title, key
points a student must convey, optional misconceptions). Mastery is the
per-student result of explaining each concept.

Additive only: two new tables, no existing table is altered. Reuses the
existing ``gsreviewstatusenum`` type; the mastery status enum is created here.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e8b1c4d7a2f5"
down_revision: Union[str, None] = "d3a8f6c2e1b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_MASTERY_STATUS = sa.Enum(
    "NOT_STARTED", "LEARNING", "PASSED",
    name="gslmsconceptmasterystatusenum", create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = set(inspector.get_table_names())
    is_postgres = bind.dialect.name == "postgresql"

    if is_postgres:
        from sqlalchemy.dialects.postgresql import ENUM as pg_ENUM
        _MASTERY_STATUS.create(bind, checkfirst=True)
        mastery_status = pg_ENUM(name="gslmsconceptmasterystatusenum", create_type=False)
        review_status = pg_ENUM(name="gsreviewstatusenum", create_type=False)
    else:
        mastery_status = _MASTERY_STATUS
        review_status = sa.Enum(
            "UNREVIEWED", "IN_REVIEW", "REVIEWED", name="gsreviewstatusenum", create_type=False
        )

    if "gs_lms_concepts" not in existing:
        op.create_table(
            "gs_lms_concepts",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("syllabus_node_id", sa.Integer(), nullable=False),
            sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("key_points", sa.JSON(), nullable=False),
            sa.Column("misconceptions", sa.JSON(), nullable=True),
            sa.Column("review_status", review_status, nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.Column("created_by", sa.String(), nullable=True),
            sa.Column("updated_by", sa.String(), nullable=True),
            sa.ForeignKeyConstraint(["syllabus_node_id"], ["gs_lms_syllabus_nodes.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("syllabus_node_id", "title", name="uq_gs_lms_concepts_node_title"),
        )
        op.create_index(op.f("ix_gs_lms_concepts_id"), "gs_lms_concepts", ["id"], unique=False)
        op.create_index(op.f("ix_gs_lms_concepts_syllabus_node_id"), "gs_lms_concepts", ["syllabus_node_id"], unique=False)
        op.create_index(op.f("ix_gs_lms_concepts_review_status"), "gs_lms_concepts", ["review_status"], unique=False)

    if "gs_lms_concept_mastery" not in existing:
        op.create_table(
            "gs_lms_concept_mastery",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("student_id", sa.Integer(), nullable=False),
            sa.Column("concept_id", sa.Integer(), nullable=False),
            sa.Column("score", sa.Float(), nullable=False, server_default="0"),
            sa.Column("last_score", sa.Float(), nullable=True),
            sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("status", mastery_status, nullable=False),
            sa.Column("passed_at", sa.DateTime(), nullable=True),
            sa.Column("last_assessed_at", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.Column("created_by", sa.String(), nullable=True),
            sa.Column("updated_by", sa.String(), nullable=True),
            sa.ForeignKeyConstraint(["student_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["concept_id"], ["gs_lms_concepts.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("student_id", "concept_id", name="uq_gs_lms_concept_mastery"),
        )
        op.create_index(op.f("ix_gs_lms_concept_mastery_id"), "gs_lms_concept_mastery", ["id"], unique=False)
        op.create_index(op.f("ix_gs_lms_concept_mastery_student_id"), "gs_lms_concept_mastery", ["student_id"], unique=False)
        op.create_index(op.f("ix_gs_lms_concept_mastery_concept_id"), "gs_lms_concept_mastery", ["concept_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_gs_lms_concept_mastery_concept_id"), table_name="gs_lms_concept_mastery")
    op.drop_index(op.f("ix_gs_lms_concept_mastery_student_id"), table_name="gs_lms_concept_mastery")
    op.drop_index(op.f("ix_gs_lms_concept_mastery_id"), table_name="gs_lms_concept_mastery")
    op.drop_table("gs_lms_concept_mastery")

    op.drop_index(op.f("ix_gs_lms_concepts_review_status"), table_name="gs_lms_concepts")
    op.drop_index(op.f("ix_gs_lms_concepts_syllabus_node_id"), table_name="gs_lms_concepts")
    op.drop_index(op.f("ix_gs_lms_concepts_id"), table_name="gs_lms_concepts")
    op.drop_table("gs_lms_concepts")

    if op.get_bind().dialect.name == "postgresql":
        _MASTERY_STATUS.drop(op.get_bind(), checkfirst=True)
