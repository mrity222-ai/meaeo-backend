from app.database.base import DatabaseBase
from app.database.models import (
    Campaign,
)
from app.database.session import engine


def main():

    print(
        "Creating missing database tables..."
    )

    DatabaseBase.metadata.create_all(
        engine
    )

    print(
        "Database schema creation: PASSED"
    )

    engine.dispose()


if __name__ == "__main__":
    main()