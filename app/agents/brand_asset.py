from app.agents.task import BaseTaskAgent
from app.graph.state import AgentState
from app.models.config import settings
from app.repositories.brand_repository import BrandRepository


class BrandAssetAgent(BaseTaskAgent):

    def __init__(self):
        self.repository = BrandRepository()

    def invoke(
        self,
        state: AgentState,
    ) -> AgentState:

        campaign_context = state.get(
            "campaign_context"
        )

        if (
            campaign_context is not None
            and campaign_context.brand is not None
        ):
            state["brand_profile"] = (
                campaign_context.brand
            )

            return state

        # Legacy fallback.
        # Used when a campaign is executed
        # without onboarding context.
        state["brand_profile"] = (
            self.repository.load(
                settings.DEFAULT_BRAND
            )
        )

        return state

    async def ainvoke(
        self,
        state: AgentState,
    ) -> AgentState:

        return self.invoke(state)

    def get_state_key(self) -> str:
        return "brand_profile"