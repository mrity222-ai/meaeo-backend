from langgraph.graph import END, START

from app.graph.base import BaseGraph
from app.models.config import settings
from app.registry import AgentRegistry


class MarketingGraph(BaseGraph):

    def __init__(self):
        super().__init__()

        self.registry = AgentRegistry()

    def _research_route(
        self,
        state,
    ) -> str:

        if state.get("status") == "failed":
            return "end"

        return "strategy"

    def _agent_route(
        self,
        state,
        success_node: str,
    ) -> str:

        if state.get("status") == "failed":
            return "end"

        return success_node

    def _planner_route(
        self,
        state,
    ) -> str:

        return self._agent_route(
            state,
            "brand_asset",
        )

    def _strategy_route(
        self,
        state,
    ) -> str:

        return self._agent_route(
            state,
            "content_writer",
        )

    def _content_route(
        self,
        state,
    ) -> str:

        return self._agent_route(
            state,
            "image_generator",
        )

    def _image_route(
        self,
        state,
    ) -> str:

        if state.get("status") == "failed":
            return "end"

        return "scheduler"

    def _scheduler_route(
        self,
        state,
    ) -> str:

        if state.get("status") == "failed":
            return "end"

        return "publisher"

    def _publisher_route(
        self,
        state,
    ) -> str:

        if state.get("status") == "failed":
            return "end"

        if not settings.ANALYTICS_ENABLED:
            return "end"

        return "analytics"

    def build(
        self,
        async_mode: bool = False,
    ):

        def node_method(agent_name: str):

            agent = self.registry.get(
                agent_name
            )

            if agent_name in {"planner", "image_generator"}:
                from app.services.campaign_asset_service import CampaignAssetService
                if async_mode:
                    async def invoke_with_assets(state):
                        if agent_name == "image_generator":
                            state = CampaignAssetService.apply_image_strategy(state)
                        result = await agent.ainvoke(state)
                        return CampaignAssetService.apply_image_strategy(result)
                    return invoke_with_assets
                def invoke_with_assets(state):
                    if agent_name == "image_generator":
                        state = CampaignAssetService.apply_image_strategy(state)
                    result = agent.invoke(state)
                    return CampaignAssetService.apply_image_strategy(result)
                return invoke_with_assets
            if async_mode:
                return agent.ainvoke
            return agent.invoke

        self.graph.add_node(
            "planner",
            node_method("planner"),
        )

        self.graph.add_node(
            "brand_asset",
            node_method("brand_asset"),
        )

        self.graph.add_node(
            "research",
            node_method("research"),
        )

        self.graph.add_node(
            "strategy",
            node_method("strategy"),
        )

        self.graph.add_node(
            "content_writer",
            node_method("content_writer"),
        )

        self.graph.add_node(
            "image_generator",
            node_method("image_generator"),
        )

        self.graph.add_node(
            "scheduler",
            node_method("scheduler"),
        )

        self.graph.add_node(
            "publisher",
            node_method("publisher"),
        )

        # Keep the Analytics node registered so V2 can
        # reactivate it through ANALYTICS_ENABLED=true.
        self.graph.add_node(
            "analytics",
            node_method("analytics"),
        )

        self.graph.add_edge(
            START,
            "planner",
        )

        self.graph.add_conditional_edges(
            "planner",
            self._planner_route,
            {
                "brand_asset": "brand_asset",
                "end": END,
            },
        )

        self.graph.add_edge(
            "brand_asset",
            "research",
        )

        self.graph.add_conditional_edges(
            "research",
            self._research_route,
            {
                "strategy": "strategy",
                "end": END,
            },
        )

        self.graph.add_conditional_edges(
            "strategy",
            self._strategy_route,
            {
                "content_writer": "content_writer",
                "end": END,
            },
        )

        self.graph.add_conditional_edges(
            "content_writer",
            self._content_route,
            {
                "image_generator": "image_generator",
                "end": END,
            },
        )

        self.graph.add_conditional_edges(
            "image_generator",
            self._image_route,
            {
                "scheduler": "scheduler",
                "end": END,
            },
        )

        # Scheduler must continue into Publisher.
        #
        # Previously this was:
        #
        #     scheduler -> END
        #
        # which caused the graph to terminate before the
        # publishing stage.
        self.graph.add_conditional_edges(
            "scheduler",
            self._scheduler_route,
            {
                "publisher": "publisher",
                "end": END,
            },
        )

        self.graph.add_conditional_edges(
            "publisher",
            self._publisher_route,
            {
                "analytics": "analytics",
                "end": END,
            },
        )

        self.graph.add_edge(
            "analytics",
            END,
        )

        return self.graph.compile()