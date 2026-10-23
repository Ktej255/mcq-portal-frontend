"""Add concept versions, books, book chapters, concept book refs, learner profiles

Revision ID: j7d8e9f0a1b2
Revises: f9c2d5e8a3b6
Create Date: 2026-10-22

A concept can hold several ready-made versions (level x style x source) so each
student sees the most suitable one. Books/chapters let concepts map to the
editions students study from; learner profiles store each student's
preferences. Additive only: five new tables, four new enum types, and the
existing ``gsreviewstatusenum`` type is reused.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "j7d8e9f0a1b2"
down_revision: Union[str, None] = "f9c2d5e8a3b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_ENUMS = {
    "gslmsversionlevelenum": ("BASIC", "STANDARD", "ADVANCED"),
    "gslmsversionstyleenum": ("TEXT", "VISUAL", "VIDEO", "STORY"),
    "gslmsversionsourceenum": ("NCERT", "COACHING", "REFERENCE_BOOK", "ORIGINAL"),
    "gslmsstudypathenum": ("COACHING", "REFERENCE_BOOKS", "NCERT_ONLY", "MIXED"),
}


def _enum(name: str, is_postgres: bool):
    if is_postgres:
        from sqlalchemy.dialects.postgresql import ENUM as pg_ENUM
        return pg_ENUM(*_ENUMS[name], name=name, create_type=False)
    return sa.Enum(*_ENUMS[name], name=name, create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    existing = set(sa.inspect(bind).get_table_names())
    is_postgres = bind.dialect.name == "postgresql"

    if is_postgres:
        from sqlalchemy.dialects.postgresql import ENUM as pg_ENUM
        for name, values in _ENUMS.items():
            pg_ENUM(*values, name=name).create(bind, checkfirst=True)
        review_status = pg_ENUM(name="gsreviewstatusenum", create_type=False)
    else:
        review_status = sa.Enum(
            "UNREVIEWED", "IN_REVIEW", "REVIEWED", name="gsreviewstatusenum", create_type=False
        )

    def audit_cols():
        return [
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.Column("created_by", sa.String(), nullable=True),
            sa.Column("updated_by", sa.String(), nullable=True),
        ]

    if "gs_lms_concept_versions" not in existing:
        op.create_table(
            "gs_lms_concept_versions",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("concept_id", sa.Integer(), nullable=False),
            sa.Column("level", _enum("gslmsversionlevelenum", is_postgres), nullable=False),
            sa.Column("style", _enum("gslmsversionstyleenum", is_postgres), nullable=False),
            sa.Column("source", _enum("gslmsversionsourceenum", is_postgres), nullable=False),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("blocks", sa.JSON(), nullable=True),
            sa.Column("video_url", sa.Text(), nullable=True),
            sa.Column("duration_minutes", sa.Integer(), nullable=True),
            sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("review_status", review_status, nullable=False),
            *audit_cols(),
            sa.ForeignKeyConstraint(["concept_id"], ["gs_lms_concepts.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint(
                "concept_id", "level", "style", "source",
                name="uq_gs_lms_concept_versions_combo",
            ),
        )
        op.create_index(op.f("ix_gs_lms_concept_versions_id"), "gs_lms_concept_versions", ["id"], unique=False)
        op.create_index(op.f("ix_gs_lms_concept_versions_concept_id"), "gs_lms_concept_versions", ["concept_id"], unique=False)
        op.create_index(op.f("ix_gs_lms_concept_versions_review_status"), "gs_lms_concept_versions", ["review_status"], unique=False)

    if "gs_lms_books" not in existing:
        op.create_table(
            "gs_lms_books",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("slug", sa.String(), nullable=False),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("author", sa.String(), nullable=False),
            sa.Column("edition", sa.String(), nullable=False),
            sa.Column("publisher", sa.String(), nullable=True),
            sa.Column("exam_tag", sa.String(), nullable=False, server_default="UPSC"),
            sa.Column("subject_slug", sa.String(), nullable=True),
            *audit_cols(),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_gs_lms_books_id"), "gs_lms_books", ["id"], unique=False)
        op.create_index(op.f("ix_gs_lms_books_slug"), "gs_lms_books", ["slug"], unique=True)
        op.create_index(op.f("ix_gs_lms_books_subject_slug"), "gs_lms_books", ["subject_slug"], unique=False)

    if "gs_lms_book_chapters" not in existing:
        op.create_table(
            "gs_lms_book_chapters",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("book_id", sa.Integer(), nullable=False),
            sa.Column("number", sa.Integer(), nullable=False),
            sa.Column("title", sa.String(), nullable=False),
            sa.ForeignKeyConstraint(["book_id"], ["gs_lms_books.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("book_id", "number", name="uq_gs_lms_book_chapters_number"),
        )
        op.create_index(op.f("ix_gs_lms_book_chapters_id"), "gs_lms_book_chapters", ["id"], unique=False)
        op.create_index(op.f("ix_gs_lms_book_chapters_book_id"), "gs_lms_book_chapters", ["book_id"], unique=False)

    if "gs_lms_concept_book_refs" not in existing:
        op.create_table(
            "gs_lms_concept_book_refs",
            sa.Column("concept_id", sa.Integer(), nullable=False),
            sa.Column("chapter_id", sa.Integer(), nullable=False),
            sa.Column("pages", sa.String(), nullable=True),
            sa.ForeignKeyConstraint(["concept_id"], ["gs_lms_concepts.id"]),
            sa.ForeignKeyConstraint(["chapter_id"], ["gs_lms_book_chapters.id"]),
            sa.PrimaryKeyConstraint("concept_id", "chapter_id"),
        )
        op.create_index(op.f("ix_gs_lms_concept_book_refs_chapter_id"), "gs_lms_concept_book_refs", ["chapter_id"], unique=False)

    if "gs_lms_learner_profiles" not in existing:
        op.create_table(
            "gs_lms_learner_profiles",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("student_id", sa.Integer(), nullable=False),
            sa.Column("preferred_style", _enum("gslmsversionstyleenum", is_postgres), nullable=True),
            sa.Column("preferred_level", _enum("gslmsversionlevelenum", is_postgres), nullable=True),
            sa.Column("study_path", _enum("gslmsstudypathenum", is_postgres), nullable=True),
            sa.Column("book_ids", sa.JSON(), nullable=True),
            *audit_cols(),
            sa.ForeignKeyConstraint(["student_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_gs_lms_learner_profiles_id"), "gs_lms_learner_profiles", ["id"], unique=False)
        op.create_index(op.f("ix_gs_lms_learner_profiles_student_id"), "gs_lms_learner_profiles", ["student_id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_gs_lms_learner_profiles_student_id"), table_name="gs_lms_learner_profiles")
    op.drop_index(op.f("ix_gs_lms_learner_profiles_id"), table_name="gs_lms_learner_profiles")
    op.drop_table("gs_lms_learner_profiles")

    op.drop_index(op.f("ix_gs_lms_concept_book_refs_chapter_id"), table_name="gs_lms_concept_book_refs")
    op.drop_table("gs_lms_concept_book_refs")

    op.drop_index(op.f("ix_gs_lms_book_chapters_book_id"), table_name="gs_lms_book_chapters")
    op.drop_index(op.f("ix_gs_lms_book_chapters_id"), table_name="gs_lms_book_chapters")
    op.drop_table("gs_lms_book_chapters")

    op.drop_index(op.f("ix_gs_lms_books_subject_slug"), table_name="gs_lms_books")
    op.drop_index(op.f("ix_gs_lms_books_slug"), table_name="gs_lms_books")
    op.drop_index(op.f("ix_gs_lms_books_id"), table_name="gs_lms_books")
    op.drop_table("gs_lms_books")

    op.drop_index(op.f("ix_gs_lms_concept_versions_review_status"), table_name="gs_lms_concept_versions")
    op.drop_index(op.f("ix_gs_lms_concept_versions_concept_id"), table_name="gs_lms_concept_versions")
    op.drop_index(op.f("ix_gs_lms_concept_versions_id"), table_name="gs_lms_concept_versions")
    op.drop_table("gs_lms_concept_versions")

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        from sqlalchemy.dialects.postgresql import ENUM as pg_ENUM
        for name, values in _ENUMS.items():
            pg_ENUM(*values, name=name).drop(bind, checkfirst=True)
