import asyncio
from datetime import datetime, timezone

from app.clients.meta import MetaClient
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


class FacebookPublisherProvider:

    @property
    def provider_name(self) -> str:
        return "facebook"

    def __init__(
        self,
        credential_service: CredentialService | None = None,
        client_factory=None,
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

        self.client_factory = (
            client_factory
            if client_factory is not None
            else MetaClient
        )

    async def apublish(
        self,
        schedule: PublishingSchedule,
    ) -> PublishingResult:

        tenant_id = schedule.tenant_id

        if not tenant_id:
            raise ValueError(
                "tenant_id is required for "
                "Facebook publishing."
            )

        self._validate_channel_context(schedule)

        context = TenantContext(
            tenant_id=tenant_id
        )

        results = []

        for post in schedule.posts:

            credential = (
                await self.credential_service
                .get_valid_credential_for_channel(
                    context=context,
                    business_account_id=(
                        schedule.business_account_id
                    ),
                    business_channel_id=(
                        post.business_channel_id
                    ),
                )
            )

            # Credential validation is intentionally OUTSIDE
            # the publishing try/except block.
            #
            # Missing or invalid credentials are hard errors.
            page_id = self._get_page_id(
                credential
            )

            page_access_token = (
                self._get_page_access_token(
                    credential
                )
            )

            try:

                client = self.client_factory(
                    page_access_token
                )

                if not post.image_url:
                    raise ValueError(
                        "Facebook publishing requires "
                        "a publicly accessible image_url."
                    )

                caption = self._build_caption(
                    post.caption,
                    post.hashtags,
                    post.call_to_action,
                )

                if not hasattr(client, "apost"):
                    raise RuntimeError(
                        "MetaClient does not provide "
                        "an asynchronous apost() method."
                    )

                response = await client.apost(
                    f"{page_id}/photos",
                    data={
                        "url": post.image_url,
                        "caption": caption,
                    },
                )

                external_id = (
                    response.get("post_id")
                    or response.get("id")
                )

                if not external_id:
                    raise ValueError(
                        "Meta did not return a Facebook "
                        "published post ID."
                    )

                results.append(
                    PublishedPost(
                        platform="facebook",
                        account=page_id,
                        day=post.day,
                        title=post.title,
                        status="published",
                        external_id=external_id,
                        scheduled_for=datetime.combine(
                            post.publish_date,
                            post.publish_time,
                        ),
                        published_at=datetime.now(
                            timezone.utc
                        ),
                        image_path=post.image_path,
                        image_source=post.image_source,
                    )
                )

            except Exception as exc:

                results.append(
                    self._failed_post(
                        post,
                        page_id,
                        exc,
                    )
                )

        successful = sum(
            1
            for post in results
            if post.status == "published"
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
            return asyncio.run(
                self.apublish(schedule)
            )

        raise RuntimeError(
            "Synchronous Facebook publishing "
            "cannot run inside an event loop. "
            "Use apublish()."
        )

    @staticmethod
    def _validate_channel_context(
        schedule: PublishingSchedule,
    ) -> None:

        if schedule.business_account_id is None:
            raise ValueError(
                "business_account_id is required for "
                "Facebook publishing."
            )

        for post in schedule.posts:

            if post.business_channel_id is None:
                raise ValueError(
                    "business_channel_id is required for "
                    "Facebook publishing."
                )

    @staticmethod
    def _get_page_id(
        credential,
    ) -> str:

        page_id = credential.metadata.get(
            "facebook_page_id"
        )

        if not page_id:
            raise ValueError(
                "Meta credential is missing "
                "facebook_page_id."
            )

        return page_id

    @staticmethod
    def _get_page_access_token(
        credential,
    ) -> str:

        page_access_token = (
            credential.metadata.get(
                "facebook_page_access_token"
            )
        )

        if not page_access_token:
            raise ValueError(
                "Meta credential is missing "
                "facebook_page_access_token."
            )

        return page_access_token

    @staticmethod
    def _failed_post(
        post,
        page_id: str,
        exc: Exception,
    ) -> PublishedPost:

        return PublishedPost(
            platform="facebook",
            account=page_id,
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

    @staticmethod
    def _build_caption(
        caption: str,
        hashtags: list[str],
        call_to_action: str,
    ) -> str:

        parts = []

        if caption.strip():
            parts.append(
                caption.strip()
            )

        normalized_hashtags = [
            (
                tag.strip()
                if tag.strip().startswith("#")
                else f"#{tag.strip()}"
            )
            for tag in hashtags
            if tag.strip()
        ]

        if normalized_hashtags:
            parts.append(
                " ".join(normalized_hashtags)
            )

        if call_to_action.strip():
            parts.append(
                call_to_action.strip()
            )

        return "\n\n".join(parts)