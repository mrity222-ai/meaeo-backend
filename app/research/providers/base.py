from abc import ABC, abstractmethod

from app.research.result import ResearchResult


class BaseResearchProvider(ABC):

    @property
    @abstractmethod
    def provider_name(self) -> str:
        ...

    @abstractmethod
    def collect(
        self,
        state,
    ) -> ResearchResult:
        ...

    @abstractmethod
    async def acollect(
        self,
        state,
    ) -> ResearchResult:
        ...