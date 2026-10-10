import hashlib
import shutil
import json
from app.models.config import settings
from pathlib import Path
from app.image.catalogue import _campaign_cache_namespace


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
        namespace = _campaign_cache_namespace.get()
        provider = f"{settings.IMAGE_MODEL_PROVIDER}:{settings.IMAGE_MODEL_ALIAS}:{settings.IMAGE_MODEL}"
        scoped_prompt = provider + "\0" + (namespace + "\0" if namespace else "") + prompt.strip()
        return hashlib.sha256(scoped_prompt.encode("utf-8")).hexdigest()

    def exists(
        self,
        prompt: str,
    ) -> bool:
        key = self._cache_key(prompt)
        target = self.cache_dir / f"{key}.png"
        if not target.exists():
            return False
        try:
            metadata = json.loads((self.cache_dir / f"{key}.metadata.json").read_text())
            if metadata.get("provider") in {None, "mock", "cache"}:
                return False
            if target.stat().st_size <= 20000:
                return False
        except (OSError, ValueError, TypeError, AttributeError):
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
        provider: str | None = None,
    ) -> Path:
        key = self._cache_key(prompt)
        cached = (
            self.cache_dir /
            f"{key}.png"
        )
        try:
            # Only cache real images larger than 20KB
            if provider not in {None, "mock", "cache"} and image_path.exists() and image_path.stat().st_size > 20000:
                shutil.copy2(
                    image_path,
                    cached,
                )
                (self.cache_dir / f"{key}.metadata.json").write_text(json.dumps({"provider": provider}))
                return cached
        except Exception:
            pass
        return image_path