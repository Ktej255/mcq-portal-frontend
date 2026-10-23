"""Add Content studio logs (content imports and review log)

Revision ID: o2c3d4e5f6a7
Revises: n1b2c3d4e5f6
Create Date: 2026-10-22

``gs_lms_content_imports`` records each content file uploaded through the admin
Content studio (who, which file, its hash, the check summary and the import
result). ``gs_lms_content_review_log`` records each approve / un-approve of a
topic. Additive; portable to SQLite and PostgreSQL. Skips tables that already
exist.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "o2c3d4e5f6a7"
down_revision: Union[str, None] = "n1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    existing = set(sa.inspect(op.get_bind()).get_table_names())

    if "gs_lms_content_imports" not in existing:
        op.create_table(
            "gs_lms_content_imports",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("subject_id", sa.Integer(), sa.ForeignKey("gs_subjects.id"), nullable=False),
            sa.Column("uploaded_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("filename", sa.String(), nullable=False),
            sa.Column("sha256", sa.String(length=64), nullable=False),
            sa.Column("summary", sa.JSON(), nullable=True),
            sa.Column("result", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_gs_lms_content_imports_id", "gs_lms_content_imports", ["id"])
        op.create_index("ix_gs_lms_content_imports_subject_id", "gs_lms_content_imports", ["subject_id"])
        op.create_index("ix_gs_lms_content_imports_created_at", "gs_lms_content_imports", ["created_at"])

    if "gs_lms_content_review_log" not in existing:
        op.create_table(
            "gs_lms_content_review_log",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("node_id", sa.Integer(), sa.ForeignKey("gs_lms_syllabus_nodes.id"), nullable=False),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("status", sa.String(), nullable=False),
            sa.Column("counts", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_gs_lms_content_review_log_id", "gs_lms_content_review_log", ["id"])
        op.create_index("ix_gs_lms_content_review_log_node_id", "gs_lms_content_review_log", ["node_id"])
        op.create_index("ix_gs_lms_content_review_log_created_at", "gs_lms_content_review_log", ["created_at"])


def downgrade() -> None:
    existing = set(sa.inspect(op.get_bind()).get_table_names())
    for table in ("gs_lms_content_review_log", "gs_lms_content_imports"):
        if table in existing:
            op.drop_table(table)
