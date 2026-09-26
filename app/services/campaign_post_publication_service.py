from __future__ import annotations

from datetime import datetime

from app.repositories.campaign_post_publication_repository import (
    CampaignPostPublicationRepository,
)
from app.schemas.publishing import PublishedPost


class CampaignPostPublicationService:

    def __init__(self, db):
        self.db = db
        self.repository = (
            CampaignPostPublicationRepository(db)
        )

    @staticmethod
    def build_idempotency_key(
        campaign_post_id: int,
        business_channel_id: int,
    ) -> str:

        return (
            f"campaign-post:"
            f"{campaign_post_id}:"
            f"channel:"
            f"{business_channel_id}"
        )

    def get_or_create(
        self,
        *,
        tenant_id: str,
        campaign_post_id: int,
        business_channel_id: int,
        platform: str,
    ):

        platform = platform.lower()

        existing = (
            self.repository
            .get_for_post_channel(
                tenant_id=tenant_id,
                campaign_post_id=campaign_post_id,
                business_channel_id=business_channel_id,
            )
        )

        if existing is not None:
            return existing

        idempotency_key = (
            self.build_idempotency_key(
                campaign_post_id,
                business_channel_id,
            )
        )

        return self.repository.create(
            tenant_id=tenant_id,
            campaign_post_id=campaign_post_id,
            business_channel_id=business_channel_id,
            platform=platform,
            idempotency_key=idempotency_key,
        )

    def mark_processing(
        self,
        publication,
    ):
        return self.repository.mark_processing(
            publication
        )

    def mark_provider_reference(
        self,
        publication,
        provider_reference: str,
    ):
        return self.repository.mark_provider_reference(
            publication,
            provider_reference,
        )

    def mark_published(
        self,
        publication,
        external_id: str,
    ):
        return self.repository.mark_published(
            publication,
            external_id,
        )

    def mark_failed(
        self,
        publication,
        error: str,
    ):
        return self.repository.mark_failed(
            publication,
            error,
        )

    def mark_reconciliation_required(
        self,
        publication,
        error: str,
    ):
        return (
            self.repository
            .mark_reconciliation_required(
                publication,
                error,
            )
        )

    def recover_stale_processing(
        self,
        *,
        now: datetime | None = None,
    ) -> int:

        return (
            self.repository
            .recover_stale_processing(
                now=now
            )
        )

    @staticmethod
    def result_is_successful(
        post: PublishedPost,
    ) -> bool:

        return (
            post.status == "published"
            and bool(post.external_id)
        )

    @staticmethod
    def result_error(
        post: PublishedPost,
    ) -> str:

        if post.errors:
            return "; ".join(
                post.errors
            )

        return (
            "Provider returned a failed "
            "publication result."
        )