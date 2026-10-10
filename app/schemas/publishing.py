from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.image import ImageSourceMode


def publication_failure_flags(exc: Exception) -> dict[str, bool]:
    import httpx
    import requests
    from app.exceptions.http import HttpRateLimitError, HttpRequestError, HttpServerError, HttpAuthenticationError
    from app.clients.meta_errors import MetaAPIError
    if isinstance(exc, (httpx.ConnectError, httpx.ConnectTimeout, httpx.PoolTimeout, HttpRateLimitError)):
        return {"retryable": True, "outcome_unknown": False}
    if isinstance(exc, httpx.HTTPStatusError):
        code = exc.response.status_code
        return {"retryable": code == 429, "outcome_unknown": code >= 500}
    if isinstance(exc, (HttpAuthenticationError, requests.HTTPError)):
        response = getattr(exc, "response", None)
        code = response.status_code if response is not None else 401
        return {"retryable": code == 429, "outcome_unknown": code >= 500}
    if isinstance(exc, HttpRequestError) and isinstance(exc.__context__, (httpx.ConnectError, httpx.ConnectTimeout)):
        return {"retryable": True, "outcome_unknown": False}
    if isinstance(exc, MetaAPIError):
        return {"retryable": exc.error_code in {4, 17, 32, 613, 80004}, "outcome_unknown": False}
    if isinstance(exc, (httpx.TransportError, requests.Timeout, requests.ConnectionError, HttpRequestError, HttpServerError)):
        return {"retryable": False, "outcome_unknown": True}
    if isinstance(exc, ValueError):
        text = str(exc).lower()
        return {"retryable": False, "outcome_unknown": "did not return" in text or "not return" in text}
    return {"retryable": False, "outcome_unknown": True}


class PublishedPost(BaseModel):

    platform: str
    account: str = "default"
    day: int
    title: str
    status: str
    external_id: str
    url: str | None = None
    scheduled_for: datetime | None = None
    published_at: datetime | None = None
    image_path: str

    impressions: int = 0
    reach: int = 0
    likes: int = 0
    comments: int = 0
    shares: int = 0
    saves: int = 0
    clicks: int = 0
    conversions: int = 0

    image_source: ImageSourceMode = (
        ImageSourceMode.AI
    )

    retryable: bool = False
    outcome_unknown: bool = False

    errors: list[str] = Field(
        default_factory=list
    )


class PublishingResult(BaseModel):

    posts: list[PublishedPost] = Field(
        default_factory=list
    )
    successful: int = 0
    failed: int = 0
    provider: str = ""