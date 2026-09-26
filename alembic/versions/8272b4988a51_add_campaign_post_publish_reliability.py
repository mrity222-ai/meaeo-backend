"""add campaign post publish reliability

Revision ID: 8272b4988a51
Revises: 6877f550575a
Create Date: 2026-09-02 20:40:19.547214

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8272b4988a51"
down_revision: Union[str, Sequence[str], None] = "6877f550575a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add publishing reliability fields to campaign_posts."""

    op.add_column(
        "campaign_posts",
        sa.Column(
            "publish_attempts",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )

    op.add_column(
        "campaign_posts",
        sa.Column(
            "max_publish_attempts",
            sa.Integer(),
            nullable=False,
            server_default="3",
        ),
    )

    op.add_column(
        "campaign_posts",
        sa.Column(
            "next_retry_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_campaign_posts_next_retry_at",
        "campaign_posts",
        ["next_retry_at"],
    )


def downgrade() -> None:
    """Remove publishing reliability fields from campaign_posts."""

    op.drop_index(
        "ix_campaign_posts_next_retry_at",
        table_name="campaign_posts",
    )

    op.drop_column(
        "campaign_posts",
        "next_retry_at",
    )

    op.drop_column(
        "campaign_posts",
        "max_publish_attempts",
    )

    op.drop_column(
        "campaign_posts",
        "publish_attempts",
    )