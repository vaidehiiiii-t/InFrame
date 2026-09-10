"""Initial schema for users, events, and event_members

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-07 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('face_registered', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('rekognition_face_id', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. Events table
    op.create_table(
        'events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('host_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('event_date', sa.Date(), nullable=False),
        sa.Column('pin_code', sa.String(length=8), nullable=False),
        sa.Column('retention_days', sa.Integer(), nullable=False),
        sa.Column('rekognition_collection_id', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f('ix_events_id'), 'events', ['id'], unique=False)
    op.create_index(op.f('ix_events_host_id'), 'events', ['host_id'], unique=False)
    op.create_index(op.f('ix_events_pin_code'), 'events', ['pin_code'], unique=True)

    # 3. Event Members table
    op.create_table(
        'event_members',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('event_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('events.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('event_id', 'user_id', name='uq_event_members_event_user')
    )
    op.create_index(op.f('ix_event_members_id'), 'event_members', ['id'], unique=False)
    op.create_index(op.f('ix_event_members_event_id'), 'event_members', ['event_id'], unique=False)
    op.create_index(op.f('ix_event_members_user_id'), 'event_members', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_table('event_members')
    op.drop_table('events')
    op.drop_table('users')
