from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any


class BaseStorage(ABC):

    @abstractmethod
    def save(
        self,
        path: Path,
        data: Any,
    ) -> None:
        pass

    @abstractmethod
    def load(
        self,
        path: Path,
    ) -> Any:
        pass

    @abstractmethod
    def exists(
        self,
        path: Path,
    ) -> bool:
        pass

    @abstractmethod
    def delete(
        self,
        path: Path,
    ) -> None:
        pass

    @abstractmethod
    def list(
        self,
        prefix: Path,
    ) -> list[Path]:
        pass