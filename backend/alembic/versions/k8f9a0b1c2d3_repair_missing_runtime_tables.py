"""repair missing runtime tables and column

Revision ID: k8f9a0b1c2d3
Revises: j7d8e9f0a1b2
Create Date: 2026-10-27 23:30:00.000000

The local database was partially created out of band: Alembic was stamped past
several revisions whose tables were never created. This migration repairs the
known drift without re-running or editing shipped migrations.

Missing objects repaired here:

* ``payment_orders``
* ``subscriptions``
* ``payment_webhook_logs``
* ``optional_current_affairs``
* ``optional_map_locations``
* ``optional_map_questions``
* ``ca_items.continues_from_id`` (+ index, Postgres FK)

Every operation checks the live schema first, so the migration is safe on a
partially-created database and on a fresh database. It is additive: no
existing table is dropped, no data is rewritten, and no column is altered.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "k8f9a0b1c2d3"
down_revision: Union[str, None] = "j7d8e9f0a1b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _bind():
    return op.get_bind()


def _tables() -> set[str]:
    return set(sa.inspect(_bind()).get_table_names())


def _columns(table: str) -> set[str]:
    return {column["name"] for column in sa.inspect(_bind()).get_columns(table)}


def _dialect() -> str:
    return _bind().dialect.name


def _now_default():
    return sa.text("CURRENT_TIMESTAMP") if _dialect() == "sqlite" else sa.func.now()


def _json_type():
    if _dialect() == "postgresql":
        return postgresql.JSONB(astext_type=sa.Text())
    return sa.JSON()


def _review_status_enum():
    if _dialect() == "postgresql":
        return postgresql.ENUM(
            "UNREVIEWED",
            "IN_REVIEW",
            "REVIEWED",
            name="optionalreviewstatusenum",
            create_type=False,
        )
    return sa.Enum(
        "UNREVIEWED",
        "IN_REVIEW",
        "REVIEWED",
        name="optionalreviewstatusenum",
    )


def _create_payment_orders() -> None:
    now = _now_default()
    op.create_table(
        "payment_orders",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.String(length=64), nullable=False),
        sa.Column("cashfree_order_id", sa.String(length=128), nullable=True),
        sa.Column("payment_session_id", sa.String(length=256), nullable=True),
        sa.Column("user_id", sa.String(length=128), nullable=False),
        sa.Column("user_email", sa.String(length=256), nullable=True),
        sa.Column("plan_tier", sa.String(length=20), nullable=False),
        sa.Column("billing_cycle", sa.String(length=20), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column(
            "currency", sa.String(length=3), nullable=False, server_default="INR"
        ),
        sa.Column(
            "status", sa.String(length=20), nullable=False, server_default="pending"
        ),
        sa.Column("refund_status", sa.String(length=20), nullable=True),
        sa.Column("cashfree_refund_id", sa.String(length=128), nullable=True),
        sa.Column("payment_method", sa.String(length=64), nullable=True),
        sa.Column("cashfree_payment_id", sa.String(length=128), nullable=True),
        sa.Column("webhook_received_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=now),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=now),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_id", name="uq_payment_orders_order_id"),
    )
    op.create_index(op.f("ix_payment_orders_id"), "payment_orders", ["id"])
    op.create_index(
        "idx_payment_orders_user_id", "payment_orders", ["user_id"]
    )
    op.create_index("idx_payment_orders_status", "payment_orders", ["status"])
    op.create_index(
        "idx_payment_orders_cashfree_order_id",
        "payment_orders",
        ["cashfree_order_id"],
    )


def _create_subscriptions() -> None:
    now = _now_default()
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.String(length=128), nullable=False),
        sa.Column("plan_tier", sa.String(length=20), nullable=False),
        sa.Column("billing_cycle", sa.String(length=20), nullable=False),
        sa.Column("order_id", sa.String(length=64), nullable=False),
        sa.Column("start_date", sa.DateTime(), nullable=False),
        sa.Column("end_date", sa.DateTime(), nullable=False),
        sa.Column(
            "status", sa.String(length=20), nullable=False, server_default="active"
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=now),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=now),
        sa.ForeignKeyConstraint(
            ["order_id"],
            ["payment_orders.order_id"],
            name="fk_subscriptions_order_id",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_subscriptions_id"), "subscriptions", ["id"])
    op.create_index("idx_subscriptions_user_id", "subscriptions", ["user_id"])
    op.create_index("idx_subscriptions_status", "subscriptions", ["status"])
    op.create_index("idx_subscriptions_end_date", "subscriptions", ["end_date"])


def _create_payment_webhook_logs() -> None:
    op.create_table(
        "payment_webhook_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=True),
        sa.Column("order_id", sa.String(length=64), nullable=True),
        sa.Column("cashfree_order_id", sa.String(length=128), nullable=True),
        sa.Column("payment_status", sa.String(length=32), nullable=True),
        sa.Column("raw_payload", _json_type(), nullable=True),
        sa.Column("signature_valid", sa.Boolean(), nullable=True),
        sa.Column("processing_outcome", sa.String(length=32), nullable=True),
        sa.Column("source_ip", sa.String(length=45), nullable=True),
        sa.Column(
            "received_at", sa.DateTime(), nullable=False, server_default=_now_default()
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_payment_webhook_logs_id"), "payment_webhook_logs", ["id"]
    )
    op.create_index(
        "idx_webhook_logs_order_id", "payment_webhook_logs", ["order_id"]
    )


def _create_optional_current_affairs() -> None:
    op.create_table(
        "optional_current_affairs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("subject_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("topic", sa.String(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("source_url", sa.String(), nullable=True),
        sa.Column("published_on", sa.Date(), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("review_status", _review_status_enum(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("created_by", sa.String(), nullable=True),
        sa.Column("updated_by", sa.String(), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["subject_id"], ["optional_subjects.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_optional_current_affairs_id"),
        "optional_current_affairs",
        ["id"],
    )
    op.create_index(
        op.f("ix_optional_current_affairs_subject_id"),
        "optional_current_affairs",
        ["subject_id"],
    )
    op.create_index(
        op.f("ix_optional_current_affairs_topic"),
        "optional_current_affairs",
        ["topic"],
    )
    op.create_index(
        op.f("ix_optional_current_affairs_published_on"),
        "optional_current_affairs",
        ["published_on"],
    )
    op.create_index(
        op.f("ix_optional_current_affairs_review_status"),
        "optional_current_affairs",
        ["review_status"],
    )


def _create_optional_mapping_tables() -> None:
    review_status = _review_status_enum()

    op.create_table(
        "optional_map_locations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("subject_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("detail", sa.Text(), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("authored", sa.Boolean(), nullable=False),
        sa.Column("review_status", review_status, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("created_by", sa.String(), nullable=True),
        sa.Column("updated_by", sa.String(), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["subject_id"], ["optional_subjects.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_optional_map_locations_id"), "optional_map_locations", ["id"]
    )
    op.create_index(
        op.f("ix_optional_map_locations_subject_id"),
        "optional_map_locations",
        ["subject_id"],
    )
    op.create_index(
        op.f("ix_optional_map_locations_name"), "optional_map_locations", ["name"]
    )
    op.create_index(
        op.f("ix_optional_map_locations_category"),
        "optional_map_locations",
        ["category"],
    )
    op.create_index(
        op.f("ix_optional_map_locations_review_status"),
        "optional_map_locations",
        ["review_status"],
    )
    op.create_index(
        op.f("ix_optional_map_locations_is_deleted"),
        "optional_map_locations",
        ["is_deleted"],
    )

    op.create_table(
        "optional_map_questions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("subject_id", sa.Integer(), nullable=False),
        sa.Column("location_id", sa.Integer(), nullable=True),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("marks", sa.Integer(), nullable=True),
        sa.Column("beyond_syllabus", sa.Boolean(), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("review_status", review_status, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("created_by", sa.String(), nullable=True),
        sa.Column("updated_by", sa.String(), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["subject_id"], ["optional_subjects.id"]),
        sa.ForeignKeyConstraint(["location_id"], ["optional_map_locations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_optional_map_questions_id"), "optional_map_questions", ["id"]
    )
    op.create_index(
        op.f("ix_optional_map_questions_subject_id"),
        "optional_map_questions",
        ["subject_id"],
    )
    op.create_index(
        op.f("ix_optional_map_questions_location_id"),
        "optional_map_questions",
        ["location_id"],
    )
    op.create_index(
        op.f("ix_optional_map_questions_year"),
        "optional_map_questions",
        ["year"],
    )
    op.create_index(
        op.f("ix_optional_map_questions_category"),
        "optional_map_questions",
        ["category"],
    )
    op.create_index(
        op.f("ix_optional_map_questions_review_status"),
        "optional_map_questions",
        ["review_status"],
    )


def _add_continues_from_id() -> None:
    if "continues_from_id" in _columns("ca_items"):
        return

    op.add_column(
        "ca_items", sa.Column("continues_from_id", sa.Integer(), nullable=True)
    )
    op.create_index(
        op.f("ix_ca_items_continues_from_id"),
        "ca_items",
        ["continues_from_id"],
    )
    if _dialect() != "sqlite":
        op.create_foreign_key(
            "fk_ca_items_continues_from_id",
            "ca_items",
            "ca_items",
            ["continues_from_id"],
            ["id"],
        )


def upgrade() -> None:
    tables = _tables()

    if "payment_orders" not in tables:
        _create_payment_orders()
    if "subscriptions" not in tables:
        _create_subscriptions()
    if "payment_webhook_logs" not in tables:
        _create_payment_webhook_logs()
    if "optional_current_affairs" not in tables:
        _create_optional_current_affairs()
    if "optional_map_locations" not in tables:
        _create_optional_mapping_tables()
    elif "optional_map_questions" not in tables:
        raise RuntimeError(
            "optional_map_locations exists without optional_map_questions; "
            "manual inspection required"
        )

    if "ca_items" in _tables():
        _add_continues_from_id()


def downgrade() -> None:
    tables = _tables()

    if "ca_items" in tables and "continues_from_id" in _columns("ca_items"):
        if _dialect() != "sqlite":
            try:
                op.drop_constraint(
                    "fk_ca_items_continues_from_id", "ca_items", type_="foreignkey"
                )
            except Exception:
                pass
        op.drop_index(
            op.f("ix_ca_items_continues_from_id"), table_name="ca_items"
        )
        op.drop_column("ca_items", "continues_from_id")

    if "optional_map_questions" in tables:
        op.drop_table("optional_map_questions")
    if "optional_map_locations" in tables:
        op.drop_table("optional_map_locations")
    if "optional_current_affairs" in tables:
        op.drop_table("optional_current_affairs")
    if "payment_webhook_logs" in tables:
        op.drop_table("payment_webhook_logs")
    if "subscriptions" in tables:
        op.drop_table("subscriptions")
    if "payment_orders" in tables:
        op.drop_table("payment_orders")
