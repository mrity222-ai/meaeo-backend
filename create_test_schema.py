from sqlalchemy import create_engine
from sqlalchemy.engine import make_url

from app.database.base import DatabaseBase
from app.database import models  # noqa: F401
from app.models.config import settings


def main():
    url = make_url(settings.DATABASE_URL).set(
        database="marketing_system_test"
    )

    print("Creating schema in:", url.render_as_string(hide_password=True))

    engine = create_engine(url)

    DatabaseBase.metadata.create_all(engine)

    print("TEST DATABASE SCHEMA CREATED")


if __name__ == "__main__":
    main()