"""Add NEET/JEE question formats to topic MCQs (numerical, multi-correct) and per-attempt marks

Revision ID: q4e5f6a7b8c9
Revises: p3d4e5f6a7b8
Create Date: 2026-10-23

* ``gs_lms_mcq_questions``: ``numeric_answer`` (float, null), ``numeric_tolerance``
  (float, null; 0 = exact after rounding to 2 decimals) and ``correct_options``
  (JSON list, null) for multi-correct questions. ``correct_option`` stays NOT NULL:
  a multi-correct question stores the sorted joined labels ("A,C") there and a
  numerical one the number as text; ``options`` stays NOT NULL ([] for numerical).
* ``gs_lms_mcq_lab_attempts``: ``marks`` (float, null) and wider
  ``chosen_answer`` / ``correct_answer`` (10 -> 64 characters) so "A,B,C,D" and
  numbers fit.

Idempotent (skips what exists). Portable to SQLite (batch operations) and
PostgreSQL. Existing rows are untouched: every existing question is single-correct.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "q4e5f6a7b8c9"
down_revision: Union[str, None] = "p3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_QUESTIONS = "gs_lms_mcq_questions"
_ATTEMPTS = "gs_lms_mcq_lab_attempts"


def _columns(table: str) -> dict:
    return {c["name"]: c for c in sa.inspect(op.get_bind()).get_columns(table)}


def upgrade() -> None:
    have = _columns(_QUESTIONS)
    with op.batch_alter_table(_QUESTIONS) as batch:
        if "numeric_answer" not in have:
            batch.add_column(sa.Column("numeric_answer", sa.Float(), nullable=True))
        if "numeric_tolerance" not in have:
            batch.add_column(sa.Column("numeric_tolerance", sa.Float(), nullable=True))
        if "correct_options" not in have:
            batch.add_column(sa.Column("correct_options", sa.JSON(), nullable=True))

    have = _columns(_ATTEMPTS)
    with op.batch_alter_table(_ATTEMPTS) as batch:
        if "marks" not in have:
            batch.add_column(sa.Column("marks", sa.Float(), nullable=True))
        for name in ("chosen_answer", "correct_answer"):
            batch.alter_column(name, existing_type=sa.String(10), type_=sa.String(64), existing_nullable=False)


def downgrade() -> None:
    # Values written by the new formats may be longer than the old limit.
    for name in ("chosen_answer", "correct_answer"):
        op.execute(f"UPDATE {_ATTEMPTS} SET {name} = SUBSTR({name}, 1, 10)")
    have = _columns(_ATTEMPTS)
    with op.batch_alter_table(_ATTEMPTS) as batch:
        for name in ("chosen_answer", "correct_answer"):
            batch.alter_column(name, existing_type=sa.String(64), type_=sa.String(10), existing_nullable=False)
        if "marks" in have:
            batch.drop_column("marks")

    have = _columns(_QUESTIONS)
    with op.batch_alter_table(_QUESTIONS) as batch:
        for name in ("correct_options", "numeric_tolerance", "numeric_answer"):
            if name in have:
                batch.drop_column(name)
