from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.database.models import StorageDocument
from app.database.session import engine as shared_engine
from app.models.config import settings
from app.storage.base import BaseStorage


class DatabaseStorage(BaseStorage):

    def __init__(
        self,
        database_url: str | None = None,
    ):
        if database_url is None:
            self.database_url = settings.DATABASE_URL
            self.engine = shared_engine
            self._owns_engine = False
            return

        self.database_url = database_url

        engine_kwargs = {}

        if database_url.startswith("sqlite"):
            engine_kwargs["connect_args"] = {
                "check_same_thread": False,
            }
        else:
            engine_kwargs.update(
                {
                    "pool_size": settings.DATABASE_POOL_SIZE,
                    "max_overflow": settings.DATABASE_MAX_OVERFLOW,
                    "pool_timeout": settings.DATABASE_TIMEOUT,
                }
            )

        self.engine = create_engine(
            database_url,
            **engine_kwargs,
        )

        self._owns_engine = True

        # Explicit custom database URLs are used by isolated
        # tests. Production uses the shared Alembic-managed engine.
        if database_url.startswith("sqlite"):
            StorageDocument.metadata.create_all(
                self.engine,
            )

    @staticmethod
    def _key(
        path: Path,
    ) -> str:
        return path.as_posix()

    def save(
        self,
        path: Path,
        data: Any,
    ) -> None:

        key = self._key(path)

        with Session(self.engine) as session:

            document = session.get(
                StorageDocument,
                key,
            )

            if document is None:
                document = StorageDocument(
                    storage_key=key,
                    data=data,
                )
                session.add(document)
            else:
                document.data = data

            session.commit()

    def load(
        self,
        path: Path,
    ) -> Any:

        key = self._key(path)

        with Session(self.engine) as session:

            document = session.get(
                StorageDocument,
                key,
            )

            if document is None:
                raise FileNotFoundError(
                    str(path)
                )

            return document.data

    def exists(
        self,
        path: Path,
    ) -> bool:

        key = self._key(path)

        with Session(self.engine) as session:

            return (
                session.get(
                    StorageDocument,
                    key,
                )
                is not None
            )

    def delete(
        self,
        path: Path,
    ) -> None:

        key = self._key(path)

        with Session(self.engine) as session:

            document = session.get(
                StorageDocument,
                key,
            )

            if document is not None:
                session.delete(document)
                session.commit()

    def list(
        self,
        prefix: Path,
    ) -> list[Path]:

        normalized_prefix = (
            self._key(prefix).rstrip("/")
            + "/"
        )

        with Session(self.engine) as session:

            documents = session.scalars(
                select(StorageDocument)
                .where(
                    StorageDocument.storage_key.startswith(
                        normalized_prefix
                    )
                )
            ).all()

            results = []

            for document in documents:

                key = document.storage_key

                relative = key[
                    len(normalized_prefix):
                ]

                if "/" not in relative:
                    results.append(Path(key))

            return results

    def close(self) -> None:
        if self._owns_engine:
            self.engine.dispose()

    def __enter__(self):
        return self

    def __exit__(
        self,
        exc_type,
        exc_value,
        traceback,
    ):
        self.close()
        return False