"""Linux VPS update runner. Run from the target commit, before checking it out."""
import datetime
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tarfile

SERVICES = ['backend', 'frontend', 'celery_worker', 'celery_beat', 'caddy']
RUNTIME = ['.env', '.env.docker', 'data', 'generated']
STOCK_ROUTE = '\nthestocktimes.online, www.thestocktimes.online {\n    reverse_proxy stocktimes-web:80\n}\n'


def shared_caddy(text):
    if 'thestocktimes.online' not in text:
        return text.rstrip() + '\n' + STOCK_ROUTE
    if 'www.thestocktimes.online' not in text or 'reverse_proxy stocktimes-web:80' not in text:
        raise RuntimeError('Existing Stock Times Caddy route needs review; no automatic overwrite')
    return text


def check_shared_network():
    network = json.loads(run(['docker', 'network', 'inspect', 'web']))[0]
    if not any(item.get('Name') == 'stocktimes-web' for item in network.get('Containers', {}).values()):
        raise RuntimeError('stocktimes-web must be connected to the existing external web network before deployment')


def run(args, **kwargs):
    # Capture stderr: docker compose diagnostics can contain interpolated secrets.
    result = subprocess.run(args, capture_output=True, **kwargs)
    if result.returncode:
        raise RuntimeError('Command failed: ' + ' '.join(args[:3]) + ' (details withheld; inspect securely on VPS)')
    return result.stdout


def archive(root, destination):
    with tarfile.open(destination, 'w:gz') as bundle:
        for name in RUNTIME:
            if (root / name).exists():
                bundle.add(root / name, arcname=name)


def restore(root, source):
    with tarfile.open(source) as bundle:
        bundle.extractall(root, filter='data')


def verify_live(compose, config):
    run([*compose, 'exec', '-T', 'celery_worker', 'celery', '-A', 'app.workers.celery_app', 'inspect', 'ping', '--timeout', '15'])
    domains = config['services']['caddy']['environment']
    for key, path in [('FRONTEND_DOMAIN', '/login'), ('BACKEND_DOMAIN', '/health')]:
        run(['curl', '--fail', '--silent', '--show-error', '--retry', '5', '--retry-delay', '5', '--max-time', '20', 'https://' + domains[key] + path])
    for domain in ['thestocktimes.online', 'www.thestocktimes.online']:
        run(['curl', '--fail', '--silent', '--show-error', '--retry', '3', '--retry-delay', '5', '--max-time', '20', 'https://' + domain])


def first_install(root, target, compose):
    changed = run(['git', 'diff', '--name-only', 'HEAD']).decode().splitlines()
    if changed:
        raise RuntimeError('Initial installation requires a clean source checkout')
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    backup = root / 'backups' / ('initial-' + stamp + '-' + target[:12])
    backup.mkdir(parents=True, mode=0o700)
    archive(root, backup / 'runtime-before-checkout.tar.gz')
    try:
        run(['git', 'checkout', '--detach', target])
    finally:
        restore(root, backup / 'runtime-before-checkout.tar.gz')
    os.environ['MAEACO_RELEASE_TAG'] = target
    config = json.loads(run([*compose, 'config', '--format', 'json']))
    prior_backend = run([*compose, 'ps', '-aq', 'backend']).decode().strip()
    if prior_backend:
        entries = json.loads(run(['docker', 'inspect', prior_backend]))[0]['Config']['Env']
        previous_key = dict(item.split('=', 1) for item in entries if '=' in item).get('CREDENTIAL_ENCRYPTION_KEY')
        if not previous_key or previous_key != config['services']['backend']['environment'].get('CREDENTIAL_ENCRYPTION_KEY'):
            raise RuntimeError('Credential encryption key differs from previous backend; preserve it before retrying')
    pg = run([*compose, 'ps', '-q', 'postgres']).decode().strip()
    if pg:
        existing = json.loads(run(['docker', 'inspect', pg]))[0]['Config']['Env']
        existing = dict(item.split('=', 1) for item in existing if '=' in item)
        for key in ['POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD']:
            if str(config['services']['postgres']['environment'].get(key)) != existing.get(key):
                raise RuntimeError('Existing PostgreSQL configuration mismatch: ' + key)
    run([*compose, 'build', 'backend', 'frontend'])
    run([*compose, 'up', '-d', '--wait', '--wait-timeout', '120', 'postgres', 'redis'])
    # Rejects any existing unversioned/older schema rather than destroying data.
    run([*compose, 'run', '--rm', '--no-deps', 'backend', 'python', '-m', 'scripts.bootstrap_database'])
    run([*compose, 'run', '--rm', '--no-deps', 'backend', 'python', '-m', 'scripts.deployment_database'])
    try:
        run([*compose, 'up', '-d', '--force-recreate', '--no-build', '--no-deps', '--wait', '--wait-timeout', '180', *SERVICES])
        verify_live(compose, config)
    except Exception:
        run([*compose, 'stop', 'backend', 'frontend', 'celery_worker', 'celery_beat', 'caddy'])
        raise RuntimeError('First installation failed verification. Database and runtime files preserved; correct configuration and retry.')
    print('First installation verified: database, application, worker and HTTPS are ready.')


def main(root, target):
    import fcntl
    if sys.version_info < (3, 12):
        raise RuntimeError('VPS Python 3.12 or newer is required for safe runtime restore')
    if not re.fullmatch(r'[0-9a-f]{40}', target):
        raise RuntimeError('Expected an exact commit SHA')
    root = Path(root).resolve()
    os.chdir(root)
    os.umask(0o077)
    lock = open(root / '.deployment.lock', 'w')
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    env_args = ['--env-file', '.env']
    if (root / '.env.docker').exists():
        env_args += ['--env-file', '.env.docker']
    compose = ['docker', 'compose', *env_args]
    check_shared_network()
    old = json.loads(run([*compose, 'config', '--format', 'json']))
    application_containers = [run([*compose, 'ps', '-aq', service]).decode().strip() for service in SERVICES if service in old['services']]
    if not any(application_containers):
        first_install(root, target, compose)
        return
    running = [run([*compose, 'ps', '-q', service]).decode().strip() for service in SERVICES if service in old['services']]
    if not any(running):
        first_install(root, target, compose)
        return
    rollback = json.loads(json.dumps(old))
    rollback_services = []
    for service in SERVICES:
        if service not in old['services']:
            continue
        cid = run([*compose, 'ps', '-q', service]).decode().strip()
        if not cid:
            if service in {'celery_worker', 'celery_beat'}:
                rollback['services'].pop(service, None)
                continue
            raise RuntimeError('Existing service not running: ' + service)
        rollback_services.append(service)
        container = json.loads(run(['docker', 'inspect', cid]))[0]
        rollback['services'][service]['image'] = container['Image']
        rollback['services'][service].pop('build', None)
        rollback['services'][service]['pull_policy'] = 'never'
    # Preserve the manually attached shared network even in the old-image rollback.
    rollback.setdefault('networks', {})['web'] = {'external': True, 'name': 'web'}
    caddy_networks = rollback['services']['caddy'].setdefault('networks', {'default': {}})
    if isinstance(caddy_networks, list):
        caddy_networks.append('web')
    else:
        caddy_networks['web'] = {}
    pg = run([*compose, 'ps', '-q', 'postgres']).decode().strip()
    actual = json.loads(run(['docker', 'inspect', pg]))[0]
    existing_env = dict(item.split('=', 1) for item in actual['Config']['Env'] if '=' in item)
    for key in ['POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD']:
        if str(old['services']['postgres']['environment'].get(key)) != existing_env.get(key):
            raise RuntimeError('Existing PostgreSQL configuration mismatch: ' + key)
    changed = run(['git', 'diff', '--name-only', 'HEAD']).decode().splitlines()
    runtime_changes = [p for p in changed if p.startswith(('data/', 'generated/')) or p == 'Caddyfile']
    if set(changed) - set(runtime_changes):
        raise RuntimeError('Server has source changes; reconcile them before deployment')
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    backup = root / 'backups' / (stamp + '-' + target[:12])
    backup.mkdir(parents=True, mode=0o700)
    (backup / 'rollback.json').write_text(json.dumps(rollback))
    (backup / 'Caddyfile').write_bytes((root / 'Caddyfile').read_bytes())
    merged_caddy = shared_caddy((root / 'Caddyfile').read_text())
    (backup / 'previous-commit.txt').write_bytes(run(['git', 'rev-parse', 'HEAD']))
    archive(root, backup / 'runtime-before-checkout.tar.gz')
    if runtime_changes:
        run(['git', 'restore', '--source=HEAD', '--staged', '--worktree', '--', *runtime_changes])
    try:
        run(['git', 'checkout', '--detach', target])
    finally:
        restore(root, backup / 'runtime-before-checkout.tar.gz')
    (root / 'Caddyfile').write_text(merged_caddy)
    os.environ['MAEACO_RELEASE_TAG'] = target
    new = json.loads(run([*compose, 'config', '--format', 'json']))
    # Preserve database configuration and every existing persistent mount.
    for service in old['services']:
        if old['services'][service].get('volumes', []) != new['services'][service].get('volumes', []):
            raise RuntimeError('Persistent mounts changed: ' + service)
    if old['services']['postgres']['environment'] != new['services']['postgres']['environment']:
        raise RuntimeError('PostgreSQL configuration changed')
    backend_id = run([*compose, 'ps', '-q', 'backend']).decode().strip()
    backend_env = json.loads(run(['docker', 'inspect', backend_id]))[0]['Config']['Env']
    previous_key = dict(item.split('=', 1) for item in backend_env if '=' in item).get('CREDENTIAL_ENCRYPTION_KEY')
    if not previous_key or previous_key != new['services']['backend']['environment'].get('CREDENTIAL_ENCRYPTION_KEY'):
        raise RuntimeError('Credential encryption key differs from the running backend')
    run([*compose, 'build', 'backend', 'frontend'])
    run([*compose, 'run', '--rm', '--no-deps', 'caddy', 'caddy', 'validate', '--config', '/etc/caddy/Caddyfile'])
    run([*compose, 'run', '--rm', '--no-deps', 'backend', 'python', '-m', 'scripts.deployment_database'])
    print('Build and database preflight passed. Entering maintenance.', flush=True)
    try:
        run([*compose, 'stop', '--timeout', '60', *[s for s in rollback_services if s in {'backend', 'celery_worker', 'celery_beat'}]])
        dump = run([*compose, 'exec', '-T', 'postgres', 'sh', '-c', 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc'])
        if not dump:
            raise RuntimeError('Empty database backup')
        (backup / 'database.dump').write_bytes(dump)
        run([*compose, 'exec', '-T', 'postgres', 'pg_restore', '--list'], input=dump)
        archive(root, backup / 'runtime-maintenance.tar.gz')
        run([*compose, 'run', '--rm', '--no-deps', 'backend', 'python', '-m', 'alembic', 'upgrade', 'head'])
        run([*compose, 'up', '-d', '--force-recreate', '--no-build', '--no-deps', '--wait', '--wait-timeout', '180', *SERVICES])
        verify_live(compose, new)
    except Exception:
        print('Deployment failed. Restoring previous images; database backup retained.', flush=True)
        (root / 'Caddyfile').write_bytes((backup / 'Caddyfile').read_bytes())
        added_services = [s for s in SERVICES if s not in rollback_services]
        if added_services:
            run([*compose, 'stop', *added_services])
        run(['docker', 'compose', '-f', str(backup / 'rollback.json'), 'up', '-d', '--force-recreate', '--no-build', '--no-deps', '--wait', '--wait-timeout', '180', *rollback_services])
        raise
    print('Deployment verified. Backup: ' + str(backup))


if __name__ == '__main__':
    try:
        main(*sys.argv[1:])
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
