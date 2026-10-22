"""Add per-page OCR result and image deletion columns to gs_lms_answer_sheet_images

Revision ID: m0a1b2c3d4e5
Revises: l9f0a1b2c3d4
Create Date: 2026-10-22

Handwritten answer pages now keep their own OCR result (``ocr_text``,
``ocr_confidence``, ``ocr_status`` = ok/failed/skipped) so a failed page can be
retried and the attempt text rebuilt in page order. ``deleted_at`` records when
the stored image was removed (student request or retention); ``media_ref``
becomes nullable so it can be cleared while the text and report are kept.
Additive apart from the relaxed NOT NULL; uses batch mode for SQLite.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "m0a1b2c3d4e5"
down_revision: Union[str, None] = "l9f0a1b2c3d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TABLE = "gs_lms_answer_sheet_images"


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if _TABLE not in inspector.get_table_names():
        return
    existing = {c["name"] for c in inspector.get_columns(_TABLE)}

    with op.batch_alter_table(_TABLE) as batch_op:
        if "ocr_text" not in existing:
            batch_op.add_column(sa.Column("ocr_text", sa.Text(), nullable=True))
        if "ocr_confidence" not in existing:
            batch_op.add_column(sa.Column("ocr_confidence", sa.Float(), nullable=True))
        if "ocr_status" not in existing:
            batch_op.add_column(sa.Column("ocr_status", sa.String(length=16), nullable=True))
        if "deleted_at" not in existing:
            batch_op.add_column(sa.Column("deleted_at", sa.DateTime(), nullable=True))
        batch_op.alter_column("media_ref", existing_type=sa.String(), nullable=True)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if _TABLE not in inspector.get_table_names():
        return
    existing = {c["name"] for c in inspector.get_columns(_TABLE)}

    # Rows whose image was deleted have no media_ref; give them an empty string
    # so the NOT NULL constraint can be restored.
    op.execute(sa.text(f"UPDATE {_TABLE} SET media_ref = '' WHERE media_ref IS NULL"))
    with op.batch_alter_table(_TABLE) as batch_op:
        batch_op.alter_column("media_ref", existing_type=sa.String(), nullable=False)
        for col in ("deleted_at", "ocr_status", "ocr_confidence", "ocr_text"):
            if col in existing:
                batch_op.drop_column(col)
