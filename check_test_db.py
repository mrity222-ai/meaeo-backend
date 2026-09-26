from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from app.models.config import settings


url = make_url(
    settings.DATABASE_URL
).set(
    database="marketing_system_test"
)

engine = create_engine(url)

with engine.connect() as connection:

    print(
        "DATABASE:",
        connection.execute(
            text("SELECT current_database()")
        ).scalar(),
    )

    tables = connection.execute(
        text(
            """
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
            """
        )
    ).fetchall()

    print("TABLES:")

    for table in tables:
        print(" -", table[0])

engine.dispose()