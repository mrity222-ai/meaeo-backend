from pathlib import Path
from scripts.check_release_files import scan
from scripts.deployment_database import ADDITIONS, PREVIOUS, TARGET, check_baseline
from app.database.base import DatabaseBase
from scripts.deploy_release import archive, restore


def schema():
    return {table.name: {column.name for column in table.columns} for table in DatabaseBase.metadata.sorted_tables}


def test_previous_baseline_allows_only_new_columns_missing():
    columns = schema()
    for table, column in ADDITIONS:
        columns[table].remove(column)
    assert not check_baseline([PREVIOUS], set(columns), columns)
    columns['business_profiles'].remove('id')
    assert check_baseline([PREVIOUS], set(columns), columns)


def test_unknown_or_incomplete_database_is_blocked():
    columns = schema()
    assert check_baseline([], set(columns), columns)
    assert check_baseline(['unknown'], set(columns), columns)
    assert not check_baseline([TARGET], set(columns), columns)
    assert check_baseline([TARGET], set(), {})


def test_release_rejects_runtime_and_secrets_without_values(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    assert scan(['.env', 'data/assets/photo.png', 'generated/images/x.png'])
    Path('source.py').write_text('token="' + 'ghp_' + 'a' * 36 + '"')
    errors = scan(['source.py'])
    assert errors and 'a' * 36 not in str(errors)
    assert not scan(['.env.example'])


def test_runtime_survives_checkout_removal(tmp_path):
    root = tmp_path / 'project'
    (root / 'data/assets').mkdir(parents=True)
    photo = root / 'data/assets/photo.png'
    photo.write_bytes(b'customer photo')
    (root / '.env').write_text('private config')
    bundle = tmp_path / 'runtime.tar.gz'
    archive(root, bundle)
    photo.unlink()
    restore(root, bundle)
    assert photo.read_bytes() == b'customer photo'
    assert (root / '.env').read_text() == 'private config'
