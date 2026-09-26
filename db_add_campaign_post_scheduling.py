from sqlalchemy import text

from app.database.session import engine


SQL = """
ALTER TABLE campaign_posts
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;

ALTER TABLE campaign_posts
ADD COLUMN IF NOT EXISTS publish_status VARCHAR(32)
NOT NULL DEFAULT 'pending';

ALTER TABLE campaign_posts
ADD COLUMN IF NOT EXISTS publishing_started_at TIMESTAMPTZ;

ALTER TABLE campaign_posts
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

ALTER TABLE campaign_posts
ADD COLUMN IF NOT EXISTS external_ids JSONB;

ALTER TABLE campaign_posts
ADD COLUMN IF NOT EXISTS publishing_error VARCHAR(10000);

CREATE INDEX IF NOT EXISTS ix_campaign_posts_scheduled_for
ON campaign_posts (scheduled_for);

CREATE INDEX IF NOT EXISTS ix_campaign_posts_publish_status
ON campaign_posts (publish_status);
"""


def main():

    with engine.begin() as connection:

        connection.execute(
            text(SQL)
        )

    print(
        "CAMPAIGN POST SCHEDULING "
        "DATABASE MIGRATION: PASSED"
    )


if __name__ == "__main__":
    main()