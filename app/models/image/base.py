from abc import ABC, abstractmethod
from pathlib import Path


class BaseImageProvider(ABC):

    @abstractmethod
    def generate(
        self,
        prompt: str,
        output_path: Path
    ) -> Path:
        """
        Generate an image from a prompt.
        """

    @abstractmethod
    async def agenerate(
        self,
        prompt: str,
        output_path: Path
    ) -> Path:
        """
        Async image generation.
        """
