from abc import ABC, abstractmethod


class BaseTool(ABC):
    """
    Abstract base class for all external tools.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """
        Unique tool identifier.
        """

    @abstractmethod
    def execute(self, **kwargs):
        """
        Execute the tool synchronously.
        """

    @abstractmethod
    async def aexecute(self, **kwargs):
        """
        Execute the tool asynchronously.
        """
