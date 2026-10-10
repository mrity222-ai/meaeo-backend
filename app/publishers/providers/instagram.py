import asyncio
import time
from datetime import datetime, timezone

from app.clients.meta import MetaClient
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


class InstagramPublisherProvider:

    CONTAINER_POLL_INTERVAL = 2
    CONTAINER_MAX_WAIT = 60

    @property
    def provider_name(self) -> str:
        return "instagram"

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

    def publish(
        self,
        schedule: PublishingSchedule,
    ) -> PublishingResult:

        tenant_id = schedule.tenant_id

        if not tenant_id:
            raise ValueError(
                "tenant_id is required for "
                "Instagram publishing."
            )

        self._validate_channel_context(schedule)

        context = TenantContext(
            tenant_id=tenant_id
        )

        return self._publish_sync(
            schedule,
            context,
        )

    async def apublish(
        self,
        schedule: PublishingSchedule,
    ) -> PublishingResult:

        tenant_id = schedule.tenant_id

        if not tenant_id:
            raise ValueError(
                "tenant_id is required for "
                "Instagram publishing."
            )

        self._validate_channel_context(schedule)

        context = TenantContext(
            tenant_id=tenant_id
        )

        return await self._publish_async(
            schedule,
            context,
        )

    @staticmethod
    def _validate_channel_context(
        schedule: PublishingSchedule,
    ) -> None:

        if schedule.business_account_id is None:
            raise ValueError(
                "business_account_id is required for "
                "Instagram publishing."
            )

        for post in schedule.posts:

            if post.business_channel_id is None:
                raise ValueError(
                    "business_channel_id is required for "
                    "Instagram publishing."
                )

    def _publish_sync(
        self,
        schedule: PublishingSchedule,
        context: TenantContext,
    ) -> PublishingResult:

        results = []

        for post in schedule.posts:

            credential = self._get_valid_credential_sync(
                context=context,
                business_account_id=(
                    schedule.business_account_id
                ),
                business_channel_id=(
                    post.business_channel_id
                ),
            )

            # Credential validation is intentionally OUTSIDE
            # the publishing try/except block.
            #
            # Missing or invalid credentials are hard errors.
            self._validate_credential(
                credential
            )

            try:

                client = self.client_factory(
                    credential.access_token
                )

                image_url = self._get_image_url(
                    post
                )

                caption = self._build_caption(
                    post.caption,
                    post.hashtags,
                    post.call_to_action,
                )

                container = client.post(
                    (
                        f"{credential.platform_account_id}"
                        "/media"
                    ),
                    data={
                        "image_url": image_url,
                        "caption": caption,
                    },
                )

                creation_id = container.get("id")

                if not creation_id:
                    raise ValueError(
                        "Meta did not return a "
                        "media container ID."
                    )

                self._wait_for_container(
                    client,
                    creation_id,
                )

                published = client.post(
                    (
                        f"{credential.platform_account_id}"
                        "/media_publish"
                    ),
                    data={
                        "creation_id": creation_id,
                    },
                )

                external_id = published.get("id")

                if not external_id:
                    raise ValueError(
                        "Meta did not return a "
                        "published media ID."
                    )

                results.append(
                    self._successful_post(
                        post,
                        credential,
                        external_id,
                    )
                )

            except Exception as exc:

                results.append(
                    self._failed_post(
                        post,
                        credential,
                        exc,
                    )
                )

        return self._build_result(results)

    async def _publish_async(
        self,
        schedule: PublishingSchedule,
        context: TenantContext,
    ) -> PublishingResult:

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
            self._validate_credential(
                credential
            )

            try:

                client = self.client_factory(
                    credential.access_token
                )

                image_url = self._get_image_url(
                    post
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

                container = await client.apost(
                    (
                        f"{credential.platform_account_id}"
                        "/media"
                    ),
                    data={
                        "image_url": image_url,
                        "caption": caption,
                    },
                )

                creation_id = container.get("id")

                if not creation_id:
                    raise ValueError(
                        "Meta did not return a "
                        "media container ID."
                    )

                await self._await_container(
                    client,
                    creation_id,
                )

                published = await client.apost(
                    (
                        f"{credential.platform_account_id}"
                        "/media_publish"
                    ),
                    data={
                        "creation_id": creation_id,
                    },
                )

                external_id = published.get("id")

                if not external_id:
                    raise ValueError(
                        "Meta did not return a "
                        "published media ID."
                    )

                results.append(
                    self._successful_post(
                        post,
                        credential,
                        external_id,
                    )
                )

            except Exception as exc:

                results.append(
                    self._failed_post(
                        post,
                        credential,
                        exc,
                    )
                )

        return self._build_result(results)

    def _get_valid_credential_sync(
        self,
        *,
        context: TenantContext,
        business_account_id: int,
        business_channel_id: int,
    ):

        try:
            asyncio.get_running_loop()

        except RuntimeError:

            return asyncio.run(
                self.credential_service
                .get_valid_credential_for_channel(
                    context=context,
                    business_account_id=business_account_id,
                    business_channel_id=business_channel_id,
                )
            )

        raise RuntimeError(
            "Synchronous Instagram publishing "
            "cannot be called from a running "
            "event loop. Use apublish() instead."
        )

    @staticmethod
    def _validate_credential(
        credential,
    ) -> None:

        if credential.platform != "meta":
            raise ValueError(
                "Instagram publishing requires "
                "a Meta credential."
            )

        if not credential.platform_account_id:
            raise ValueError(
                "Instagram credential is missing "
                "platform_account_id."
            )

        if not credential.access_token:
            raise ValueError(
                "Instagram credential is missing "
                "access_token."
            )

    @staticmethod
    def _successful_post(
        post,
        credential,
        external_id: str,
    ) -> PublishedPost:

        return PublishedPost(
            platform="instagram",
            account=credential.platform_account_id,
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

    @staticmethod
    def _failed_post(
        post,
        credential,
        exc: Exception,
    ) -> PublishedPost:

        return PublishedPost(
            platform="instagram",
            account=credential.platform_account_id,
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

    def _build_result(
        self,
        results: list[PublishedPost],
    ) -> PublishingResult:

        successful = sum(
            1
            for result in results
            if result.status == "published"
        )

        failed = len(results) - successful

        return PublishingResult(
            posts=results,
            successful=successful,
            failed=failed,
            provider=self.provider_name,
        )

    @staticmethod
    def _get_image_url(
        post,
    ) -> str:

        if not post.image_url:
            raise ValueError(
                "Instagram publishing requires "
                "a publicly accessible image_url."
            )

        return post.image_url

    @staticmethod
    def _build_caption(
        caption: str,
        hashtags: list[str],
        call_to_action: str,
    ) -> str:

        parts = []

        if caption.strip():
            parts.append(caption.strip())

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

    def _wait_for_container(
        self,
        client,
        creation_id: str,
    ) -> None:

        started_at = time.monotonic()

        while True:

            status_response = client.get(
                creation_id,
                params={
                    "fields": "status_code",
                },
            )

            status_code = (
                status_response.get("status_code")
                or ""
            ).upper()

            if status_code == "FINISHED":
                return

            if status_code in {
                "ERROR",
                "EXPIRED",
            }:
                raise RuntimeError(
                    "Instagram media container "
                    f"failed with status "
                    f"'{status_code}'."
                )

            if (
                time.monotonic()
                - started_at
                >= self.CONTAINER_MAX_WAIT
            ):
                raise TimeoutError(
                    "Instagram media container did "
                    "not finish processing within "
                    f"{self.CONTAINER_MAX_WAIT} seconds."
                )

            time.sleep(
                self.CONTAINER_POLL_INTERVAL
            )

    async def _await_container(
        self,
        client,
        creation_id: str,
    ) -> None:

        started_at = time.monotonic()

        while True:

            status_response = await client.aget(
                creation_id,
                params={
                    "fields": "status_code",
                },
            )

            status_code = (
                status_response.get("status_code")
                or ""
            ).upper()

            if status_code == "FINISHED":
                return

            if status_code in {
                "ERROR",
                "EXPIRED",
            }:
                raise RuntimeError(
                    "Instagram media container "
                    f"failed with status "
                    f"'{status_code}'."
                )

            if (
                time.monotonic()
                - started_at
                >= self.CONTAINER_MAX_WAIT
            ):
                raise TimeoutError(
                    "Instagram media container did "
                    "not finish processing within "
                    f"{self.CONTAINER_MAX_WAIT} seconds."
                )

            await asyncio.sleep(
                self.CONTAINER_POLL_INTERVAL
            )