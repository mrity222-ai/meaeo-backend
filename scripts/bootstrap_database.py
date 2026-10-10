"""Initialize a provably empty database from current metadata, atomically."""
from alembic.migration import MigrationContext
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import inspect
from app.database.base import DatabaseBase
from app.database.session import engine
from scripts.deployment_database import TARGET, check_baseline
from app.models.config import settings
from app.services.admin_settings_service import settings_scope


def verify_indexes(inspector):
    for table in DatabaseBase.metadata.sorted_tables:
        indexes = {item['name']: item for item in inspector.get_indexes(table.name)}
        for index in table.indexes:
            actual = indexes.get(index.name)
            if not actual or tuple(actual['column_names']) != tuple(c.name for c in index.columns) or bool(actual['unique']) != bool(index.unique):
                raise RuntimeError('Database index does not match current schema: ' + str(index.name))


def initialize(connection):
    scripts = ScriptDirectory.from_config(Config('alembic.ini'))
    if scripts.get_heads() != [TARGET]:
        raise RuntimeError('Bootstrap schema revision must match migration head')
    if connection.dialect.name == 'postgresql':
        connection.exec_driver_sql('SELECT pg_advisory_xact_lock(713640921)')
    inspector = inspect(connection)
    tables = set(inspector.get_table_names())
    if tables:
        revisions = MigrationContext.configure(connection).get_current_heads()
        columns = {table: {c['name'] for c in inspector.get_columns(table)} for table in tables}
        errors = check_baseline(revisions, tables, columns)
        if set(revisions) != {TARGET} or errors:
            raise RuntimeError('Database is not empty and not at the verified current revision; audit it before initial setup.')
        verify_indexes(inspector)
        return False
    # The historical baseline is empty. Build the complete current model schema
    # only when there are no existing tables; never stamp an unknown database.
    DatabaseBase.metadata.create_all(connection)
    context = MigrationContext.configure(connection)
    context.stamp(scripts, TARGET)
    inspector = inspect(connection)
    tables = set(inspector.get_table_names())
    columns = {table: {c['name'] for c in inspector.get_columns(table)} for table in tables}
    if check_baseline([TARGET], tables, columns):
        raise RuntimeError('Fresh schema verification failed')
    verify_indexes(inspector)
    return True


def main():
    if settings.APP_ENV.lower() not in {'production', 'prod'}:
        raise RuntimeError('Production environment is required')
    with settings_scope():
        settings.validate_production_config()
    with engine.begin() as connection:
        created = initialize(connection)
    print('Fresh database initialized.' if created else 'Existing current database verified; data preserved.')


if __name__ == '__main__':
    main()
