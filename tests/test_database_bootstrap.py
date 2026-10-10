import pytest
from sqlalchemy import create_engine, inspect, text
from alembic.migration import MigrationContext
from scripts.bootstrap_database import initialize
from scripts.deployment_database import TARGET
from app.database.base import DatabaseBase
import json
from scripts import deploy_release


def test_empty_database_creates_complete_schema_and_version():
    engine = create_engine('sqlite://')
    with engine.begin() as connection:
        assert initialize(connection) is True
        assert set(DatabaseBase.metadata.tables) <= set(inspect(connection).get_table_names())
        assert MigrationContext.configure(connection).get_current_heads() == (TARGET,)
        for table in DatabaseBase.metadata.sorted_tables:
            actual = {i['name'] for i in inspect(connection).get_indexes(table.name)}
            assert {i.name for i in table.indexes} <= actual


def test_retry_preserves_existing_rows():
    engine = create_engine('sqlite://')
    with engine.begin() as connection:
        initialize(connection)
        connection.execute(text('CREATE TABLE keep_me (value TEXT)'))
        connection.execute(text("INSERT INTO keep_me VALUES ('saved')"))
        assert initialize(connection) is False
        assert connection.execute(text('SELECT value FROM keep_me')).scalar_one() == 'saved'


def test_unknown_database_is_not_stamped_or_modified():
    engine = create_engine('sqlite://')
    with engine.begin() as connection:
        connection.execute(text('CREATE TABLE legacy (id INTEGER)'))
        with pytest.raises(RuntimeError, match='not empty'):
            initialize(connection)
        assert inspect(connection).get_table_names() == ['legacy']


def test_incomplete_stamped_database_is_rejected():
    engine = create_engine('sqlite://')
    with engine.begin() as connection:
        connection.execute(text('CREATE TABLE alembic_version (version_num VARCHAR(32))'))
        connection.execute(text('INSERT INTO alembic_version VALUES (:revision)'), {'revision': TARGET})
        with pytest.raises(RuntimeError, match='not empty'):
            initialize(connection)


@pytest.mark.parametrize('fail_bootstrap', [False, True])
def test_first_install_initializes_before_starting_app(tmp_path, monkeypatch, fail_bootstrap):
    calls = []
    monkeypatch.setenv('MAEACO_RELEASE_TAG', 'test')
    config = {'services': {'postgres': {'environment': {}}, 'caddy': {'environment': {}}}}

    def fake_run(args, **kwargs):
        calls.append(args)
        if 'config' in args:
            return json.dumps(config).encode()
        if 'scripts.bootstrap_database' in args and fail_bootstrap:
            raise RuntimeError('unknown database')
        return b''

    monkeypatch.setattr(deploy_release, 'run', fake_run)
    monkeypatch.setattr(deploy_release, 'verify_live', lambda *args: calls.append(['live-check']))
    compose = ['docker', 'compose', '--env-file', '.env']
    if fail_bootstrap:
        with pytest.raises(RuntimeError, match='unknown database'):
            deploy_release.first_install(tmp_path, 'f' * 40, compose)
        assert not any('--force-recreate' in args for args in calls)
    else:
        deploy_release.first_install(tmp_path, 'f' * 40, compose)
        init = next(i for i, args in enumerate(calls) if 'scripts.bootstrap_database' in args)
        start = next(i for i, args in enumerate(calls) if '--force-recreate' in args)
        assert init < start
        assert calls[-1] == ['live-check']
