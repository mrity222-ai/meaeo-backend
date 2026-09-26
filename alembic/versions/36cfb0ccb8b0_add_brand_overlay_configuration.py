"""add brand overlay configuration

Revision ID: add_brand_overlay_configuration
Revises: make_publications_channel_aware
Create Date: 2026-09-07
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "add_brand_overlay_configuration"

down_revision: Union[str, Sequence[str], None] = (
    "make_publications_channel_aware"
)

branch_labels: Union[str, Sequence[str], None] = None

depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.add_column(
        "brand_profiles",
        sa.Column(
            "website",
            sa.String(length=2048),
            nullable=True,
        ),
    )

    op.add_column(
        "brand_profiles",
        sa.Column(
            "phone",
            sa.String(length=64),
            nullable=True,
        ),
    )

    op.add_column(
        "brand_profiles",
        sa.Column(
            "whatsapp",
            sa.String(length=64),
            nullable=True,
        ),
    )

    op.add_column(
        "brand_profiles",
        sa.Column(
            "email",
            sa.String(length=320),
            nullable=True,
        ),
    )

    op.add_column(
        "brand_profiles",
        sa.Column(
            "address",
            sa.String(length=2048),
            nullable=True,
        ),
    )

    op.add_column(
        "brand_profiles",
        sa.Column(
            "logo_position",
            sa.String(length=32),
            server_default="upper_right",
            nullable=False,
        ),
    )

    op.add_column(
        "brand_profiles",
        sa.Column(
            "contact_position",
            sa.String(length=32),
            server_default="lower_right",
            nullable=False,
        ),
    )


def downgrade() -> None:

    op.drop_column(
        "brand_profiles",
        "contact_position",
    )

    op.drop_column(
        "brand_profiles",
        "logo_position",
    )

    op.drop_column(
        "brand_profiles",
        "address",
    )

    op.drop_column(
        "brand_profiles",
        "email",
    )

    op.drop_column(
        "brand_profiles",
        "whatsapp",
    )

    op.drop_column(
        "brand_profiles",
        "phone",
    )

    op.drop_column(
        "brand_profiles",
        "website",
    )