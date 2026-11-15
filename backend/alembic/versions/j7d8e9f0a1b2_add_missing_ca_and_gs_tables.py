"""add missing ca and gs tables

Revision ID: j7d8e9f0a1b2
Revises: f956dee6d068
Create Date: 2026-08-29 18:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'j7d8e9f0a1b2'
down_revision: Union[str, None] = 'f956dee6d068'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. ca_doubt_chats
    op.create_table(
        'ca_doubt_chats',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('ca_item_id', sa.Integer(), nullable=False),
        sa.Column('messages', sa.JSON(), nullable=False),
        sa.Column('total_messages', sa.Integer(), server_default='0', nullable=False),
        sa.Column('last_message_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.String(), nullable=True),
        sa.Column('updated_by', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['ca_item_id'], ['ca_items.id'], ),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', 'ca_item_id', name='uq_ca_doubt_chat_student_item')
    )
    op.create_index(op.f('ix_ca_doubt_chats_ca_item_id'), 'ca_doubt_chats', ['ca_item_id'], unique=False)
    op.create_index(op.f('ix_ca_doubt_chats_id'), 'ca_doubt_chats', ['id'], unique=False)
    op.create_index(op.f('ix_ca_doubt_chats_student_id'), 'ca_doubt_chats', ['student_id'], unique=False)

    # 2. ca_weekly_compilations
    op.create_table(
        'ca_weekly_compilations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('week_start', sa.Date(), nullable=False),
        sa.Column('week_end', sa.Date(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('total_daily_items', sa.Integer(), nullable=False),
        sa.Column('condensed_content', sa.JSON(), nullable=False),
        sa.Column('key_facts', sa.JSON(), nullable=True),
        sa.Column('mcq_ids', sa.JSON(), nullable=True),
        sa.Column('source_item_ids', sa.JSON(), nullable=False),
        sa.Column('review_status', sa.String(length=15), server_default='DRAFT', nullable=False),
        sa.Column('pdf_storage_ref', sa.String(length=500), nullable=True),
        sa.Column('generated_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.String(), nullable=True),
        sa.Column('updated_by', sa.String(), nullable=True),
        sa.CheckConstraint('total_daily_items >= 0', name='ck_ca_weekly_compilation_item_count'),
        sa.CheckConstraint('week_end >= week_start', name='ck_ca_weekly_compilation_period'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('week_start', 'week_end', name='uq_ca_weekly_compilation_period')
    )
    op.create_index(op.f('ix_ca_weekly_compilations_id'), 'ca_weekly_compilations', ['id'], unique=False)
    op.create_index(op.f('ix_ca_weekly_compilations_review_status'), 'ca_weekly_compilations', ['review_status'], unique=False)
    op.create_index(op.f('ix_ca_weekly_compilations_week_start'), 'ca_weekly_compilations', ['week_start'], unique=False)

    # 3. gs_lms_pyq_reveals
    op.create_table(
        'gs_lms_pyq_reveals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('pyq_id', sa.Integer(), nullable=False),
        sa.Column('revealed_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.String(), nullable=True),
        sa.Column('updated_by', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['pyq_id'], ['gs_lms_pyqs.id'], ),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id', 'pyq_id', name='uq_gs_lms_pyq_reveal')
    )
    op.create_index(op.f('ix_gs_lms_pyq_reveals_id'), 'gs_lms_pyq_reveals', ['id'], unique=False)
    op.create_index(op.f('ix_gs_lms_pyq_reveals_pyq_id'), 'gs_lms_pyq_reveals', ['pyq_id'], unique=False)
    op.create_index(op.f('ix_gs_lms_pyq_reveals_student_id'), 'gs_lms_pyq_reveals', ['student_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_gs_lms_pyq_reveals_student_id'), table_name='gs_lms_pyq_reveals')
    op.drop_index(op.f('ix_gs_lms_pyq_reveals_pyq_id'), table_name='gs_lms_pyq_reveals')
    op.drop_index(op.f('ix_gs_lms_pyq_reveals_id'), table_name='gs_lms_pyq_reveals')
    op.drop_table('gs_lms_pyq_reveals')

    op.drop_index(op.f('ix_ca_weekly_compilations_week_start'), table_name='ca_weekly_compilations')
    op.drop_index(op.f('ix_ca_weekly_compilations_review_status'), table_name='ca_weekly_compilations')
    op.drop_index(op.f('ix_ca_weekly_compilations_id'), table_name='ca_weekly_compilations')
    op.drop_table('ca_weekly_compilations')

    op.drop_index(op.f('ix_ca_doubt_chats_student_id'), table_name='ca_doubt_chats')
    op.drop_index(op.f('ix_ca_doubt_chats_id'), table_name='ca_doubt_chats')
    op.drop_index(op.f('ix_ca_doubt_chats_ca_item_id'), table_name='ca_doubt_chats')
    op.drop_table('ca_doubt_chats')
