"""make campaign post publications channel aware

Revision ID: make_publications_channel_aware
Revises: c03e65826145
Create Date: 2026-09-03
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "make_publications_channel_aware"

down_revision: Union[str, Sequence[str], None] = (
    "c03e65826145"
)

branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    # --------------------------------------------------------
    # Add channel reference.
    # --------------------------------------------------------

    op.add_column(
        "campaign_post_publications",
        sa.Column(
            "business_channel_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_campaign_post_publications_business_channel_id",
        "campaign_post_publications",
        ["business_channel_id"],
    )

    op.create_foreign_key(
        "fk_campaign_post_publications_business_channel",
        "campaign_post_publications",
        "business_channels",
        ["business_channel_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # --------------------------------------------------------
    # Existing publication rows need a channel.
    #
    # Existing CampaignPosts already contain their platform.
    # For existing data, resolve the BusinessChannel belonging
    # to the same tenant and platform.
    # --------------------------------------------------------

    connection = op.get_bind()

    connection.execute(
        sa.text(
            """
            UPDATE campaign_post_publications cpp
            SET business_channel_id = bc.id
            FROM business_channels bc
            WHERE cpp.business_channel_id IS NULL
              AND bc.tenant_id = cpp.tenant_id
              AND LOWER(bc.platform) = LOWER(cpp.platform)
            """
        )
    )

    # --------------------------------------------------------
    # Existing rows that cannot be mapped cannot safely be
    # assigned an arbitrary channel.
    #
    # Production data must therefore satisfy this before the
    # column becomes NOT NULL.
    # --------------------------------------------------------

    unresolved = connection.execute(
        sa.text(
            """
            SELECT COUNT(*)
            FROM campaign_post_publications
            WHERE business_channel_id IS NULL
            """
        )
    ).scalar_one()

    if unresolved:
        raise RuntimeError(
            "Cannot make campaign_post_publications "
            "channel-aware: existing publication rows "
            "could not be mapped to a BusinessChannel."
        )

    op.alter_column(
        "campaign_post_publications",
        "business_channel_id",
        nullable=False,
    )

    # --------------------------------------------------------
    # Replace old platform uniqueness with channel uniqueness.
    # --------------------------------------------------------

    op.drop_constraint(
        "uq_campaign_post_publication_post_platform",
        "campaign_post_publications",
        type_="unique",
    )

    op.create_unique_constraint(
        "uq_campaign_post_publication_post_channel",
        "campaign_post_publications",
        [
            "campaign_post_id",
            "business_channel_id",
        ],
    )


def downgrade() -> None:

    op.drop_constraint(
        "uq_campaign_post_publication_post_channel",
        "campaign_post_publications",
        type_="unique",
    )

    op.create_unique_constraint(
        "uq_campaign_post_publication_post_platform",
        "campaign_post_publications",
        [
            "campaign_post_id",
            "platform",
        ],
    )

    op.drop_constraint(
        "fk_campaign_post_publications_business_channel",
        "campaign_post_publications",
        type_="foreignkey",
    )

    op.drop_index(
        "ix_campaign_post_publications_business_channel_id",
        table_name="campaign_post_publications",
    )

    op.drop_column(
        "campaign_post_publications",
        "business_channel_id",
    )