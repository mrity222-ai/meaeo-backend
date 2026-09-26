from abc import ABC, abstractmethod

from app.graph.state import AgentState


class BaseTaskAgent(ABC):

    @abstractmethod
    def invoke(self, state: dict) -> dict:
        """
        Execute the task synchronously.
        """

    @abstractmethod
    async def ainvoke(self, state: dict) -> dict:
        """
        Execute the task asynchronously.
        """

    @abstractmethod
    def get_state_key(self) -> str:
        """
        Return the state key updated by this task.
        """

    def _require(
        self,
        state: AgentState,
        *keys: str,
    ) -> None:

        missing = [
            key
            for key in keys
            if state.get(key) is None
        ]

        if missing:
            raise ValueError(
                "Missing required state keys: "
                + ", ".join(missing)
            )