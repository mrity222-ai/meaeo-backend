"""add business accounts and channels

Revision ID: 08d1f081857c
Revises: add_campaign_post_publications
Create Date: 2026-09-03 09:01:48.903952

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "08d1f081857c"
down_revision: Union[str, Sequence[str], None] = "add_campaign_post_publications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table(
        "business_accounts",
        sa.Column(
            "id",
            sa.Integer(),
            autoincrement=True,
            nullable=False,
        ),
        sa.Column(
            "tenant_id",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "name",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=32),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenants.tenant_id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_business_accounts_tenant_id",
        "business_accounts",
        ["tenant_id"],
        unique=False,
    )

    op.create_index(
        "ix_business_accounts_status",
        "business_accounts",
        ["status"],
        unique=False,
    )

    op.create_table(
        "business_channels",
        sa.Column(
            "id",
            sa.Integer(),
            autoincrement=True,
            nullable=False,
        ),
        sa.Column(
            "tenant_id",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "business_account_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "platform",
            sa.String(length=64),
            nullable=False,
        ),
        sa.Column(
            "external_account_id",
            sa.String(length=512),
            nullable=False,
        ),
        sa.Column(
            "account_name",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=32),
            nullable=False,
        ),
        sa.Column(
            "is_enabled",
            sa.Boolean(),
            nullable=False,
        ),
        sa.Column(
            "platform_metadata",
            postgresql.JSONB(),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenants.tenant_id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["business_account_id"],
            ["business_accounts.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "tenant_id",
            "platform",
            "external_account_id",
            name="uq_business_channel_tenant_platform_account",
        ),
        sa.UniqueConstraint(
            "business_account_id",
            "platform",
            name="uq_business_channel_business_platform",
        ),
    )

    op.create_index(
        "ix_business_channels_tenant_id",
        "business_channels",
        ["tenant_id"],
        unique=False,
    )

    op.create_index(
        "ix_business_channels_business_account_id",
        "business_channels",
        ["business_account_id"],
        unique=False,
    )

    op.create_index(
        "ix_business_channels_status",
        "business_channels",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index(
        "ix_business_channels_status",
        table_name="business_channels",
    )

    op.drop_index(
        "ix_business_channels_business_account_id",
        table_name="business_channels",
    )

    op.drop_index(
        "ix_business_channels_tenant_id",
        table_name="business_channels",
    )

    op.drop_table("business_channels")

    op.drop_index(
        "ix_business_accounts_status",
        table_name="business_accounts",
    )

    op.drop_index(
        "ix_business_accounts_tenant_id",
        table_name="business_accounts",
    )

    op.drop_table("business_accounts")