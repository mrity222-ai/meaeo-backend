import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class KeywordResearchCache:

    def __init__(
        self,
        namespace: str = "seo",
    ):
        self.cache_dir = (
            Path("data/cache")
            / namespace
        )

        self.cache_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

    @staticmethod
    def _cache_key(
        keyword: str,
    ) -> str:

        return hashlib.sha256(
            keyword.strip()
            .lower()
            .encode("utf-8")
        ).hexdigest()

    def _path(
        self,
        keyword: str,
    ) -> Path:

        return (
            self.cache_dir
            / f"{self._cache_key(keyword)}.json"
        )

    def load(
        self,
        keyword: str,
    ) -> dict[str, Any] | None:

        path = self._path(keyword)

        if not path.exists():
            return None

        with open(
            path,
            "r",
            encoding="utf-8",
        ) as file:

            return json.load(file)

    def save(
        self,
        keyword: str,
        data: dict[str, Any],
    ) -> None:

        payload = {
            "keyword": keyword,
            "cached_at": datetime.now(
                timezone.utc
            ).isoformat(),
            "data": data,
        }

        with open(
            self._path(keyword),
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                payload,
                file,
                indent=4,
                ensure_ascii=False,
            )

    def exists(
        self,
        keyword: str,
    ) -> bool:

        return self._path(keyword).exists()

    def cached_at(
        self,
        keyword: str,
    ) -> datetime | None:

        payload = self.load(keyword)

        if not payload:
            return None

        value = payload.get(
            "cached_at"
        )

        if not value:
            return None

        return datetime.fromisoformat(value)