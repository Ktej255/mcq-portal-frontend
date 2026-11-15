"""add readiness, demand, release, and beta access tables

Revision ID: l9a0b1c2d3e4
Revises: k8f9a0b1c2d3
Create Date: 2026-10-27 23:40:00.000000

Additive readiness platform schema. No existing table is altered.

* ``gs_lms_demand_weights`` — cached PYQ-derived demand per leaf topic.
* ``gs_lms_readiness_snapshots`` — daily learner readiness and projection.
* ``gs_lms_content_releases`` — approved public content manifests.
* ``gs_lms_beta_access`` — comp/support cohort access.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "l9a0b1c2d3e4"
down_revision: Union[str, None] = "k8f9a0b1c2d3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "gs_lms_demand_weights",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("subject_id", sa.Integer(), nullable=False),
        sa.Column("syllabus_node_id", sa.Integer(), nullable=False),
        sa.Column("demand_share", sa.Float(), nullable=False),
        sa.Column("demand_score", sa.Float(), nullable=False),
        sa.Column("pyq_count", sa.Integer(), nullable=False),
        sa.Column("weighted_pyq", sa.Float(), nullable=False),
        sa.Column("distinct_years", sa.Integer(), nullable=False),
        sa.Column("last_pyq_year", sa.Integer(), nullable=True),
        sa.Column("demand_confidence", sa.Float(), nullable=False),
        sa.Column("components", sa.JSON(), nullable=True),
        sa.Column("computed_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("created_by", sa.String(), nullable=True),
        sa.Column("updated_by", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["subject_id"], ["gs_subjects.id"]),
        sa.ForeignKeyConstraint(
            ["syllabus_node_id"], ["gs_lms_syllabus_nodes.id"]
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "syllabus_node_id", name="uq_gs_lms_demand_weight_node"
        ),
    )
    op.create_index(
        op.f("ix_gs_lms_demand_weights_id"),
        "gs_lms_demand_weights",
        ["id"],
    )
    op.create_index(
        op.f("ix_gs_lms_demand_weights_subject_id"),
        "gs_lms_demand_weights",
        ["subject_id"],
    )
    op.create_index(
        op.f("ix_gs_lms_demand_weights_syllabus_node_id"),
        "gs_lms_demand_weights",
        ["syllabus_node_id"],
    )
    op.create_index(
        "ix_gs_lms_demand_subject", "gs_lms_demand_weights", ["subject_id"]
    )

    op.create_table(
        "gs_lms_readiness_snapshots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("subject_id", sa.Integer(), nullable=False),
        sa.Column("snapshot_date", sa.Date(), nullable=False),
        sa.Column("computed_at", sa.DateTime(), nullable=False),
        sa.Column("readiness_score", sa.Float(), nullable=False),
        sa.Column("band", sa.String(length=32), nullable=False),
        sa.Column("projected_correct_low", sa.Float(), nullable=True),
        sa.Column("projected_correct_expected", sa.Float(), nullable=True),
        sa.Column("projected_correct_high", sa.Float(), nullable=True),
        sa.Column("projected_net_low", sa.Float(), nullable=True),
        sa.Column("projected_net_expected", sa.Float(), nullable=True),
        sa.Column("projected_net_high", sa.Float(), nullable=True),
        sa.Column("confidence_level", sa.String(length=16), nullable=False),
        sa.Column("assessed_demand_pct", sa.Float(), nullable=False),
        sa.Column("coverage_pct", sa.Float(), nullable=False),
        sa.Column("depth_pct", sa.Float(), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("created_by", sa.String(), nullable=True),
        sa.Column("updated_by", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["student_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["subject_id"], ["gs_subjects.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "student_id",
            "subject_id",
            "snapshot_date",
            name="uq_gs_lms_readiness_snapshot_day",
        ),
    )
    op.create_index(
        op.f("ix_gs_lms_readiness_snapshots_id"),
        "gs_lms_readiness_snapshots",
        ["id"],
    )
    op.create_index(
        op.f("ix_gs_lms_readiness_snapshots_student_id"),
        "gs_lms_readiness_snapshots",
        ["student_id"],
    )
    op.create_index(
        op.f("ix_gs_lms_readiness_snapshots_subject_id"),
        "gs_lms_readiness_snapshots",
        ["subject_id"],
    )
    op.create_index(
        op.f("ix_gs_lms_readiness_snapshots_snapshot_date"),
        "gs_lms_readiness_snapshots",
        ["snapshot_date"],
    )
    op.create_index(
        "ix_gs_lms_readiness_student_subject_time",
        "gs_lms_readiness_snapshots",
        ["student_id", "subject_id", "computed_at"],
    )

    op.create_table(
        "gs_lms_content_releases",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("subject_id", sa.Integer(), nullable=False),
        sa.Column("version", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("scope", sa.JSON(), nullable=True),
        sa.Column("approved_by", sa.String(length=256), nullable=True),
        sa.Column("approved_at", sa.DateTime(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("created_by", sa.String(), nullable=True),
        sa.Column("updated_by", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["subject_id"], ["gs_subjects.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "subject_id", "version", name="uq_gs_lms_content_release_version"
        ),
    )
    op.create_index(
        op.f("ix_gs_lms_content_releases_id"), "gs_lms_content_releases", ["id"]
    )
    op.create_index(
        op.f("ix_gs_lms_content_releases_subject_id"),
        "gs_lms_content_releases",
        ["subject_id"],
    )
    op.create_index(
        "ix_gs_lms_content_release_subject_status",
        "gs_lms_content_releases",
        ["subject_id", "status"],
    )

    op.create_table(
        "gs_lms_beta_access",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("access_type", sa.String(length=16), nullable=False),
        sa.Column("starts_at", sa.DateTime(), nullable=False),
        sa.Column("ends_at", sa.DateTime(), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("reason", sa.String(length=256), nullable=True),
        sa.Column("created_by", sa.String(length=256), nullable=True),
        sa.Column("updated_by", sa.String(length=256), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_gs_lms_beta_access_user"),
    )
    op.create_index(
        op.f("ix_gs_lms_beta_access_id"), "gs_lms_beta_access", ["id"]
    )
    op.create_index(
        op.f("ix_gs_lms_beta_access_user_id"),
        "gs_lms_beta_access",
        ["user_id"],
    )
    op.create_index(
        "ix_gs_lms_beta_access_status", "gs_lms_beta_access", ["status"]
    )


def downgrade() -> None:
    op.drop_table("gs_lms_beta_access")
    op.drop_table("gs_lms_content_releases")
    op.drop_table("gs_lms_readiness_snapshots")
    op.drop_table("gs_lms_demand_weights")
