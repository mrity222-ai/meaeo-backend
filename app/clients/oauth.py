from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class OAuthToken:

    access_token: str

    refresh_token: str | None = None

    expires_at: datetime | None = None

    token_type: str = "Bearer"

    scope: str | None = None

    def is_expired(
        self,
        *,
        buffer_seconds: int = 60,
    ) -> bool:

        if self.expires_at is None:
            return False

        now = datetime.now(timezone.utc)

        return (
            now.timestamp()
            + buffer_seconds
            >= self.expires_at.timestamp()
        )


class OAuthManager:

    def __init__(self):

        self._token: OAuthToken | None = None

    def set_token(
        self,
        token: OAuthToken,
    ) -> None:

        self._token = token

    def get_token(
        self,
    ) -> OAuthToken | None:

        return self._token

    def is_authenticated(self) -> bool:

        return (
            self._token is not None
            and not self._token.is_expired()
        )

    def clear(self) -> None:

        self._token = None