#!/usr/bin/env bash
# First installation and subsequent updates share the verified release runner.
set -euo pipefail
cd "$(dirname "$0")"
for command in python3 git docker curl; do
  command -v "$command" >/dev/null || { echo "Missing VPS dependency: $command"; exit 1; }
done
python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3,12) else "Python 3.12+ is required")'
docker compose version >/dev/null
if [ ! -f .env ]; then
  echo "Create the server .env from .env.production.example and fill real production values first."
  exit 1
fi
release_sha=$(git rev-parse HEAD)
exec python3 scripts/deploy_release.py "$PWD" "$release_sha"
