"""add production schema indexes

Revision ID: b0638ba5406f
Revises: add_brand_overlay_configuration
Create Date: 2026-09-07

Synchronize the PostgreSQL schema with the SQLAlchemy models.

This migration:
1. Adds missing business_account_id indexes.
2. Replaces the duplicate idempotency-key constraint/index
   arrangement with a single unique index.

JSONB columns are intentionally left unchanged.
"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "b0638ba5406f"

down_revision: Union[str, Sequence[str], None] = (
    "add_brand_overlay_configuration"
)

branch_labels: Union[str, Sequence[str], None] = None

depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --------------------------------------------------------
    # Business-account indexes
    # --------------------------------------------------------

    op.create_index(
        "ix_assets_business_account_id",
        "assets",
        ["business_account_id"],
        unique=False,
    )

    op.create_index(
        "ix_brand_profiles_business_account_id",
        "brand_profiles",
        ["business_account_id"],
        unique=False,
    )

    op.create_index(
        "ix_business_profiles_business_account_id",
        "business_profiles",
        ["business_account_id"],
        unique=False,
    )

    op.create_index(
        "ix_campaigns_business_account_id",
        "campaigns",
        ["business_account_id"],
        unique=False,
    )

    op.create_index(
        "ix_marketing_preferences_business_account_id",
        "marketing_preferences",
        ["business_account_id"],
        unique=False,
    )

    op.create_index(
        "ix_products_business_account_id",
        "products",
        ["business_account_id"],
        unique=False,
    )

    op.create_index(
        "ix_target_audiences_business_account_id",
        "target_audiences",
        ["business_account_id"],
        unique=False,
    )

    # --------------------------------------------------------
    # Idempotency key
    #
    # Keep exactly one uniqueness mechanism:
    # a unique index.
    # --------------------------------------------------------

    op.drop_constraint(
        "uq_campaign_post_publication_idempotency_key",
        "campaign_post_publications",
        type_="unique",
    )

    op.drop_index(
        "ix_campaign_post_publications_idempotency_key",
        table_name="campaign_post_publications",
    )

    op.create_index(
        "ix_campaign_post_publications_idempotency_key",
        "campaign_post_publications",
        ["idempotency_key"],
        unique=True,
    )


def downgrade() -> None:
    # --------------------------------------------------------
    # Restore original idempotency structure
    # --------------------------------------------------------

    op.drop_index(
        "ix_campaign_post_publications_idempotency_key",
        table_name="campaign_post_publications",
    )

    op.create_index(
        "ix_campaign_post_publications_idempotency_key",
        "campaign_post_publications",
        ["idempotency_key"],
        unique=False,
    )

    op.create_unique_constraint(
        "uq_campaign_post_publication_idempotency_key",
        "campaign_post_publications",
        ["idempotency_key"],
    )

    # --------------------------------------------------------
    # Remove business-account indexes
    # --------------------------------------------------------

    op.drop_index(
        "ix_target_audiences_business_account_id",
        table_name="target_audiences",
    )

    op.drop_index(
        "ix_products_business_account_id",
        table_name="products",
    )

    op.drop_index(
        "ix_marketing_preferences_business_account_id",
        table_name="marketing_preferences",
    )

    op.drop_index(
        "ix_campaigns_business_account_id",
        table_name="campaigns",
    )

    op.drop_index(
        "ix_business_profiles_business_account_id",
        table_name="business_profiles",
    )

    op.drop_index(
        "ix_brand_profiles_business_account_id",
        table_name="brand_profiles",
    )

    op.drop_index(
        "ix_assets_business_account_id",
        table_name="assets",
    )