from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Iterator

from app.models.config import settings


class AssetStorageError(RuntimeError):
    """Base exception for asset storage failures."""


class AssetStorage(ABC):
    """Provider-neutral storage interface for persistent assets."""

    @abstractmethod
    def save_file(
        self,
        *,
        source_path: Path,
        storage_key: str,
    ) -> None:
        """Persist a local source file under the storage key."""

    @abstractmethod
    def iter_bytes(
        self,
        *,
        storage_key: str,
        chunk_size: int = 1024 * 1024,
    ) -> Iterator[bytes]:
        """Yield an asset in chunks."""

    @abstractmethod
    def exists(
        self,
        *,
        storage_key: str,
    ) -> bool:
        """Return whether the asset exists."""

    @abstractmethod
    def delete(
        self,
        *,
        storage_key: str,
    ) -> None:
        """Delete an asset if it exists."""


class LocalAssetStorage(AssetStorage):
    """
    Production local-filesystem asset storage.

    Storage keys are relative paths and are always resolved beneath
    the configured asset root.
    """

    def __init__(
        self,
        root: str | None = None,
    ):
        configured_root = (
            root
            if root is not None
            else settings.ASSET_STORAGE_ROOT
        )

        self.root = Path(
            configured_root
        ).expanduser()

        self.root.mkdir(
            parents=True,
            exist_ok=True,
        )

        self._root_resolved = (
            self.root.resolve()
        )

    # -------------------------------------------------
    # Path safety
    # -------------------------------------------------

    def _path(
        self,
        storage_key: str,
    ) -> Path:

        if not storage_key:
            raise ValueError(
                "storage_key cannot be empty."
            )

        key = storage_key.replace(
            "\\",
            "/",
        )

        candidate = (
            self._root_resolved
            / Path(key)
        ).resolve()

        try:
            candidate.relative_to(
                self._root_resolved
            )
        except ValueError as exc:
            raise ValueError(
                "Invalid storage_key."
            ) from exc

        return candidate

    # -------------------------------------------------
    # Save
    # -------------------------------------------------

    def save_file(
        self,
        *,
        source_path: Path,
        storage_key: str,
    ) -> None:

        source_path = Path(
            source_path
        )

        if not source_path.exists():
            raise FileNotFoundError(
                f"Asset source does not exist: "
                f"{source_path}"
            )

        if not source_path.is_file():
            raise ValueError(
                "Asset source is not a file."
            )

        destination = self._path(
            storage_key
        )

        destination.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        temporary = destination.with_name(
            f".{destination.name}.tmp"
        )

        try:
            with (
                source_path.open("rb") as source,
                temporary.open("wb") as target,
            ):
                while True:
                    chunk = source.read(
                        1024 * 1024
                    )

                    if not chunk:
                        break

                    target.write(chunk)

                target.flush()

            temporary.replace(
                destination
            )

        except Exception as exc:
            temporary.unlink(
                missing_ok=True
            )

            raise AssetStorageError(
                "Failed to save asset."
            ) from exc

    # -------------------------------------------------
    # Read
    # -------------------------------------------------

    def iter_bytes(
        self,
        *,
        storage_key: str,
        chunk_size: int = 1024 * 1024,
    ) -> Iterator[bytes]:

        if chunk_size <= 0:
            raise ValueError(
                "chunk_size must be greater than zero."
            )

        path = self._path(
            storage_key
        )

        if not path.exists():
            raise FileNotFoundError(
                f"Asset not found: {storage_key}"
            )

        if not path.is_file():
            raise AssetStorageError(
                "Asset storage path is not a file."
            )

        with path.open("rb") as file:
            while True:
                chunk = file.read(
                    chunk_size
                )

                if not chunk:
                    break

                yield chunk

    # -------------------------------------------------
    # Exists
    # -------------------------------------------------

    def exists(
        self,
        *,
        storage_key: str,
    ) -> bool:

        return self._path(
            storage_key
        ).is_file()

    # -------------------------------------------------
    # Delete
    # -------------------------------------------------

    def delete(
        self,
        *,
        storage_key: str,
    ) -> None:

        path = self._path(
            storage_key
        )

        if path.exists():
            if not path.is_file():
                raise AssetStorageError(
                    "Cannot delete non-file asset path."
                )

            path.unlink()


class AssetStorageFactory:

    @staticmethod
    def create() -> AssetStorage:

        backend = (
            settings.ASSET_STORAGE_BACKEND
            .strip()
            .lower()
        )

        if backend == "local":
            return LocalAssetStorage()

        raise ValueError(
            f"Unsupported asset storage backend: "
            f"{backend}"
        )