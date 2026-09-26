import json
from pathlib import Path
from typing import Any

from app.storage.base import BaseStorage


class JsonStorage(BaseStorage):

    def save(self, path: Path, data: Any) -> None:

        path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        with open(
            path,
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                data,
                file,
                indent=4,
                ensure_ascii=False,
            )

    def load(self, path: Path):

        with open(
            path,
            "r",
            encoding="utf-8",
        ) as file:

            return json.load(file)

    def exists(self, path: Path):

        return path.exists()

    def delete(self, path: Path) -> None:

        if path.exists():
            path.unlink()

    def list(
        self,
        prefix: Path,
    ) -> list[Path]:

        if not prefix.exists():
            return []

        return [
            path
            for path in prefix.glob("*.json")
            if path.is_file()
        ]