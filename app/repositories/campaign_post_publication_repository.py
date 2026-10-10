from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.models import (
    CampaignPostPublication,
)


PUBLICATION_STALE_AFTER = timedelta(
    minutes=10
)


class CampaignPostPublicationRepository:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

    def get(
        self,
        tenant_id: str,
        publication_id: int,
    ) -> CampaignPostPublication | None:

        return self.db.scalar(
            select(CampaignPostPublication).where(
                CampaignPostPublication.id
                == publication_id,
                CampaignPostPublication.tenant_id
                == tenant_id,
            )
        )

    def get_for_post_channel(
        self,
        tenant_id: str,
        campaign_post_id: int,
        business_channel_id: int,
    ) -> CampaignPostPublication | None:

        return self.db.scalar(
            select(
                CampaignPostPublication
            ).where(
                CampaignPostPublication.tenant_id
                == tenant_id,
                CampaignPostPublication.campaign_post_id
                == campaign_post_id,
                CampaignPostPublication.business_channel_id
                == business_channel_id,
            )
        )

    def get_by_idempotency_key(
        self,
        idempotency_key: str,
    ) -> CampaignPostPublication | None:

        return self.db.scalar(
            select(
                CampaignPostPublication
            ).where(
                CampaignPostPublication.idempotency_key
                == idempotency_key,
            )
        )

    def list_for_post(
        self,
        tenant_id: str,
        campaign_post_id: int,
    ) -> list[CampaignPostPublication]:

        return list(
            self.db.scalars(
                select(
                    CampaignPostPublication
                )
                .where(
                    CampaignPostPublication.tenant_id
                    == tenant_id,
                    CampaignPostPublication.campaign_post_id
                    == campaign_post_id,
                )
                .order_by(
                    CampaignPostPublication.business_channel_id
                )
            ).all()
        )

    def create(
        self,
        *,
        tenant_id: str,
        campaign_post_id: int,
        business_channel_id: int,
        platform: str,
        idempotency_key: str,
    ) -> CampaignPostPublication:

        existing = self.get_for_post_channel(
            tenant_id=tenant_id,
            campaign_post_id=campaign_post_id,
            business_channel_id=business_channel_id,
        )

        if existing is not None:
            return existing

        publication = CampaignPostPublication(
            tenant_id=tenant_id,
            campaign_post_id=campaign_post_id,
            business_channel_id=business_channel_id,
            platform=platform.lower(),
            idempotency_key=idempotency_key,
            status="pending",
            attempts=0,
        )

        self.db.add(publication)

        try:
            self.db.commit()

        except IntegrityError:
            self.db.rollback()

            existing = self.get_for_post_channel(
                tenant_id=tenant_id,
                campaign_post_id=campaign_post_id,
                business_channel_id=business_channel_id,
            )

            if existing is not None:
                return existing

            raise

        self.db.refresh(publication)

        return publication

    def mark_processing(
        self,
        publication: CampaignPostPublication,
    ) -> CampaignPostPublication:

        now = datetime.now(timezone.utc)

        claimed = self.db.execute(update(CampaignPostPublication).where(
            CampaignPostPublication.id == publication.id,
            CampaignPostPublication.status.in_(["pending", "failed"]),
        ).values(status="processing", attempts=CampaignPostPublication.attempts + 1,
                 started_at=now, completed_at=None, last_error=None, updated_at=now)
          .execution_options(synchronize_session=False))
        self.db.commit()
        self.db.refresh(publication)
        return publication if claimed.rowcount == 1 else None

    def mark_provider_reference(
        self,
        publication: CampaignPostPublication,
        provider_reference: str,
    ) -> CampaignPostPublication:

        publication.provider_reference = provider_reference
        publication.updated_at = datetime.now(
            timezone.utc
        )

        self.db.commit()
        self.db.refresh(publication)

        return publication

    def mark_published(
        self,
        publication: CampaignPostPublication,
        external_id: str,
    ) -> CampaignPostPublication:

        now = datetime.now(timezone.utc)

        publication.status = "published"
        publication.external_id = external_id
        publication.completed_at = now
        publication.updated_at = now
        publication.last_error = None

        self.db.commit()
        self.db.refresh(publication)

        return publication

    def mark_failed(
        self,
        publication: CampaignPostPublication,
        error: str,
    ) -> CampaignPostPublication:

        now = datetime.now(timezone.utc)

        publication.status = "failed"
        publication.last_error = error
        publication.completed_at = now
        publication.updated_at = now

        self.db.commit()
        self.db.refresh(publication)

        return publication

    def mark_reconciliation_required(
        self,
        publication: CampaignPostPublication,
        error: str,
    ) -> CampaignPostPublication:

        now = datetime.now(timezone.utc)

        publication.status = (
            "reconciliation_required"
        )
        publication.last_error = error
        publication.completed_at = None
        publication.updated_at = now

        self.db.commit()
        self.db.refresh(publication)

        return publication

    def recover_stale_processing(
        self,
        *,
        now: datetime | None = None,
    ) -> int:

        if now is None:
            now = datetime.now(timezone.utc)

        cutoff = (
            now - PUBLICATION_STALE_AFTER
        )

        result = self.db.execute(update(CampaignPostPublication).where(
            CampaignPostPublication.status == "processing",
            CampaignPostPublication.started_at.is_not(None),
            CampaignPostPublication.started_at <= cutoff,
        ).values(status="reconciliation_required", updated_at=now,
                 last_error="Publication outcome was not recorded. Provider reconciliation is required.")
          .execution_options(synchronize_session=False))
        self.db.commit()
        return result.rowcount
