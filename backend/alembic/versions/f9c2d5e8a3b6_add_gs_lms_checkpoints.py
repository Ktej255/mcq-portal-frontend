"""Add gs_lms_checkpoints table

Revision ID: f9c2d5e8a3b6
Revises: e8b1c4d7a2f5
Create Date: 2026-10-22

Combined review ("cumulative review") checkpoints: created DUE when a student
masters several consecutive leaf topics of a sub-topic, PASSED once a combined
MCQ test is cleared. Additive only: one new table.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f9c2d5e8a3b6"
down_revision: Union[str, None] = "e8b1c4d7a2f5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    existing = set(sa.inspect(op.get_bind()).get_table_names())
    if "gs_lms_checkpoints" in existing:
        return
    op.create_table(
        "gs_lms_checkpoints",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("subject_id", sa.Integer(), nullable=False),
        sa.Column("sub_topic_node_id", sa.Integer(), nullable=False),
        sa.Column("leaf_ids", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=10), nullable=False, server_default="DUE"),
        sa.Column("best_score", sa.Float(), nullable=True),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("passed_at", sa.DateTime(), nullable=True),
        sa.Column("question_ids", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("created_by", sa.String(), nullable=True),
        sa.Column("updated_by", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["student_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["subject_id"], ["gs_subjects.id"]),
        sa.ForeignKeyConstraint(["sub_topic_node_id"], ["gs_lms_syllabus_nodes.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_gs_lms_checkpoints_id"), "gs_lms_checkpoints", ["id"], unique=False)
    op.create_index(op.f("ix_gs_lms_checkpoints_student_id"), "gs_lms_checkpoints", ["student_id"], unique=False)
    op.create_index(op.f("ix_gs_lms_checkpoints_subject_id"), "gs_lms_checkpoints", ["subject_id"], unique=False)
    op.create_index(op.f("ix_gs_lms_checkpoints_sub_topic_node_id"), "gs_lms_checkpoints", ["sub_topic_node_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_gs_lms_checkpoints_sub_topic_node_id"), table_name="gs_lms_checkpoints")
    op.drop_index(op.f("ix_gs_lms_checkpoints_subject_id"), table_name="gs_lms_checkpoints")
    op.drop_index(op.f("ix_gs_lms_checkpoints_student_id"), table_name="gs_lms_checkpoints")
    op.drop_index(op.f("ix_gs_lms_checkpoints_id"), table_name="gs_lms_checkpoints")
    op.drop_table("gs_lms_checkpoints")
