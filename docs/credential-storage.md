# Credential storage deployment

The backend and Celery worker bind-mount the same dedicated host directory,
`./data/credentials`, at `/app/data/credentials`. This persistent storage survives
container recreation; it is not an anonymous container filesystem. Keep this
host directory when redeploying. Both services receive the same existing
`CREDENTIAL_ENCRYPTION_KEY` from the Compose environment and use
`CREDENTIAL_STORAGE_ROOT=data/credentials`. Missing or invalid keys fail
configuration. Do not regenerate a key while encrypted credentials exist.

The existing default path is preserved, so existing host files need no transfer
or rewrite. Credential JSON writes are atomic and use private file permissions
on Linux. The credential directory uses mode 0700 on Linux. Containers currently
use the same image user, allowing both services access. Windows deployments must
restrict the host folder ACL to the deployment user; Unix mode bits do not enforce
Windows ACLs.

Credentials and encrypted backups are excluded from Git and Docker build context.
Keep encrypted backups outside the image and retain the original key securely.

## Existing deployed containers

Before replacing an older deployment, check whether credentials were stored only
inside its backend container. Back up that directory into a protected host backup
folder, then copy absent files into the shared host directory. Compare conflicting
files and do not overwrite them automatically. Do not remove the original
container or rotate its key until the worker can decrypt the copied credentials.
The local checkout had no credential files when this fix was applied; no existing
credentials were moved or overwritten. A remote deployment was not inspected.

## Verification

`docker compose config --quiet` validates the mounts and required key reference
without printing secrets. With a working Docker Engine, use disposable test
containers with the shared mount and a generated test key to verify backend save,
worker read, and read after container recreation. Never replace the real key or
publish a post as part of this storage test.

Automated tests verify encrypted save/read between separate repository instances,
isolation by tenant/business/channel, recreation, wrong-key rejection, atomic
writes, configuration validation and Docker/Git exclusions. Actual container
recreation could not be verified locally because Docker Engine did not respond.
