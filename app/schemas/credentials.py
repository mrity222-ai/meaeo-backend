from datetime import datetime, timezone

from pydantic import BaseModel, Field


class OAuthCredential(BaseModel):

    tenant_id: str
    business_account_id: int | None = None
    business_channel_id: int | None = None
    platform: str
    access_token: str
    refresh_token: str | None = None
    page_access_token: str | None = None
    expires_at: datetime | None = None
    token_type: str = "Bearer"
    scope: str | None = None
    platform_account_id: str | None = None
    

    metadata: dict = Field(
        default_factory=dict
    )

    def is_expired(
        self,
        *,
        buffer_seconds: int = 60,
    ) -> bool:

        if self.expires_at is None:
            return False

        now = datetime.now(
            timezone.utc
        )

        expires_at = self.expires_at

        # Normalize naive datetimes for safety.
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(
                tzinfo=timezone.utc
            )

        return (
            now.timestamp()
            + buffer_seconds
            >= expires_at.timestamp()
        )