"""add email verifications

Revision ID: 4ac77400f1a6
Revises: 4b6e9a1c2d7f
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4ac77400f1a6"
down_revision: Union[str, Sequence[str], None] = "4b6e9a1c2d7f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "email_verifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("code_hash", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("business_name", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "last_sent_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "attempts",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "max_attempts",
            sa.Integer(),
            nullable=False,
            server_default="5",
        ),
        sa.Column(
            "verified_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_email_verifications_email",
        "email_verifications",
        ["email"],
        unique=False,
    )

    op.create_index(
        "ix_email_verifications_expires_at",
        "email_verifications",
        ["expires_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_email_verifications_expires_at",
        table_name="email_verifications",
    )

    op.drop_index(
        "ix_email_verifications_email",
        table_name="email_verifications",
    )

    op.drop_table("email_verifications")