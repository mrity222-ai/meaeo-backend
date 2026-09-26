import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.research.schemas import BusinessResearch


class ResearchCache:

    def __init__(
        self,
        namespace: str,
    ):

        self.cache_dir = (
            Path("data/cache")
            / namespace
        )

        self.cache_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

    def _cache_key(
        self,
        website: str,
    ) -> str:

        return hashlib.sha256(
            website.strip()
            .lower()
            .encode("utf-8")
        ).hexdigest()

    def _path(
        self,
        website: str,
    ) -> Path:

        return (
            self.cache_dir
            / f"{self._cache_key(website)}.json"
        )

    def load(
        self,
        website: str,
    ) -> BusinessResearch | None:

        path = self._path(website)

        if not path.exists():
            return None

        with open(
            path,
            "r",
            encoding="utf-8",
        ) as file:

            payload = json.load(file)

        # New cache format
        if "data" in payload:

            return BusinessResearch.model_validate(
                payload["data"]
            )

        # Backward compatibility with
        # existing cache files.
        return BusinessResearch.model_validate(
            payload
        )

    def save(
        self,
        website: str,
        data: BusinessResearch,
    ) -> None:

        payload = {
            "cached_at": datetime.now(
                timezone.utc
            ).isoformat(),
            "data": data.model_dump(),
        }

        with open(
            self._path(website),
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                payload,
                file,
                indent=4,
                ensure_ascii=False,
            )

    def is_fresh(
        self,
        website: str,
        max_age_days: int = 7,
    ) -> bool:

        path = self._path(website)

        if not path.exists():
            return False

        with open(
            path,
            "r",
            encoding="utf-8",
        ) as file:

            payload = json.load(file)

        cached_at = payload.get(
            "cached_at"
        )

        # Old cache entries have no timestamp.
        # Treat them as stale so they get upgraded.
        if not cached_at:
            return False

        timestamp = datetime.fromisoformat(
            cached_at
        )

        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(
                tzinfo=timezone.utc
            )

        return (
            datetime.now(timezone.utc)
            - timestamp
        ) < timedelta(
            days=max_age_days
        )