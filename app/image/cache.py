import hashlib
import shutil
from pathlib import Path


class ImageCache:

    def __init__(self):

        self.cache_dir = Path(
            "data/cache/images"
        )
        self.cache_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

    def _cache_key(
        self,
        prompt: str,
    ) -> str:
        return hashlib.sha256(
            prompt.strip()
            .encode("utf-8")
        ).hexdigest()

    def exists(
        self,
        prompt: str,
    ) -> bool:
        key = self._cache_key(prompt)
        target = self.cache_dir / f"{key}.png"
        if not target.exists():
            return False
        # Do not treat small mock/dummy images (<20KB) as valid cache hits
        try:
            if target.stat().st_size <= 20000:
                target.unlink(missing_ok=True)
                return False
        except Exception:
            return False
        return True

    def load(
        self,
        prompt: str,
    ) -> Path:
        key = self._cache_key(prompt)
        return (
            self.cache_dir /
            f"{key}.png"
        )

    def save(
        self,
        prompt: str,
        image_path: Path,
    ) -> Path:
        key = self._cache_key(prompt)
        cached = (
            self.cache_dir /
            f"{key}.png"
        )
        try:
            # Only cache real images larger than 20KB
            if image_path.exists() and image_path.stat().st_size > 20000:
                shutil.copy2(
                    image_path,
                    cached,
                )
                return cached
        except Exception:
            pass
        return image_path