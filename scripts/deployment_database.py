"""Read-only production configuration and migration baseline preflight."""
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import inspect
from app.database.base import DatabaseBase
from app.database.session import engine
from app.database import models  # noqa: F401
from app.models.config import settings
from app.services.admin_settings_service import settings_scope

PREVIOUS = "f16ff42ae755"
TARGET = "27a1c72e9d10"
ADDITIONS = {("business_profiles", "pincode"), ("brand_profiles", "accent_color"), ("target_audiences", "age_groups")}


def check_baseline(revisions, tables, columns):
    errors = []
    if set(revisions) not in ({PREVIOUS}, {TARGET}):
        errors.append("Database baseline is unversioned, older or unexpected. Audit it before deploying; do not automatically stamp a revision.")
    for table in DatabaseBase.metadata.sorted_tables:
        if table.name not in tables:
            errors.append(f"Missing table: {table.name}")
            continue
        for column in table.columns:
            if (table.name, column.name) in ADDITIONS and set(revisions) == {PREVIOUS}:
                continue
            if column.name not in columns.get(table.name, set()):
                errors.append(f"Missing column: {table.name}.{column.name}")
    return errors


def main():
    if settings.APP_ENV.strip().lower() not in {"prod", "production"}:
        raise SystemExit("APP_ENV must be production for deployment.")
    with settings_scope():
        settings.validate_production_config()
    script = ScriptDirectory.from_config(Config("alembic.ini"))
    if script.get_heads() != [TARGET]:
        raise SystemExit("Unexpected migration head; update the deployment compatibility checks.")
    with engine.connect() as connection:
        inspector = inspect(connection)
        tables = set(inspector.get_table_names())
        columns = {table: {item["name"] for item in inspector.get_columns(table)} for table in tables}
        errors = check_baseline(MigrationContext.configure(connection).get_current_heads(), tables, columns)
    if errors:
        raise SystemExit("\n".join(errors))
    print("Production configuration and migration baseline verified.")


if __name__ == "__main__":
    main()
