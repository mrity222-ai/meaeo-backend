from abc import ABC, abstractmethod
from typing import Any


class BaseNormalizer(ABC):

    @classmethod
    @abstractmethod
    def supports(
        cls,
        annotation: Any,
        value: Any,
    ) -> bool:
        pass

    @classmethod
    @abstractmethod
    def normalize(
        cls,
        value: Any,
        annotation: Any,
        context,
    ) -> Any:
        pass