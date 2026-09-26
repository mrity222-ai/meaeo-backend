from app.research.providers.base import BaseResearchProvider
from app.research.result import ResearchResult
from app.research.schemas import (
    IndustryResearch,
    SearchDocument,
)


class MockResearchProvider(
    BaseResearchProvider
):

    @property
    def provider_name(self) -> str:
        return "mock"

    def collect(
        self,
        state,
    ) -> ResearchResult:

        campaign = state["campaign"]

        industry = IndustryResearch(
            summary=(
                "Mock research result for "
                f"{campaign.campaign_name}."
            ),
            references=[
                SearchDocument(
                    title="Mock Research Source",
                    content=(
                        "Deterministic research data "
                        "used for integration testing."
                    ),
                    url="https://example.com/mock-research",
                    source="mock",
                )
            ],
        )

        return ResearchResult(
            provider=self.provider_name,
            industry=industry,
        )

    async def acollect(
        self,
        state,
    ) -> ResearchResult:

        return self.collect(state)