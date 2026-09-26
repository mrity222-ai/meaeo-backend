"""enforce business channel tenant ownership

Revision ID: b93debdf3b2d
Revises: 08d1f081857c
Create Date: 2026-09-03
"""

from typing import Sequence, Union

from alembic import op


revision: str = "b93debdf3b2d"
down_revision: Union[str, Sequence[str], None] = "08d1f081857c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_business_account_id_tenant",
        "business_accounts",
        ["id", "tenant_id"],
    )

    op.drop_constraint(
        "business_channels_business_account_id_fkey",
        "business_channels",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "fk_business_channel_business_account_tenant",
        "business_channels",
        "business_accounts",
        ["business_account_id", "tenant_id"],
        ["id", "tenant_id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_business_channel_business_account_tenant",
        "business_channels",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "business_channels_business_account_id_fkey",
        "business_channels",
        "business_accounts",
        ["business_account_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.drop_constraint(
        "uq_business_account_id_tenant",
        "business_accounts",
        type_="unique",
    )