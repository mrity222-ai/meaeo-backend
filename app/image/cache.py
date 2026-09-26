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
        return (
            self.cache_dir /
            f"{key}.png"
        ).exists()

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
        shutil.copy2(
            image_path,
            cached,
        )
        return cached