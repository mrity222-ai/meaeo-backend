from app.database.base import DatabaseBase
from app.database.models import (
    Tenant,
    User,
    UserTenant,
    Asset,
    AssetUsage,
)
from app.database.session import engine


def main():

    DatabaseBase.metadata.create_all(
        bind=engine
    )

    print(
        "Database initialization: PASSED"
    )


if __name__ == "__main__":
    main()