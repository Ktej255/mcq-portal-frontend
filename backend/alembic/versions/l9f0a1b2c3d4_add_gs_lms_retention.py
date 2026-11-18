"""Add gs_lms_retention_questions and gs_lms_chapter_progress

Revision ID: l9f0a1b2c3d4
Revises: k8e9f0a1b2c3
Create Date: 2026-10-22

Retention checks for book chapters: a bank of questions (optionally tied to a
book chapter) and each student's progress through a chapter, with the latest
check scores and the next spaced-review date. Additive only: two new tables and
one new enum type; the existing ``gsreviewstatusenum`` is reused.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "l9f0a1b2c3d4"
down_revision: Union[str, None] = "k8e9f0a1b2c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_STATUS = ("NOT_STARTED", "READING", "COMPLETED")
_ENUM_NAME = "gslmschapterstatusenum"


def upgrade() -> None:
    bind = op.get_bind()
    existing = set(sa.inspect(bind).get_table_names())
    is_postgres = bind.dialect.name == "postgresql"

    if is_postgres:
        from sqlalchemy.dialects.postgresql import ENUM as pg_ENUM
        pg_ENUM(*_STATUS, name=_ENUM_NAME).create(bind, checkfirst=True)
        status_type = pg_ENUM(*_STATUS, name=_ENUM_NAME, create_type=False)
        review_status = pg_ENUM(name="gsreviewstatusenum", create_type=False)
    else:
        status_type = sa.Enum(*_STATUS, name=_ENUM_NAME, create_type=False)
        review_status = sa.Enum(
            "UNREVIEWED", "IN_REVIEW", "REVIEWED", name="gsreviewstatusenum", create_type=False
        )

    if "gs_lms_retention_questions" not in existing:
        op.create_table(
            "gs_lms_retention_questions",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("external_id", sa.String(), nullable=False),
            sa.Column("subject_slug", sa.String(), nullable=False),
            sa.Column("question_text", sa.Text(), nullable=False),
            sa.Column("options", sa.JSON(), nullable=False),
            sa.Column("correct_option", sa.String(), nullable=True),
            sa.Column("explanation", sa.Text(), nullable=True),
            sa.Column("explanation_quality", sa.String(), nullable=False, server_default="missing"),
            sa.Column("answer_status", sa.String(), nullable=False, server_default="ok"),
            sa.Column("question_type", sa.String(), nullable=False, server_default="FACTUAL"),
            sa.Column("difficulty", sa.String(), nullable=True),
            sa.Column("is_pyq", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("pyq_year", sa.Integer(), nullable=True),
            sa.Column("source_book", sa.String(), nullable=True),
            sa.Column("source_chapter", sa.Integer(), nullable=True),
            sa.Column("book_chapter_id", sa.Integer(), nullable=True),
            sa.Column("review_status", review_status, nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.Column("created_by", sa.String(), nullable=True),
            sa.Column("updated_by", sa.String(), nullable=True),
            sa.ForeignKeyConstraint(["book_chapter_id"], ["gs_lms_book_chapters.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_gs_lms_retention_questions_id"), "gs_lms_retention_questions", ["id"], unique=False)
        op.create_index(op.f("ix_gs_lms_retention_questions_external_id"), "gs_lms_retention_questions", ["external_id"], unique=True)
        op.create_index(op.f("ix_gs_lms_retention_questions_subject_slug"), "gs_lms_retention_questions", ["subject_slug"], unique=False)
        op.create_index(op.f("ix_gs_lms_retention_questions_book_chapter_id"), "gs_lms_retention_questions", ["book_chapter_id"], unique=False)
        op.create_index(op.f("ix_gs_lms_retention_questions_review_status"), "gs_lms_retention_questions", ["review_status"], unique=False)

    if "gs_lms_chapter_progress" not in existing:
        op.create_table(
            "gs_lms_chapter_progress",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("student_id", sa.Integer(), nullable=False),
            sa.Column("chapter_id", sa.Integer(), nullable=False),
            sa.Column("status", status_type, nullable=False, server_default="NOT_STARTED"),
            sa.Column("completed_at", sa.DateTime(), nullable=True),
            sa.Column("best_score", sa.Float(), nullable=True),
            sa.Column("last_score", sa.Float(), nullable=True),
            sa.Column("checks_taken", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("last_check_at", sa.DateTime(), nullable=True),
            sa.Column("next_review_at", sa.DateTime(), nullable=True),
            sa.Column("question_ids", sa.JSON(), nullable=True),
            sa.Column("previous_question_ids", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["student_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["chapter_id"], ["gs_lms_book_chapters.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("student_id", "chapter_id", name="uq_gs_lms_chapter_progress"),
        )
        op.create_index(op.f("ix_gs_lms_chapter_progress_id"), "gs_lms_chapter_progress", ["id"], unique=False)
        op.create_index(op.f("ix_gs_lms_chapter_progress_student_id"), "gs_lms_chapter_progress", ["student_id"], unique=False)
        op.create_index(op.f("ix_gs_lms_chapter_progress_chapter_id"), "gs_lms_chapter_progress", ["chapter_id"], unique=False)
        op.create_index(op.f("ix_gs_lms_chapter_progress_next_review_at"), "gs_lms_chapter_progress", ["next_review_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_gs_lms_chapter_progress_next_review_at"), table_name="gs_lms_chapter_progress")
    op.drop_index(op.f("ix_gs_lms_chapter_progress_chapter_id"), table_name="gs_lms_chapter_progress")
    op.drop_index(op.f("ix_gs_lms_chapter_progress_student_id"), table_name="gs_lms_chapter_progress")
    op.drop_index(op.f("ix_gs_lms_chapter_progress_id"), table_name="gs_lms_chapter_progress")
    op.drop_table("gs_lms_chapter_progress")

    op.drop_index(op.f("ix_gs_lms_retention_questions_review_status"), table_name="gs_lms_retention_questions")
    op.drop_index(op.f("ix_gs_lms_retention_questions_book_chapter_id"), table_name="gs_lms_retention_questions")
    op.drop_index(op.f("ix_gs_lms_retention_questions_subject_slug"), table_name="gs_lms_retention_questions")
    op.drop_index(op.f("ix_gs_lms_retention_questions_external_id"), table_name="gs_lms_retention_questions")
    op.drop_index(op.f("ix_gs_lms_retention_questions_id"), table_name="gs_lms_retention_questions")
    op.drop_table("gs_lms_retention_questions")

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        from sqlalchemy.dialects.postgresql import ENUM as pg_ENUM
        pg_ENUM(*_STATUS, name=_ENUM_NAME).drop(bind, checkfirst=True)
