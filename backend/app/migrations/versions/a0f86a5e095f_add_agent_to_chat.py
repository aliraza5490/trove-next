"""add_agent_to_chat

Revision ID: a0f86a5e095f
Revises: 36e689b87d89
Create Date: 2026-07-25 16:38:09.487281

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a0f86a5e095f'
down_revision: Union[str, None] = '36e689b87d89'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('chat', sa.Column('agent', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('chat', 'agent')
