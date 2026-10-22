"""Add gs_lms_content_requests and gs_lms_content_request_students

Revision ID: k8e9f0a1b2c3
Revises: j7d8e9f0a1b2
Create Date: 2026-10-22

Study searches that found nothing (or only a weak match) are counted per
normalised query so the content team knows what to build next. The link table
counts distinct students without storing the raw query per student. Additive
only: two new tables and one new enum type.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "k8e9f0a1b2c3"
down_revision: Union[str, None] = "j7d8e9f0a1b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_STATUS = ("OPEN", "PLANNED", "ADDRESSED")
_ENUM_NAME = "gslmscontentrequeststatusenum"


def upgrade() -> None:
    bind = op.get_bind()
    existing = set(sa.inspect(bind).get_table_names())
    is_postgres = bind.dialect.name == "postgresql"

    if is_postgres:
        from sqlalchemy.dialects.postgresql import ENUM as pg_ENUM
        pg_ENUM(*_STATUS, name=_ENUM_NAME).create(bind, checkfirst=True)
        status_type = pg_ENUM(*_STATUS, name=_ENUM_NAME, create_type=False)
    else:
        status_type = sa.Enum(*_STATUS, name=_ENUM_NAME, create_type=False)

    if "gs_lms_content_requests" not in existing:
        op.create_table(
            "gs_lms_content_requests",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("normalized_query", sa.String(length=200), nullable=False),
            sa.Column("sample_query", sa.String(length=200), nullable=False),
            sa.Column("subject_slug", sa.String(), nullable=True),
            sa.Column("request_count", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("distinct_students", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("first_requested_at", sa.DateTime(), nullable=False),
            sa.Column("last_requested_at", sa.DateTime(), nullable=False),
            sa.Column("status", status_type, nullable=False, server_default="OPEN"),
            sa.Column("note", sa.Text(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_gs_lms_content_requests_id"), "gs_lms_content_requests", ["id"], unique=False)
        op.create_index(op.f("ix_gs_lms_content_requests_normalized_query"), "gs_lms_content_requests", ["normalized_query"], unique=True)
        op.create_index(op.f("ix_gs_lms_content_requests_subject_slug"), "gs_lms_content_requests", ["subject_slug"], unique=False)
        op.create_index(op.f("ix_gs_lms_content_requests_status"), "gs_lms_content_requests", ["status"], unique=False)

    if "gs_lms_content_request_students" not in existing:
        op.create_table(
            "gs_lms_content_request_students",
            sa.Column("request_id", sa.Integer(), nullable=False),
            sa.Column("student_id", sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(["request_id"], ["gs_lms_content_requests.id"]),
            sa.ForeignKeyConstraint(["student_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("request_id", "student_id"),
        )
        op.create_index(op.f("ix_gs_lms_content_request_students_student_id"), "gs_lms_content_request_students", ["student_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_gs_lms_content_request_students_student_id"), table_name="gs_lms_content_request_students")
    op.drop_table("gs_lms_content_request_students")

    op.drop_index(op.f("ix_gs_lms_content_requests_status"), table_name="gs_lms_content_requests")
    op.drop_index(op.f("ix_gs_lms_content_requests_subject_slug"), table_name="gs_lms_content_requests")
    op.drop_index(op.f("ix_gs_lms_content_requests_normalized_query"), table_name="gs_lms_content_requests")
    op.drop_index(op.f("ix_gs_lms_content_requests_id"), table_name="gs_lms_content_requests")
    op.drop_table("gs_lms_content_requests")

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        from sqlalchemy.dialects.postgresql import ENUM as pg_ENUM
        pg_ENUM(*_STATUS, name=_ENUM_NAME).drop(bind, checkfirst=True)
