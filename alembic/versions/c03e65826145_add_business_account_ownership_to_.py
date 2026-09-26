"""add business account ownership to resources

Revision ID: c03e65826145
Revises: b93debdf3b2d
Create Date: 2026-09-03 13:19:52.058499

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c03e65826145"
down_revision: Union[str, Sequence[str], None] = "b93debdf3b2d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


RESOURCE_TABLES = (
    "business_profiles",
    "brand_profiles",
    "products",
    "target_audiences",
    "marketing_preferences",
    "assets",
    "campaigns",
)


def upgrade() -> None:
    """Add BusinessAccount ownership to existing resources."""

    connection = op.get_bind()

    # ---------------------------------------------------------
    # 1. Add nullable business_account_id columns.
    # ---------------------------------------------------------
    for table_name in RESOURCE_TABLES:
        op.add_column(
            table_name,
            sa.Column(
                "business_account_id",
                sa.Integer(),
                nullable=True,
            ),
        )

    # ---------------------------------------------------------
    # 2. Create one default BusinessAccount for every tenant
    #    that does not already have one.
    # ---------------------------------------------------------
    connection.execute(
        sa.text(
            """
            INSERT INTO business_accounts (
                tenant_id,
                name,
                status,
                created_at,
                updated_at
            )
            SELECT
                t.tenant_id,
                CASE
                    WHEN t.name IS NOT NULL AND t.name <> ''
                        THEN t.name
                    ELSE 'Default Business'
                END,
                'active',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            FROM tenants t
            WHERE NOT EXISTS (
                SELECT 1
                FROM business_accounts ba
                WHERE ba.tenant_id = t.tenant_id
            )
            """
        )
    )

    # ---------------------------------------------------------
    # 3. Backfill existing resources.
    # ---------------------------------------------------------
    for table_name in RESOURCE_TABLES:
        connection.execute(
            sa.text(
                f"""
                UPDATE {table_name} r
                SET business_account_id = ba.id
                FROM business_accounts ba
                WHERE r.tenant_id = ba.tenant_id
                  AND r.business_account_id IS NULL
                """
            )
        )

    # ---------------------------------------------------------
    # 4. Verify the backfill.
    # ---------------------------------------------------------
    for table_name in RESOURCE_TABLES:
        result = connection.execute(
            sa.text(
                f"""
                SELECT COUNT(*)
                FROM {table_name}
                WHERE business_account_id IS NULL
                """
            )
        )

        null_count = result.scalar_one()

        if null_count != 0:
            raise RuntimeError(
                f"BusinessAccount backfill failed for "
                f"{table_name}: {null_count} rows remain NULL."
            )

    # ---------------------------------------------------------
    # 5. Add tenant-safe composite foreign keys.
    # ---------------------------------------------------------
    for table_name in RESOURCE_TABLES:
        constraint_name = (
            f"fk_{table_name}_business_account_tenant"
        )

        op.create_foreign_key(
            constraint_name,
            table_name,
            "business_accounts",
            ["business_account_id", "tenant_id"],
            ["id", "tenant_id"],
            ondelete="CASCADE",
        )

    # ---------------------------------------------------------
    # 6. Remove the existing unique indexes that currently
    #    enforce one profile/preferences row per tenant.
    #
    #    These are indexes, not constraints.
    # ---------------------------------------------------------
    op.drop_index(
        "ix_business_profiles_tenant_id",
        table_name="business_profiles",
    )

    op.drop_index(
        "ix_brand_profiles_tenant_id",
        table_name="brand_profiles",
    )

    op.drop_index(
        "ix_marketing_preferences_tenant_id",
        table_name="marketing_preferences",
    )

    # Recreate them as normal non-unique indexes.
    op.create_index(
        "ix_business_profiles_tenant_id",
        "business_profiles",
        ["tenant_id"],
        unique=False,
    )

    op.create_index(
        "ix_brand_profiles_tenant_id",
        "brand_profiles",
        ["tenant_id"],
        unique=False,
    )

    op.create_index(
        "ix_marketing_preferences_tenant_id",
        "marketing_preferences",
        ["tenant_id"],
        unique=False,
    )

    # ---------------------------------------------------------
    # 7. Make business_account_id mandatory.
    # ---------------------------------------------------------
    for table_name in RESOURCE_TABLES:
        op.alter_column(
            table_name,
            "business_account_id",
            existing_type=sa.Integer(),
            nullable=False,
        )


def downgrade() -> None:
    """Remove BusinessAccount ownership from resources."""

    # ---------------------------------------------------------
    # 1. Remove composite foreign keys.
    # ---------------------------------------------------------
    for table_name in reversed(RESOURCE_TABLES):
        constraint_name = (
            f"fk_{table_name}_business_account_tenant"
        )

        op.drop_constraint(
            constraint_name,
            table_name,
            type_="foreignkey",
        )

    # ---------------------------------------------------------
    # 2. Remove business_account_id columns.
    # ---------------------------------------------------------
    for table_name in reversed(RESOURCE_TABLES):
        op.drop_column(
            table_name,
            "business_account_id",
        )

    # ---------------------------------------------------------
    # 3. Restore the original unique tenant indexes.
    # ---------------------------------------------------------
    op.drop_index(
        "ix_business_profiles_tenant_id",
        table_name="business_profiles",
    )

    op.drop_index(
        "ix_brand_profiles_tenant_id",
        table_name="brand_profiles",
    )

    op.drop_index(
        "ix_marketing_preferences_tenant_id",
        table_name="marketing_preferences",
    )

    op.create_index(
        "ix_business_profiles_tenant_id",
        "business_profiles",
        ["tenant_id"],
        unique=True,
    )

    op.create_index(
        "ix_brand_profiles_tenant_id",
        "brand_profiles",
        ["tenant_id"],
        unique=True,
    )

    op.create_index(
        "ix_marketing_preferences_tenant_id",
        "marketing_preferences",
        ["tenant_id"],
        unique=True,
    )