from datetime import date
from app.research.policy import ResearchPolicy

from app.clients.tavily import TavilyClient
from app.research.providers.base import BaseResearchProvider
from app.research.requests import IndustrySearchRequest
from app.research.result import ResearchResult
from app.research.schemas import IndustryResearch, SearchDocument


class TavilyProvider(BaseResearchProvider):

    def __init__(
        self,
        client: TavilyClient,
    ):
        self.client = client

    @property
    def provider_name(self) -> str:
        return "tavily"

    def collect(
        self,
        state,
    ) -> ResearchResult:
        if not ResearchPolicy.should_run_tavily():
            return ResearchResult(
                provider=self.provider_name,
            )

        campaign = state["campaign"]
        request = IndustrySearchRequest(
            query=f"""
        Research the following business.

        Business:
        {campaign.campaign_name}

        Goal:
        {campaign.campaign_goal}

        Audience:
        {campaign.target_audience}
        """
        )

        response = self.client.search(
            request.query,
            max_results=request.max_results,
        )

        industry = IndustryResearch(

            summary=response.get("answer") or "",

            references=[
                SearchDocument(
                    title=item.get("title", ""),
                    content=item.get("content", ""),
                    url=item.get("url", ""),
                    source=item.get("source", ""),
                )
                for item in response.get("results", [])
            ]
        )
        return ResearchResult(
            provider=self.provider_name,
            industry=industry,
        )

    async def acollect(
        self,
        state,
    ) -> ResearchResult:

        if not ResearchPolicy.should_run_tavily():
            return ResearchResult(
                provider=self.provider_name,
            )

        campaign = state["campaign"]

        request = IndustrySearchRequest(
            query=f"""
    Research the following business.
    Business:
    {campaign.campaign_name}
    Goal:
    {campaign.campaign_goal}
    Audience:
    {campaign.target_audience}
    """
        )
        response = await self.client.asearch(
            request.query,
            max_results=request.max_results,
        )
        industry = IndustryResearch(
            summary=response.get(
                "answer",
                "",
            ),
            references=[
                SearchDocument(
                    title=item.get(
                        "title",
                        "",
                    ),
                    content=item.get(
                        "content",
                        "",
                    ),
                    url=item.get(
                        "url",
                        "",
                    ),
                    source=item.get(
                        "source",
                        "",
                    ),
                )
                for item in response.get(
                    "results",
                    [],
                )
            ],
        )

        return ResearchResult(
            provider=self.provider_name,
            industry=industry,
        )