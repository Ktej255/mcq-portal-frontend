"""Add marketing_leads table

Revision ID: c7d1e5a9b2f4
Revises: f956dee6d068
Create Date: 2026-10-20

Stores leads from the public site (the free diagnostic) so none are lost when
the team email notification is not configured.
"""

from alembic import op
import sqlalchemy as sa

revision = 'c7d1e5a9b2f4'
down_revision = 'f956dee6d068'
branch_labels = None
depends_on = None


def upgrade():
    inspector = sa.inspect(op.get_bind())
    if 'marketing_leads' in inspector.get_table_names():
        return
    op.create_table(
        'marketing_leads',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=120), nullable=True),
        sa.Column('email', sa.String(length=254), nullable=False),
        sa.Column('phone', sa.String(length=32), nullable=True),
        sa.Column('source', sa.String(length=40), nullable=False, server_default='diagnostic'),
        sa.Column('answers', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_marketing_leads_id', 'marketing_leads', ['id'])
    op.create_index('ix_marketing_leads_email_source', 'marketing_leads', ['email', 'source'])


def downgrade():
    op.drop_index('ix_marketing_leads_email_source', table_name='marketing_leads')
    op.drop_index('ix_marketing_leads_id', table_name='marketing_leads')
    op.drop_table('marketing_leads')
