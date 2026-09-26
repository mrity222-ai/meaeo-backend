from app.clients.firecrawl import FirecrawlClient
from app.research.cache import ResearchCache
from app.research.parsers.firecrawl import FirecrawlParser
from app.research.providers.base import BaseResearchProvider
from app.research.result import ResearchResult


class FirecrawlProvider(BaseResearchProvider):

    CACHE_MAX_AGE_DAYS = 7

    def __init__(
        self,
        client: FirecrawlClient,
        parser: FirecrawlParser,
        cache: ResearchCache,
    ):

        self.client = client
        self.parser = parser
        self.cache = cache

    @property
    def provider_name(self) -> str:
        return "firecrawl"

    def collect(
        self,
        state,
    ) -> ResearchResult:

        brand = state["brand_profile"]

        business = None

        if self.cache.is_fresh(
            brand.website,
            self.CACHE_MAX_AGE_DAYS,
        ):
            business = self.cache.load(
                brand.website
            )

        if business is None:

            response = self.client.scrape(
                brand.website
            )

            business = self.parser.parse(
                response
            )

            self.cache.save(
                brand.website,
                business,
            )

        return ResearchResult(
            provider=self.provider_name,
            business=business,
        )

    async def acollect(
        self,
        state,
    ) -> ResearchResult:

        brand = state["brand_profile"]

        business = None

        if self.cache.is_fresh(
            brand.website,
            self.CACHE_MAX_AGE_DAYS,
        ):
            business = self.cache.load(
                brand.website
            )

        if business is None:

            response = await self.client.ascrape(
                brand.website
            )

            business = self.parser.parse(
                response
            )

            self.cache.save(
                brand.website,
                business,
            )

        return ResearchResult(
            provider=self.provider_name,
            business=business,
        )