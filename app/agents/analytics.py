from app.agents.task import BaseTaskAgent
from app.analytics.manager import AnalyticsManager
from app.graph.state import AgentState


class AnalyticsAgent(BaseTaskAgent):

    def invoke(
        self,
        state: AgentState,
    ) -> AgentState:

        self._require(
            state,
            "campaign",
        )

        self._require(
            state,
            "publishing",
        )

        tenant_id = state.get(
            "tenant_id"
        )

        campaign = state["campaign"]
        publishing = state["publishing"]

        campaign_name = (
            campaign.campaign_name
        )

        result = AnalyticsManager.collect(
            tenant_id=tenant_id,
            campaign_name=campaign_name,
            publishing=publishing,
        )

        if result.analytics is not None:
            state["analytics"] = (
                result.analytics
            )

        state["status"] = (
            "success"
            if result.success
            else "failed"
        )

        if not result.success:
            state.setdefault(
                "errors",
                [],
            ).append(
                result.error
                if getattr(
                    result,
                    "error",
                    None,
                )
                else "Analytics collection failed."
            )

        return state

    async def ainvoke(
        self,
        state: AgentState,
    ) -> AgentState:

        self._require(
            state,
            "campaign",
        )

        self._require(
            state,
            "publishing",
        )

        tenant_id = state.get(
            "tenant_id"
        )

        campaign = state["campaign"]
        publishing = state["publishing"]

        campaign_name = (
            campaign.campaign_name
        )

        result = await AnalyticsManager.acollect(
            tenant_id=tenant_id,
            campaign_name=campaign_name,
            publishing=publishing,
        )

        if result.analytics is not None:
            state["analytics"] = (
                result.analytics
            )

        state["status"] = (
            "success"
            if result.success
            else "failed"
        )

        if not result.success:
            state.setdefault(
                "errors",
                [],
            ).append(
                result.error
                if getattr(
                    result,
                    "error",
                    None,
                )
                else "Analytics collection failed."
            )

        return state

    def get_state_key(self) -> str:
        return "analytics"