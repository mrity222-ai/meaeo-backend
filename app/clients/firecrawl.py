from typing import Any

from app.clients.base import BaseClient
from app.models.config import settings


class FirecrawlClient(BaseClient):

    BASE_URL = "https://api.firecrawl.dev/v2"

    @property
    def headers(self) -> dict[str, str]:

        return {
            "Authorization": (
                f"Bearer {settings.FIRECRAWL_API_KEY}"
            ),
            "Content-Type": "application/json",
        }

    def scrape(
        self,
        url: str,
    ) -> dict[str, Any]:

        payload = {
            "url": url,
            "formats": [
                "markdown"
            ],
            "onlyMainContent": True,
        }
        return self.post(
            "/scrape",
            json=payload,
        )

    async def ascrape(
        self,
        url: str,
    ) -> dict[str, Any]:

        payload = {
            "url": url,
            "formats": [
                "markdown"
            ],
            "onlyMainContent": True,
        }
        return await self.apost(
            "/scrape",
            json=payload,
        )