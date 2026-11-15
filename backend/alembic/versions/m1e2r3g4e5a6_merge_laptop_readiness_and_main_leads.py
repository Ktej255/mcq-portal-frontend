"""Merge the laptop readiness chain with main's leads/daily-usage chain.

Both branches started from f956dee6d068. Main added marketing leads and
daily usage; the laptop added CA/GS repair tables and readiness tables.
This revision joins the two heads so `alembic upgrade head` has one target.

Revision ID: m1e2r3g4e5a6
Revises: d3a8f6c2e1b7, l9a0b1c2d3e4
"""
from typing import Sequence, Union

revision: str = "m1e2r3g4e5a6"
down_revision: Union[str, Sequence[str], None] = ("d3a8f6c2e1b7", "l9a0b1c2d3e4")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
