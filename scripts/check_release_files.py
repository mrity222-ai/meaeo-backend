"""Reject tracked runtime files and recognizable credential literals without printing them."""
import fnmatch
import re
import subprocess
from pathlib import Path

FORBIDDEN = ["data/assets/*", "data/credentials/*", "data/credential-backups/*", "data/settings/*", "data/analytics/*", "generated/*", "backups/*", "*.db", "*.sqlite", "*.sqlite3", "*.tsbuildinfo", "*.before-business-profile-edit.bak", "*/.next/*", "*/.next-marketing-verify/*", "*/node_modules/*"]
PATTERNS = [r"AIza[0-9A-Za-z_-]{35}", r"gh[pousr]_[0-9A-Za-z]{36,}", r"sk-proj-[0-9A-Za-z_-]{32,}", r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"]


def scan(paths):
    errors = []
    for name in paths:
        path = Path(name)
        if any(fnmatch.fnmatch(name, pattern) for pattern in FORBIDDEN) or (path.name.startswith(".env") and not path.name.endswith((".example", ".sample"))):
            errors.append(f"Runtime/secret file tracked: {name}")
            continue
        if not path.is_file() or path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".ico", ".pdf"}:
            continue
        content = path.read_text(encoding="utf-8", errors="replace")
        if any(re.search(pattern, content) for pattern in PATTERNS):
            errors.append(f"Possible credential literal: {name} (value omitted)")
    return errors


if __name__ == "__main__":
    paths = subprocess.check_output(["git", "ls-files", "-z"]).decode().split("\0")
    errors = scan([path for path in paths if path])
    if errors:
        print("\n".join(errors))
        raise SystemExit(1)
    print("Release file checks passed.")
