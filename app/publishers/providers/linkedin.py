import asyncio
from datetime import datetime, timezone
import httpx

from app.models.config import settings
from app.repositories.local_credential_repository import (
    LocalCredentialRepository,
)
from app.schemas.publishing import (
    PublishedPost,
    publication_failure_flags,
    PublishingResult,
)
from app.schemas.schedule import PublishingSchedule
from app.security.credential_service import CredentialService
from app.security.fernet import FernetEncryptionService
from app.security.tenant import TenantContext


class LinkedInPublisherProvider:

    @property
    def provider_name(self) -> str:
        return "linkedin"

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
                "tenant_id is required for LinkedIn publishing."
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

            author_urn = self._get_author_urn(credential)
            access_token = self._get_access_token(credential)

            try:
                caption = self._build_caption(
                    post.caption,
                    post.hashtags,
                    post.call_to_action,
                )

                payload = self._build_ugc_payload(
                    author_urn=author_urn,
                    text=caption,
                    image_url=post.image_url,
                    title=post.title,
                )

                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "X-Restli-Protocol-Version": "2.0.0",
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
                        "https://api.linkedin.com/v2/ugcPosts",
                        json=payload,
                        headers=headers,
                    )
                finally:
                    if should_close:
                        await client.aclose()

                response.raise_for_status()

                res_data = response.json()
                external_id = (
                    res_data.get("id")
                    or response.headers.get("x-restli-id")
                    or res_data.get("urn")
                )

                if not external_id:
                    raise ValueError(
                        "LinkedIn API did not return a post URN / ID."
                    )

                results.append(
                    PublishedPost(
                        platform="linkedin",
                        account=author_urn,
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
                        author_urn,
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
            "Synchronous LinkedIn publishing cannot run inside an event loop. Use apublish()."
        )

    @staticmethod
    def _validate_channel_context(
        schedule: PublishingSchedule,
    ) -> None:
        if schedule.business_account_id is None:
            raise ValueError(
                "business_account_id is required for LinkedIn publishing."
            )

        for post in schedule.posts:
            if post.business_channel_id is None:
                raise ValueError(
                    "business_channel_id is required for LinkedIn publishing."
                )

    @staticmethod
    def _get_author_urn(credential) -> str:
        urn = (
            credential.metadata.get("linkedin_author_urn")
            or credential.metadata.get("author_urn")
            or credential.metadata.get("account_id")
        )
        if not urn:
            raise ValueError(
                "LinkedIn credential is missing linkedin_author_urn."
            )
        return urn

    @staticmethod
    def _get_access_token(credential) -> str:
        token = (
            credential.metadata.get("linkedin_access_token")
            or credential.metadata.get("access_token")
        )
        if not token:
            raise ValueError(
                "LinkedIn credential is missing linkedin_access_token."
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
    def _build_ugc_payload(
        author_urn: str,
        text: str,
        image_url: str | None = None,
        title: str | None = None,
    ) -> dict:
        media_category = "NONE"
        media_list = []

        if image_url:
            media_category = "ARTICLE"
            media_list = [
                {
                    "status": "READY",
                    "originalUrl": image_url,
                    "title": {"text": title or "Post Image"},
                }
            ]

        share_content = {
            "shareCommentary": {"text": text},
            "shareMediaCategory": media_category,
        }

        if media_list:
            share_content["media"] = media_list

        return {
            "author": author_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": share_content
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            },
        }

    @staticmethod
    def _failed_post(
        post,
        account: str,
        exc: Exception,
    ) -> PublishedPost:
        return PublishedPost(
            platform="linkedin",
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
            **publication_failure_flags(exc),
        )
