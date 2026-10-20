"""Add daily_usage table

Revision ID: d3a8f6c2e1b7
Revises: c7d1e5a9b2f4
Create Date: 2026-10-20

Per-user daily counters (MCQs answered today) used to enforce plan limits.
"""

from alembic import op
import sqlalchemy as sa

revision = 'd3a8f6c2e1b7'
down_revision = 'c7d1e5a9b2f4'
branch_labels = None
depends_on = None


def upgrade():
    inspector = sa.inspect(op.get_bind())
    if 'daily_usage' in inspector.get_table_names():
        return
    op.create_table(
        'daily_usage',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('usage_date', sa.Date(), nullable=False),
        sa.Column('metric', sa.String(length=40), nullable=False),
        sa.Column('count', sa.Integer(), nullable=False, server_default='0'),
        sa.UniqueConstraint('user_id', 'usage_date', 'metric', name='uq_daily_usage'),
    )
    op.create_index('ix_daily_usage_id', 'daily_usage', ['id'])
    op.create_index('ix_daily_usage_user_id', 'daily_usage', ['user_id'])


def downgrade():
    op.drop_index('ix_daily_usage_user_id', table_name='daily_usage')
    op.drop_index('ix_daily_usage_id', table_name='daily_usage')
    op.drop_table('daily_usage')
