from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from app.models.config import settings

engine = create_engine(
    make_url(settings.DATABASE_URL).set(
        database="marketing_system_test"
    )
)

with engine.connect() as db:
    print(
        db.execute(
            text("""
                SELECT
                    column_name,
                    is_nullable,
                    data_type
                FROM information_schema.columns
                WHERE table_name = 'campaigns'
                  AND column_name = 'business_account_id'
            """)
        ).fetchall()
    )

    print(
        db.execute(
            text("""
                SELECT conname
                FROM pg_constraint
                WHERE conrelid = 'campaigns'::regclass
                ORDER BY conname
            """)
        ).fetchall()
    )
