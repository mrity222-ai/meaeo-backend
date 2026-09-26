"""add campaign post publications

Revision ID: add_campaign_post_publications
Revises: 8272b4988a51
Create Date: 2026-09-02
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "add_campaign_post_publications"
down_revision: Union[str, Sequence[str], None] = (
    "8272b4988a51"
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create durable per-platform campaign post publication state."""

    op.create_table(
        "campaign_post_publications",

        sa.Column(
            "id",
            sa.Integer(),
            autoincrement=True,
            nullable=False,
        ),

        sa.Column(
            "campaign_post_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "tenant_id",
            sa.String(length=255),
            nullable=False,
        ),

        sa.Column(
            "platform",
            sa.String(length=64),
            nullable=False,
        ),

        sa.Column(
            "idempotency_key",
            sa.String(length=255),
            nullable=False,
        ),

        sa.Column(
            "status",
            sa.String(length=32),
            nullable=False,
            server_default="pending",
        ),

        sa.Column(
            "attempts",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),

        sa.Column(
            "external_id",
            sa.String(length=512),
            nullable=True,
        ),

        sa.Column(
            "provider_reference",
            sa.String(length=512),
            nullable=True,
        ),

        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),

        sa.Column(
            "completed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),

        sa.Column(
            "last_error",
            sa.String(length=10000),
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
            ["campaign_post_id"],
            ["campaign_posts.id"],
            ondelete="CASCADE",
        ),

        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenants.tenant_id"],
            ondelete="CASCADE",
        ),

        sa.PrimaryKeyConstraint("id"),

        sa.UniqueConstraint(
            "campaign_post_id",
            "platform",
            name="uq_campaign_post_publication_post_platform",
        ),

        sa.UniqueConstraint(
            "idempotency_key",
            name="uq_campaign_post_publication_idempotency_key",
        ),
    )

    op.create_index(
        "ix_campaign_post_publications_campaign_post_id",
        "campaign_post_publications",
        ["campaign_post_id"],
    )

    op.create_index(
        "ix_campaign_post_publications_tenant_id",
        "campaign_post_publications",
        ["tenant_id"],
    )

    op.create_index(
        "ix_campaign_post_publications_idempotency_key",
        "campaign_post_publications",
        ["idempotency_key"],
    )

    op.create_index(
        "ix_campaign_post_publications_status",
        "campaign_post_publications",
        ["status"],
    )


def downgrade() -> None:
    """Remove durable campaign post publication state."""

    op.drop_index(
        "ix_campaign_post_publications_status",
        table_name="campaign_post_publications",
    )

    op.drop_index(
        "ix_campaign_post_publications_idempotency_key",
        table_name="campaign_post_publications",
    )

    op.drop_index(
        "ix_campaign_post_publications_tenant_id",
        table_name="campaign_post_publications",
    )

    op.drop_index(
        "ix_campaign_post_publications_campaign_post_id",
        table_name="campaign_post_publications",
    )

    op.drop_table(
        "campaign_post_publications",
    )