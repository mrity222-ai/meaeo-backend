class HttpClientError(Exception):
    """Base HTTP client exception."""


class HttpRequestError(HttpClientError):
    """Request failed after all retries."""


class HttpAuthenticationError(HttpClientError):
    """Authentication failed."""


class HttpRateLimitError(HttpClientError):
    """API rate limit exceeded."""


class HttpServerError(HttpClientError):
    """Server-side error."""