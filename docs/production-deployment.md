# Production update: GitHub → Docker Compose → Caddy

This workflow handles a first installation and subsequent updates at
`/opt/apps/meaeo-backend`. It does not provision the operating system/Docker,
create API credentials or automatically repair an unknown database baseline.

## Existing shared VPS: maeaco and Stock Times

The deployment path is `/opt/apps/meaeo-backend`. Caddy handles both applications.
The external Docker network `web` must already exist, and `stocktimes-web` must be
attached to it. Compose permanently attaches maeaco Caddy to both its own default
network and `web`; manual Caddy network attachment is no longer required after a
recreate. Stock Times containers are not rebuilt, stopped or recreated by this runner.

The existing server Caddyfile is backed up and preserved across checkout; the known
Stock Times block is added if absent. An incomplete/different Stock Times route blocks
deployment for review. Other source changes, including edited Compose files, still
block deployment. Confirm server configuration before pushing main.

The existing backend/frontend/Caddy must be running. Missing Celery worker/beat
containers can be introduced by this update. On failure, newly introduced workers
are stopped and only previously running application services restart. The previous
Caddy image/config also keeps the external network attachment during rollback.
Both Stock Times HTTPS domains are included in post-deploy checks. Caddy recreation
can briefly interrupt traffic to both applications.

Read-only VPS checks:

```bash
cd /opt/apps/meaeo-backend
git status --short
python3 --version
docker compose --env-file .env ps
docker compose --env-file .env exec -T backend python -m alembic current
docker network inspect web --format '{{json .Containers}}'
```

If `.env.docker` is used, include `--env-file .env.docker` after `--env-file .env`.
GitHub `VPS_USERNAME` must match the SSH user (currently root in the supplied setup).

## First installation

Use a Linux VPS with Docker Compose, Git, curl and Python 3.12+. Configure domain
DNS to the server IP and allow incoming TCP ports 80/443. Clone the pushed repository:

```bash
sudo mkdir -p /opt/apps/meaeo-backend
sudo chown "$USER":"$USER" /opt/apps/meaeo-backend
git clone https://github.com/mrity222-ai/meaeo-backend.git /opt/apps/meaeo-backend
cd /opt/apps/meaeo-backend
cp .env.production.example .env
chmod 600 .env
nano .env
```

Fill actual provider credentials and production URLs; set `SUPER_ADMIN_PASSWORD`
and `SUPER_ADMIN_PIN` explicitly. Include `FRONTEND_DOMAIN`, `BACKEND_DOMAIN`,
`POSTGRES_DB`, `POSTGRES_USER`, and a strong `POSTGRES_PASSWORD` in `.env`.
Use a URL-safe alphanumeric database password for the current Compose connection URL.
Set `CREDENTIAL_ENCRYPTION_KEY` to a random base64 encoded 32-byte key; preserve it
for every later deployment. Configure CORS and platform OAuth callbacks for your domains.
No real keys are generated or copied from your laptop automatically.

Then run:

```bash
bash deploy_docker.sh
```

The runner builds images, starts PostgreSQL/Redis, initializes a **completely empty**
database from the current SQLAlchemy schema (including model indexes/constraints),
and records the corresponding Alembic revision in the same PostgreSQL transaction.
It then validates the schema and starts app services/Caddy. This explicit fresh-schema
bootstrap is needed because the historical first Alembic migration is empty.
It does not replay the historical migrations over the current schema.

A retry accepts an already complete database at the current revision and preserves
data. Unknown/unversioned/older existing schemas block initialization. Once verified,
subsequent GitHub main pushes use the backup-and-migrate update path.
If first-install health/HTTPS checks fail, application services stop; database data
and runtime files remain available for diagnosis and retry. No volume deletion occurs.

## Before pushing main

1. Review the complete source diff and include the new application modules, tests,
   scripts and Alembic migration. Runtime files staged for deletion are being
   removed from Git tracking; keep local originals. Do not commit `.env` or uploads.
2. Configure GitHub Actions secrets: `VPS_HOST`, `VPS_USERNAME`, `VPS_SSH_KEY`;
   `VPS_PASSPHRASE` only when the SSH key needs it. The VPS must have repository
   fetch access. Main pushes deploy automatically after verification.
3. VPS requirements: Linux, Python **3.12+** (safe tar extraction), Git, curl and
   Docker Compose supporting `config --format json` and `up --wait`.
   For updates, existing PostgreSQL, Redis, API, frontend and Caddy must be running.
   Missing worker/beat services can be added. For first installation, follow the
   section above; the shared Stock Times network prerequisite still applies.
4. Keep `.env` and optional `.env.docker` on the VPS. Preserve the existing
   PostgreSQL password, credential encryption key and storage directories.
   Set production publishing/provider/storage and public HTTPS URLs as required
   by the application's production validator. Do not replace working secrets
   with sample values. Domains must resolve to the VPS; ports 80/443 must be open.
5. For updates, database revision must be `f16ff42ae755` or `27a1c72e9d10`, with the expected
   tables/columns. Unversioned or older databases fail before maintenance.
   Investigate and reconcile their actual schema separately; never blindly stamp.

## Automated update order

- CI checks tracked files, runs Python and Node tests and builds the frontend.
- VPS locks updates and captures current image IDs and protected configuration.
- Runtime data is archived before checkout and restored after checkout, preserving
  uploads that older commits tracked. A dirty source checkout blocks the update.
- Target images build before maintenance. Production config and database baseline
  are checked using the new backend image. Persistent mount/config changes block.
- API and publishing workers stop. PostgreSQL custom-format backup is taken and
  checked with `pg_restore --list`; runtime credentials/assets are backed up again.
- Migration runs before the new API/workers start. Container health, worker ping,
  frontend HTTPS and backend HTTPS are checked. Failures keep Actions red.

Backups are stored in `backups/<UTC timestamp>-<commit>/`, owner-only. Copy these
to secure off-server storage and manage retention separately. SQL dumps are
currently buffered in memory: allow memory for the database size.

## Rollback and limitations

After maintenance starts, failure attempts to restart previous images using the
protected resolved Compose snapshot and previous Caddyfile. The current migration
only adds compatible nullable columns. Database rollback/restoration is deliberately
manual; automatic restore could discard writes. Rollback itself can fail and must
be investigated on the VPS. Old images are not automatically pruned.

Git remains checked out at the attempted release after rollback; the backup records
the previous commit and running image IDs. Before a later retry reconcile Caddyfile
with the intended source. Runtime archives contain secrets: do not share or commit.

After successful deployment manually check login → profile save → refresh → logo
change, and tenant isolation. Live publishing/payment/provider verification requires
the real connected accounts. Local tests cannot certify VPS credentials or DNS.

## Local verification (2026-10-10)

- Existing Python suite: 268 passed; deployment preflight tests: 4 passed.
- First-install bootstrap/order/retry tests: 6 passed (SQLite schema tests and
  mocked orchestration); combined with preflight: 10 passed. Deployment shell
  syntax was checked with Bash. PostgreSQL/VPS integration remains a live check.
- Shared Caddy/network/domain checks: 4 additional tests passed; the current
  deployment/bootstrap test subset has 14 passing tests. Compose configuration
  and the actual VPS path were checked locally; server network state is unverified.
- Node contracts: 18 passed, including updated onboarding fixtures.
- Frontend production build: passed, 56 routes.
- Workflow YAML and Docker Compose configuration: passed.
- Tracked runtime/recognizable credential scan: passed after removing `.env.local`,
  catalogue/generated assets and build cache from Git tracking.
- No Git push, VPS update, real database restore rehearsal or live HTTPS check was
  performed here. These are not implied by local validation.
