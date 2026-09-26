from app.agents.analytics import AnalyticsAgent
from app.agents.brand_asset import BrandAssetAgent
from app.agents.content_writer import ContentWriterAgent
from app.agents.image import ImageGeneratorAgent
from app.agents.planner import PlannerAgent
from app.agents.publisher import PublisherAgent
from app.agents.research import ResearchAgent
from app.agents.scheduler import SchedulerAgent
from app.agents.strategy import StrategyAgent


class AgentRegistry:
    """
    Central registry responsible for creating
    and exposing all agent instances.
    """

    def __init__(self):

        self._agents = {
            "planner": PlannerAgent(),
            "brand_asset": BrandAssetAgent(),
            "research": ResearchAgent(),
            "strategy": StrategyAgent(),
            "content_writer": ContentWriterAgent(),
            "image_generator": ImageGeneratorAgent(),
            "scheduler": SchedulerAgent(),
            "publisher": PublisherAgent(),
            "analytics": AnalyticsAgent(),
        }

    def get(self, name: str):

        try:
            return self._agents[name]

        except KeyError:

            raise ValueError(
                f"Unknown agent: {name}"
            )

    def all(self):

        return self._agents

    def exists(self, name: str) -> bool:
        return name in self._agents