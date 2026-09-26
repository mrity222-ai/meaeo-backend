from abc import ABC, abstractmethod
from pathlib import Path

from app.image.schemas import GeneratedImageResult


class BaseImageProvider(ABC):

    @property
    @abstractmethod
    def provider_name(self) -> str:
        ...

    @abstractmethod
    def generate(
        self,
        prompt: str,
        output_path: Path,
    ) -> GeneratedImageResult:
        ...

    @abstractmethod
    async def agenerate(
        self,
        prompt: str,
        output_path: Path,
    ) -> GeneratedImageResult:
        ...