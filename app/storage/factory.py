from app.models.config import settings
from app.storage.base import BaseStorage
from app.storage.database_storage import DatabaseStorage
from app.storage.json_storage import JsonStorage


class StorageFactory:

    @staticmethod
    def create() -> BaseStorage:

        backend = (
            settings.STORAGE_BACKEND
            .strip()
            .lower()
        )

        if backend == "json":
            return JsonStorage()

        if backend == "database":
            return DatabaseStorage()

        raise ValueError(
            f"Unknown storage backend: {backend}"
        )