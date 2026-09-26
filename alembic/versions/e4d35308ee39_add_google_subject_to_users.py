"""add google subject to users

Revision ID: 4b6e9a1c2d7f
Revises: dc96d5d3fdc7
Create Date: 2026-09-13 01:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4b6e9a1c2d7f"
down_revision: Union[str, Sequence[str], None] = "dc96d5d3fdc7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "google_subject",
            sa.String(length=255),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_users_google_subject",
        "users",
        ["google_subject"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_users_google_subject",
        table_name="users",
    )

    op.drop_column(
        "users",
        "google_subject",
    )