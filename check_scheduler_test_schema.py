from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from app.models.config import settings


url = make_url(settings.DATABASE_URL).set(
    database="marketing_system_test"
)

engine = create_engine(url)

with engine.connect() as db:
    rows = db.execute(
        text(
            """
            SELECT
                column_name,
                data_type,
                column_default
            FROM information_schema.columns
            WHERE table_name = 'campaign_posts'
              AND column_name IN (
                  'publish_attempts',
                  'max_publish_attempts',
                  'next_retry_at'
              )
            ORDER BY column_name
            """
        )
    ).all()

    for row in rows:
        print(row)