from typing import Any

from requests.auth import HTTPBasicAuth

from app.clients.base import BaseClient
from app.models.config import settings


class DataForSEOClient(BaseClient):

    BASE_URL = "https://api.dataforseo.com/v3"

    @property
    def auth(self):

        return HTTPBasicAuth(
            settings.DATAFORSEO_LOGIN,
            settings.DATAFORSEO_PASSWORD,
        )

    @property
    def headers(self):

        return {
            "Content-Type": "application/json",
        }

    def search_volume(
        self,
        keywords: list[str],
        location_code: int = 2840,
        language_code: str = "en",
    ) -> dict[str, Any]:

        payload = [
            {
                "keywords": keywords,
                "location_code": location_code,
                "language_code": language_code,
            }
        ]

        return self.post(
            "/keywords_data/google_ads/search_volume/live",
            json=payload,
        )

    async def asearch_volume(
        self,
        keywords: list[str],
        location_code: int = 2840,
        language_code: str = "en",
    ) -> dict[str, Any]:

        payload = [
            {
                "keywords": keywords,
                "location_code": location_code,
                "language_code": language_code,
            }
        ]

        return await self.apost(
            "/keywords_data/google_ads/search_volume/live",
            json=payload,
        )

    def search_intent(
        self,
        keywords: list[str],
    ) -> dict[str, Any]:

        payload = [
            {
                "keywords": keywords,
            }
        ]

        return self.post(
            "/dataforseo_labs/google/search_intent/live",
            json=payload,
        )

    async def asearch_intent(
        self,
        keywords: list[str],
    ) -> dict[str, Any]:

        payload = [
            {
                "keywords": keywords,
            }
        ]

        return await self.apost(
            "/dataforseo_labs/google/search_intent/live",
            json=payload,
        )

    def trends(
        self,
        keywords: list[str],
        location_code: int = 2840,
    ) -> dict[str, Any]:

        payload = [
            {
                "keywords": keywords,
                "location_code": location_code,
            }
        ]

        return self.post(
            "/keywords_data/google_trends/explore/live",
            json=payload,
        )

    async def atrends(
        self,
        keywords: list[str],
        location_code: int = 2840,
    ) -> dict[str, Any]:

        payload = [
            {
                "keywords": keywords,
                "location_code": location_code,
            }
        ]

        return await self.apost(
            "/keywords_data/google_trends/explore/live",
            json=payload,
        )