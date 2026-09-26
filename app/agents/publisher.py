from app.agents.task import BaseTaskAgent
from app.graph.state import AgentState
from app.publishers.manager import PublishManager


class PublisherAgent(BaseTaskAgent):

    def __init__(self):
        self.manager = PublishManager()

    def invoke(
        self,
        state: AgentState,
    ) -> AgentState:

        self._require(
            state,
            "schedule",
        )
        schedule = state["schedule"]
        result = self.manager.publish(
            schedule
        )
        state["publishing"] = result
        return state

    async def ainvoke(
        self,
        state: AgentState,
    ) -> AgentState:

        self._require(
            state,
            "schedule",
        )
        schedule = state["schedule"]
        result = await self.manager.apublish(
            schedule
        )
        state["publishing"] = result
        return state

    def get_state_key(self) -> str:
        return "publishing"