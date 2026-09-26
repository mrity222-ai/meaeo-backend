from sqlalchemy import text

from app.database.session import engine


def main():
    print("Adding campaign execution_mode column...")

    with engine.begin() as connection:

        connection.execute(
            text(
                """
                ALTER TABLE campaigns
                ADD COLUMN IF NOT EXISTS execution_mode
                VARCHAR(32)
                NOT NULL
                DEFAULT 'autonomous'
                """
            )
        )

    print(
        "Campaign execution_mode migration: PASSED"
    )


if __name__ == "__main__":
    main()