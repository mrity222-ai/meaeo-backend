from typing import Any

from app.clients.base import BaseClient
from app.clients.meta_errors import MetaAPIError
from app.models.config import settings


class MetaClient(BaseClient):

    BASE_URL = (
        "https://graph.facebook.com/"
        f"{settings.META_API_VERSION}"
    )

    def __init__(
        self,
        access_token: str,
    ):

        self.access_token = access_token

    @property
    def headers(self) -> dict[str, str]:

        return {
            "Authorization": (
                f"Bearer {self.access_token}"
            ),
            "Accept": "application/json",
        }

    def _handle_response(
        self,
        response: dict[str, Any],
    ) -> dict[str, Any]:

        if "error" not in response:
            return response

        error = response["error"]

        raise MetaAPIError(
            message=error.get(
                "message",
                "Meta API request failed.",
            ),
            error_code=error.get(
                "code"
            ),
            error_subcode=error.get(
                "error_subcode"
            ),
            trace_id=error.get(
                "fbtrace_id"
            ),
        )

    def get(
        self,
        endpoint: str,
        **kwargs,
    ) -> dict[str, Any]:

        response = super().get(
            f"/{endpoint.lstrip('/')}",
            **kwargs,
        )

        return self._handle_response(
            response
        )

    async def aget(
        self,
        endpoint: str,
        **kwargs,
    ) -> dict[str, Any]:

        response = await super().aget(
            f"/{endpoint.lstrip('/')}",
            **kwargs,
        )

        return self._handle_response(
            response
        )

    def post(
        self,
        endpoint: str,
        **kwargs,
    ) -> dict[str, Any]:

        response = super().post(
            f"/{endpoint.lstrip('/')}",
            **kwargs,
        )

        return self._handle_response(
            response
        )

    async def apost(
        self,
        endpoint: str,
        **kwargs,
    ) -> dict[str, Any]:

        response = await super().apost(
            f"/{endpoint.lstrip('/')}",
            **kwargs,
        )

        return self._handle_response(
            response
        )