"""Add opt-in handwriting trend tables (consent + per-page samples)

Revision ID: n1b2c3d4e5f6
Revises: m0a1b2c3d4e5
Create Date: 2026-10-22

``gs_wellbeing_consents`` holds the student's opt-in flag.
``gs_wellbeing_handwriting_samples`` holds numbers measured from a page photo
(never the image or its text); ``answer_image_id`` becomes NULL if the image
row is ever removed, and the numbers stay. Additive; portable to SQLite and
PostgreSQL. Skips tables that already exist.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "n1b2c3d4e5f6"
down_revision: Union[str, None] = "m0a1b2c3d4e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    existing = set(sa.inspect(op.get_bind()).get_table_names())

    if "gs_wellbeing_consents" not in existing:
        op.create_table(
            "gs_wellbeing_consents",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("handwriting_insights", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("handwriting_consented_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
        )
        op.create_index(
            "ix_gs_wellbeing_consents_user_id", "gs_wellbeing_consents", ["user_id"], unique=True
        )

    if "gs_wellbeing_handwriting_samples" not in existing:
        op.create_table(
            "gs_wellbeing_handwriting_samples",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column(
                "answer_image_id",
                sa.Integer(),
                sa.ForeignKey("gs_lms_answer_sheet_images.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column("captured_at", sa.DateTime(), nullable=False),
            sa.Column("algorithm_version", sa.String(length=32), nullable=False),
            sa.Column("quality", sa.Float(), nullable=False),
            sa.Column("usable", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("features", sa.JSON(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.UniqueConstraint(
                "answer_image_id", "algorithm_version", name="uq_wellbeing_hw_image_algo"
            ),
        )
        op.create_index(
            "ix_gs_wellbeing_handwriting_samples_user_id",
            "gs_wellbeing_handwriting_samples",
            ["user_id"],
        )
        op.create_index(
            "ix_gs_wellbeing_handwriting_samples_captured_at",
            "gs_wellbeing_handwriting_samples",
            ["captured_at"],
        )


def downgrade() -> None:
    existing = set(sa.inspect(op.get_bind()).get_table_names())
    if "gs_wellbeing_handwriting_samples" in existing:
        op.drop_table("gs_wellbeing_handwriting_samples")
    if "gs_wellbeing_consents" in existing:
        op.drop_table("gs_wellbeing_consents")
