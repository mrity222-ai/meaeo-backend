from abc import ABC, abstractmethod


class BaseProvider(ABC):

    @abstractmethod
    def invoke(self, messages):
        pass

    @abstractmethod
    async def ainvoke(self, messages):
        pass

    @abstractmethod
    def stream(self, messages):
        pass