import os
import subprocess

from sqlalchemy.engine import make_url

from app.models.config import settings


def main():
    test_url = make_url(settings.DATABASE_URL).set(
        database="marketing_system_test"
    )

    env = os.environ.copy()
    env["DATABASE_URL"] = str(test_url)

    print(
        "Stamping:",
        test_url.render_as_string(hide_password=True),
    )

    result = subprocess.run(
        ["alembic", "stamp", "head"],
        env=env,
        check=False,
    )

    if result.returncode != 0:
        raise SystemExit(result.returncode)

    print("TEST DATABASE STAMPED AT HEAD")


if __name__ == "__main__":
    main()