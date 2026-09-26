import asyncio
from datetime import datetime, timezone
import httpx

from app.models.config import settings
from app.repositories.local_credential_repository import (
    LocalCredentialRepository,
)
from app.schemas.publishing import (
    PublishedPost,
    PublishingResult,
)
from app.schemas.schedule import PublishingSchedule
from app.security.credential_service import CredentialService
from app.security.fernet import FernetEncryptionService
from app.security.tenant import TenantContext


class GoogleBusinessPublisherProvider:

    @property
    def provider_name(self) -> str:
        return "google_business"

    def __init__(
        self,
        credential_service: CredentialService | None = None,
        http_client: httpx.AsyncClient | None = None,
    ):
        if credential_service is None:
            encryption = FernetEncryptionService(
                settings.CREDENTIAL_ENCRYPTION_KEY.get_secret_value()
            )
            repository = LocalCredentialRepository(
                encryption=encryption,
            )
            credential_service = CredentialService(
                repository=repository,
            )

        self.credential_service = credential_service
        self.http_client = http_client

    async def apublish(
        self,
        schedule: PublishingSchedule,
    ) -> PublishingResult:
        tenant_id = schedule.tenant_id
        if not tenant_id:
            raise ValueError(
                "tenant_id is required for Google Business publishing."
            )

        self._validate_channel_context(schedule)

        context = TenantContext(tenant_id=tenant_id)
        results = []

        for post in schedule.posts:
            credential = (
                await self.credential_service
                .get_valid_credential_for_channel(
                    context=context,
                    business_account_id=schedule.business_account_id,
                    business_channel_id=post.business_channel_id,
                )
            )

            location_name = self._get_location_name(credential)
            access_token = self._get_access_token(credential)

            try:
                caption = self._build_caption(
                    post.caption,
                    post.hashtags,
                    post.call_to_action,
                )

                payload = self._build_local_post_payload(
                    text=caption,
                    image_url=post.image_url,
                    call_to_action=post.call_to_action,
                )

                # Google My Business Local Posts Endpoint
                # Format: https://mybusinesslocalpost.googleapis.com/v1/{location_name}/localPosts
                # location_name example: accounts/12345/locations/67890 or locations/67890
                url = f"https://mybusinesslocalpost.googleapis.com/v1/{location_name}/localPosts"

                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                }

                client = (
                    self.http_client
                    if self.http_client is not None
                    else httpx.AsyncClient(timeout=30.0)
                )

                should_close = self.http_client is None
                try:
                    response = await client.post(
                        url,
                        json=payload,
                        headers=headers,
                    )
                finally:
                    if should_close:
                        await client.aclose()

                if response.status_code not in (200, 201):
                    raise ValueError(
                        f"Google Business API returned status {response.status_code}: {response.text}"
                    )

                res_data = response.json()
                external_id = res_data.get("name") or res_data.get("searchUrl")

                if not external_id:
                    raise ValueError(
                        "Google Business API did not return a local post ID."
                    )

                results.append(
                    PublishedPost(
                        platform="google_business",
                        account=location_name,
                        day=post.day,
                        title=post.title,
                        status="published",
                        external_id=str(external_id),
                        scheduled_for=datetime.combine(
                            post.publish_date,
                            post.publish_time,
                        ),
                        published_at=datetime.now(timezone.utc),
                        image_path=post.image_path,
                        image_source=post.image_source,
                    )
                )

            except Exception as exc:
                results.append(
                    self._failed_post(
                        post,
                        location_name,
                        exc,
                    )
                )

        successful = sum(
            1 for post in results if post.status == "published"
        )

        return PublishingResult(
            posts=results,
            successful=successful,
            failed=len(results) - successful,
            provider=self.provider_name,
        )

    def publish(
        self,
        schedule: PublishingSchedule,
    ) -> PublishingResult:
        try:
            asyncio.get_running_loop()
        except RuntimeError:
            return asyncio.run(self.apublish(schedule))

        raise RuntimeError(
            "Synchronous Google Business publishing cannot run inside an event loop. Use apublish()."
        )

    @staticmethod
    def _validate_channel_context(
        schedule: PublishingSchedule,
    ) -> None:
        if schedule.business_account_id is None:
            raise ValueError(
                "business_account_id is required for Google Business publishing."
            )

        for post in schedule.posts:
            if post.business_channel_id is None:
                raise ValueError(
                    "business_channel_id is required for Google Business publishing."
                )

    @staticmethod
    def _get_location_name(credential) -> str:
        loc = (
            credential.metadata.get("gbp_location_name")
            or credential.metadata.get("location_name")
            or credential.metadata.get("account_id")
        )
        if not loc:
            raise ValueError(
                "Google Business credential is missing gbp_location_name."
            )
        return loc

    @staticmethod
    def _get_access_token(credential) -> str:
        token = (
            credential.metadata.get("gbp_access_token")
            or credential.metadata.get("google_access_token")
            or credential.metadata.get("access_token")
        )
        if not token:
            raise ValueError(
                "Google Business credential is missing gbp_access_token."
            )
        return token

    @staticmethod
    def _build_caption(
        caption: str,
        hashtags: list[str],
        call_to_action: str,
    ) -> str:
        parts = []
        if caption and caption.strip():
            parts.append(caption.strip())

        normalized_hashtags = [
            tag.strip() if tag.strip().startswith("#") else f"#{tag.strip()}"
            for tag in hashtags
            if tag and tag.strip()
        ]

        if normalized_hashtags:
            parts.append(" ".join(normalized_hashtags))

        if call_to_action and call_to_action.strip():
            parts.append(call_to_action.strip())

        return "\n\n".join(parts)

    @staticmethod
    def _build_local_post_payload(
        text: str,
        image_url: str | None = None,
        call_to_action: str | None = None,
    ) -> dict:
        payload = {
            "languageCode": "en-US",
            "summary": text,
            "topicType": "STANDARD",
        }

        if image_url:
            payload["media"] = [
                {
                    "mediaFormat": "PHOTO",
                    "sourceUrl": image_url,
                }
            ]

        if call_to_action:
            cta_lower = call_to_action.lower()
            action_type = "LEARN_MORE"
            if "book" in cta_lower:
                action_type = "BOOK"
            elif "call" in cta_lower:
                action_type = "CALL"
            elif "buy" in cta_lower or "order" in cta_lower:
                action_type = "ORDER"
            elif "sign" in cta_lower:
                action_type = "SIGN_UP"

            payload["callToAction"] = {
                "actionType": action_type,
            }

        return payload

    @staticmethod
    def _failed_post(
        post,
        account: str,
        exc: Exception,
    ) -> PublishedPost:
        return PublishedPost(
            platform="google_business",
            account=account,
            day=post.day,
            title=post.title,
            status="failed",
            external_id="",
            scheduled_for=datetime.combine(
                post.publish_date,
                post.publish_time,
            ),
            image_path=post.image_path,
            image_source=post.image_source,
            errors=[str(exc)],
        )
