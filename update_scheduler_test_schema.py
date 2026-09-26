from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from app.models.config import settings


def main():
    url = make_url(settings.DATABASE_URL).set(
        database="marketing_system_test"
    )

    engine = create_engine(url)

    statements = [
        # ------------------------------------------------------------------
        # Campaign post publishing reliability
        # ------------------------------------------------------------------
        """
        ALTER TABLE campaign_posts
        ADD COLUMN IF NOT EXISTS publish_attempts
        INTEGER NOT NULL DEFAULT 0
        """,

        """
        ALTER TABLE campaign_posts
        ADD COLUMN IF NOT EXISTS max_publish_attempts
        INTEGER NOT NULL DEFAULT 3
        """,

        """
        ALTER TABLE campaign_posts
        ADD COLUMN IF NOT EXISTS next_retry_at
        TIMESTAMP WITH TIME ZONE
        """,

        """
        CREATE INDEX IF NOT EXISTS
        ix_campaign_posts_next_retry_at
        ON campaign_posts (next_retry_at)
        """,

        # ------------------------------------------------------------------
        # Business accounts
        # ------------------------------------------------------------------
        """
        CREATE TABLE IF NOT EXISTS business_accounts (
            id SERIAL PRIMARY KEY,
            tenant_id VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL,

            CONSTRAINT business_accounts_tenant_id_fkey
                FOREIGN KEY (tenant_id)
                REFERENCES tenants (tenant_id)
                ON DELETE CASCADE
        )
        """,

        """
        CREATE INDEX IF NOT EXISTS
        ix_business_accounts_tenant_id
        ON business_accounts (tenant_id)
        """,

        """
        CREATE INDEX IF NOT EXISTS
        ix_business_accounts_status
        ON business_accounts (status)
        """,

        # ------------------------------------------------------------------
        # Business account composite uniqueness
        #
        # Required so (business_account_id, tenant_id) can be referenced
        # by the composite foreign key below.
        # ------------------------------------------------------------------
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'uq_business_account_id_tenant'
            ) THEN
                ALTER TABLE business_accounts
                ADD CONSTRAINT uq_business_account_id_tenant
                UNIQUE (id, tenant_id);
            END IF;
        END
        $$
        """,

        # ------------------------------------------------------------------
        # Business channels
        # ------------------------------------------------------------------
        """
        CREATE TABLE IF NOT EXISTS business_channels (
            id SERIAL PRIMARY KEY,
            tenant_id VARCHAR(255) NOT NULL,
            business_account_id INTEGER NOT NULL,
            platform VARCHAR(64) NOT NULL,
            external_account_id VARCHAR(512) NOT NULL,
            account_name VARCHAR(255) NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'active',
            is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
            platform_metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL,

            CONSTRAINT business_channels_tenant_id_fkey
                FOREIGN KEY (tenant_id)
                REFERENCES tenants (tenant_id)
                ON DELETE CASCADE,

            CONSTRAINT business_channels_business_account_id_fkey
                FOREIGN KEY (business_account_id)
                REFERENCES business_accounts (id)
                ON DELETE CASCADE,

            CONSTRAINT uq_business_channel_tenant_platform_account
                UNIQUE (
                    tenant_id,
                    platform,
                    external_account_id
                ),

            CONSTRAINT uq_business_channel_business_platform
                UNIQUE (
                    business_account_id,
                    platform
                )
        )
        """,

        """
        CREATE INDEX IF NOT EXISTS
        ix_business_channels_tenant_id
        ON business_channels (tenant_id)
        """,

        """
        CREATE INDEX IF NOT EXISTS
        ix_business_channels_business_account_id
        ON business_channels (business_account_id)
        """,

        """
        CREATE INDEX IF NOT EXISTS
        ix_business_channels_status
        ON business_channels (status)
        """,

        # ------------------------------------------------------------------
        # Campaign -> Business Account
        #
        # Campaigns are owned by a BusinessAccount. The composite FK also
        # guarantees that the campaign tenant and business-account tenant
        # cannot be mismatched.
        # ------------------------------------------------------------------
        """
        ALTER TABLE campaigns
        ADD COLUMN IF NOT EXISTS business_account_id
        INTEGER
        """,

        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'campaigns'
                  AND column_name = 'business_account_id'
                  AND is_nullable = 'YES'
                  AND NOT EXISTS (
                      SELECT 1
                      FROM campaigns
                      WHERE business_account_id IS NULL
                  )
            ) THEN
                ALTER TABLE campaigns
                ALTER COLUMN business_account_id SET NOT NULL;
            END IF;
        END
        $$
        """,

        """
        CREATE INDEX IF NOT EXISTS
        ix_campaigns_business_account_id
        ON campaigns (business_account_id)
        """,

        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'fk_campaigns_business_account_tenant'
            ) THEN
                ALTER TABLE campaigns
                ADD CONSTRAINT fk_campaigns_business_account_tenant
                FOREIGN KEY (
                    business_account_id,
                    tenant_id
                )
                REFERENCES business_accounts (
                    id,
                    tenant_id
                )
                ON DELETE CASCADE;
            END IF;
        END
        $$
        """,

        """
        CREATE INDEX IF NOT EXISTS
        ix_campaigns_business_account_id
        ON campaigns (business_account_id)
        """,

        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'fk_campaigns_business_account_tenant'
            ) THEN
                ALTER TABLE campaigns
                ADD CONSTRAINT fk_campaigns_business_account_tenant
                FOREIGN KEY (
                    business_account_id,
                    tenant_id
                )
                REFERENCES business_accounts (
                    id,
                    tenant_id
                )
                ON DELETE CASCADE;
            END IF;
        END
        $$
        """,

        # ------------------------------------------------------------------
        # Replace old single-column business-account FK with the
        # tenant-safe composite FK.
        #
        # This makes it impossible for:
        #
        #   business_channels.tenant_id = Tenant A
        #   business_channels.business_account_id = Account owned by Tenant B
        #
        # ------------------------------------------------------------------
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname =
                    'business_channels_business_account_id_fkey'
            ) THEN
                ALTER TABLE business_channels
                DROP CONSTRAINT
                    business_channels_business_account_id_fkey;
            END IF;
        END
        $$
        """,

        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname =
                    'fk_business_channel_business_account_tenant'
            ) THEN
                ALTER TABLE business_channels
                ADD CONSTRAINT
                    fk_business_channel_business_account_tenant
                FOREIGN KEY (
                    business_account_id,
                    tenant_id
                )
                REFERENCES business_accounts (
                    id,
                    tenant_id
                )
                ON DELETE CASCADE;
            END IF;
        END
        $$
        """,
    ]

    with engine.begin() as db:
        for statement in statements:
            db.execute(text(statement))

    print("TEST DATABASE SCHEMA UPDATED")


if __name__ == "__main__":
    main()