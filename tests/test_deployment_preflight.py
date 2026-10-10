from pathlib import Path
from scripts.check_release_files import scan
from scripts.deployment_database import ADDITIONS, PREVIOUS, TARGET, check_baseline
from app.database.base import DatabaseBase
from scripts.deploy_release import archive, restore
from scripts import deploy_release
import json
import pytest
import subprocess
import sys


def test_empty_subdirectories_do_not_hide_data(tmp_path, monkeypatch):
    root = tmp_path / 'credentials'
    (root / 'tenant' / 'empty').mkdir(parents=True)
    def execute_check(args):
        result = subprocess.run([sys.executable, '-c', args[-1]], capture_output=True)
        if result.returncode:
            raise RuntimeError('Container check failed')
        return result.stdout
    monkeypatch.setattr(deploy_release, 'run', execute_check)
    deploy_release.check_empty_storage(running_backend(), [str(root), str(tmp_path / 'missing')])
    (root / 'tenant' / 'token.json').write_text('private')
    with pytest.raises(RuntimeError, match='hide container data'):
        deploy_release.check_empty_storage(running_backend(), [str(root)])


def running_backend():
    return {'Id': 'backend-id', 'Image': 'sha256:old', 'Mounts': [
        {'Type': 'bind', 'Source': '/opt/apps/meaeo-backend/data/assets', 'Destination': '/app/data/assets', 'RW': True},
        {'Type': 'bind', 'Source': '/opt/apps/meaeo-backend/generated/images', 'Destination': '/app/generated/images', 'RW': True}],
        'Config': {'Env': ['TOKEN=old$secret'], 'Cmd': ['python', 'run_api.py'], 'Entrypoint': None}}


def desired_backend():
    mounts = deploy_release.container_mounts(running_backend())
    mounts += [{'type': 'bind', 'source': '/opt/apps/meaeo-backend/' + name, 'target': target} for target, name in deploy_release.NEW_STORAGE.items()]
    return {'services': {'backend': {'volumes': mounts}}}


def test_running_mounts_allow_only_known_storage_additions():
    config = desired_backend()
    additions = deploy_release.check_mounts('backend', running_backend(), config, Path('/opt/apps/meaeo-backend'))
    assert set(additions) == set(deploy_release.NEW_STORAGE)
    config['services']['backend']['volumes'].reverse()
    assert set(deploy_release.check_mounts('backend', running_backend(), config, Path('/opt/apps/meaeo-backend'))) == set(additions)


@pytest.mark.parametrize('change', ['remove', 'redirect', 'readonly', 'unknown', 'wrong-new-source'])
def test_mount_check_blocks_storage_changes(change):
    config = desired_backend()
    mounts = config['services']['backend']['volumes']
    if change == 'remove':
        mounts.pop(0)
    elif change == 'redirect':
        mounts[0]['source'] = '/other/assets'
    elif change == 'readonly':
        mounts[0]['read_only'] = True
    elif change == 'wrong-new-source':
        mounts[2]['source'] = '/other/credentials'
    else:
        mounts.append({'type': 'bind', 'source': '/other', 'target': '/app/unknown'})
    with pytest.raises(RuntimeError, match='mount'):
        deploy_release.check_mounts('backend', running_backend(), config, Path('/opt/apps/meaeo-backend'))


def test_named_volume_compares_actual_volume_name():
    container = {'Mounts': [{'Type': 'volume', 'Name': 'existing_db', 'Source': '/docker/volumes/existing_db', 'Destination': '/var/lib/postgresql/data', 'RW': True}]}
    config = {'services': {'postgres': {'volumes': [{'type': 'volume', 'source': 'postgres_data', 'target': '/var/lib/postgresql/data'}]}}, 'volumes': {'postgres_data': {'name': 'existing_db'}}}
    assert deploy_release.check_mounts('postgres', container, config, Path('/opt/apps/meaeo-backend')) == []


def test_retry_rollback_uses_running_configuration_not_new_checkout():
    rollback = desired_backend()
    rollback['services']['backend']['environment'] = {'TOKEN': 'new'}
    rollback['services']['backend']['build'] = {'context': '.'}
    deploy_release.snapshot_container('backend', running_backend(), rollback)
    service = rollback['services']['backend']
    assert len(service['volumes']) == 2
    assert service['environment']['TOKEN'] == 'old$secret'
    assert service['image'] == 'sha256:old'
    assert service['healthcheck'] == {'disable': True}
    assert 'build' not in service
    assert deploy_release.literal_compose(rollback)['services']['backend']['environment']['TOKEN'] == 'old$$secret'


def test_nonempty_container_storage_blocks_additions(monkeypatch):
    def fail(args):
        raise RuntimeError('failed')
    monkeypatch.setattr(deploy_release, 'run', fail)
    with pytest.raises(RuntimeError, match='hide container data'):
        deploy_release.check_empty_storage(running_backend(), ['/app/data/settings'])


def test_shared_caddy_preserves_other_sites_without_duplicate_route():
    existing = 'other.example.com {\n reverse_proxy other:80\n}\n'
    merged = deploy_release.shared_caddy(existing)
    assert existing.strip() in merged
    assert 'thestocktimes.online, www.thestocktimes.online' in merged
    assert deploy_release.shared_caddy(merged) == merged
    with pytest.raises(RuntimeError, match='needs review'):
        deploy_release.shared_caddy('thestocktimes.online { reverse_proxy unknown:80 }')


@pytest.mark.parametrize('attached', [True, False])
def test_network_requires_stocktimes_upstream(monkeypatch, attached):
    calls = []
    def fake_run(args):
        calls.append(args)
        return json.dumps([{'Containers': {'id': {'Name': 'stocktimes-web' if attached else 'different-app'}}}]).encode()
    monkeypatch.setattr(deploy_release, 'run', fake_run)
    if attached:
        deploy_release.check_shared_network()
    else:
        with pytest.raises(RuntimeError, match='stocktimes-web'):
            deploy_release.check_shared_network()
    assert calls == [['docker', 'network', 'inspect', 'web']]


def test_live_verification_checks_both_stocktimes_domains(monkeypatch):
    calls = []
    monkeypatch.setattr(deploy_release, 'run', lambda args: calls.append(args))
    deploy_release.verify_live(['docker', 'compose'], {'services': {'caddy': {'environment': {'FRONTEND_DOMAIN': 'maeaco.com', 'BACKEND_DOMAIN': 'api.maeaco.com'}}}})
    urls = [args[-1] for args in calls if args[0] == 'curl']
    assert 'https://thestocktimes.online' in urls
    assert 'https://www.thestocktimes.online' in urls


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
