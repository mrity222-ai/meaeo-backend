import asyncio

from app.clients.dataforseo import DataForSEOClient
from app.research.keyword_cache import (
    KeywordResearchCache,
)
from app.research.parsers.dataforseo import (
    DataForSEOParser,
)
from app.research.policy import ResearchPolicy
from app.research.providers.base import (
    BaseResearchProvider,
)
from app.research.result import ResearchResult


class SEOProvider(BaseResearchProvider):

    def __init__(
        self,
        client: DataForSEOClient,
        parser: DataForSEOParser,
        cache: KeywordResearchCache | None = None,
    ):

        self.client = client
        self.parser = parser
        self.cache = (
            cache
            if cache is not None
            else KeywordResearchCache()
        )

    @property
    def provider_name(self) -> str:
        return "seo"

    def collect(
        self,
        state,
    ) -> ResearchResult:

        keywords = self._extract_keywords(
            state["campaign"]
        )

        cached = {}
        uncached = []

        for keyword in keywords:

            value = self.cache.load(
                keyword
            )

            if value is None:
                uncached.append(keyword)
            else:
                cached[keyword] = value

        limit = ResearchPolicy.dataforseo_limit()

        new_keywords = uncached[:limit]

        fresh = {}

        if new_keywords:

            search_volume = (
                self.client.search_volume(
                    new_keywords
                )
            )

            search_intent = (
                self.client.search_intent(
                    new_keywords
                )
            )

            trends = self.client.trends(
                new_keywords
            )

            fresh = (
                self.parser.parse_keyword_results(
                    search_volume,
                    search_intent,
                    trends,
                )
            )

            for keyword, data in fresh.items():

                self.cache.save(
                    keyword,
                    data,
                )

        return self._build_result(
            {
                **cached,
                **fresh,
            }
        )

    async def acollect(
        self,
        state,
    ) -> ResearchResult:

        keywords = self._extract_keywords(
            state["campaign"]
        )

        cached = {}
        uncached = []

        for keyword in keywords:

            value = self.cache.load(
                keyword
            )

            if value is None:
                uncached.append(keyword)
            else:
                cached[keyword] = value

        limit = ResearchPolicy.dataforseo_limit()

        new_keywords = uncached[:limit]

        fresh = {}

        if new_keywords:

            (
                search_volume,
                search_intent,
                trends,
            ) = await asyncio.gather(

                self.client.asearch_volume(
                    new_keywords
                ),

                self.client.asearch_intent(
                    new_keywords
                ),

                self.client.atrends(
                    new_keywords
                ),
            )

            fresh = (
                self.parser.parse_keyword_results(
                    search_volume,
                    search_intent,
                    trends,
                )
            )

            for keyword, data in fresh.items():

                self.cache.save(
                    keyword,
                    data,
                )

        return self._build_result(
            {
                **cached,
                **fresh,
            }
        )

    def _build_result(
        self,
        results: dict,
    ) -> ResearchResult:

        seo = self.parser.build_seo_research(
            results
        )

        trends = self.parser.build_trend_research(
            results
        )

        return ResearchResult(
            provider=self.provider_name,
            seo=seo,
            trends=trends,
        )

    def _extract_keywords(
        self,
        campaign,
    ) -> list[str]:

        keywords = [
            campaign.campaign_name,
            campaign.campaign_goal,
            campaign.target_audience,
        ]

        keywords.extend(
            campaign.target_platforms
        )

        return list(
            dict.fromkeys(
                keyword.strip()
                for keyword in keywords
                if keyword
                and keyword.strip()
            )
        )