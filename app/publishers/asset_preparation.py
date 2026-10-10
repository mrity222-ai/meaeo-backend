from pathlib import Path

from sqlalchemy.orm import Session

from app.schemas.schedule import PublishingSchedule
from app.services.asset_service import AssetService


class AssetPreparationService:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

        self.asset_service = AssetService(
            db
        )

    def prepare_schedule(
        self,
        schedule: PublishingSchedule,
    ) -> PublishingSchedule:

        if not schedule.tenant_id:
            raise ValueError(
                "Publishing schedule requires "
                "tenant_id for asset preparation."
            )

        if not schedule.business_account_id:
            raise ValueError(
                "Publishing schedule requires "
                "business_account_id for asset preparation."
            )

        for post in schedule.posts:

            if not post.image_path:
                raise ValueError(
                    f"Post day {post.day} has no image_path."
                )

            asset = (
                self.asset_service.register_file(
                    tenant_id=schedule.tenant_id,
                    business_account_id=(
                        schedule.business_account_id
                    ),
                    source_path=Path(
                        post.image_path
                    ),
                    # Campaign outputs must not become future product catalogue inputs.
                    source="campaign",
                )
            )

            post.image_url = (
                self.asset_service.build_signed_url(
                    asset,
                    ttl_seconds=3600,
                )
            )

        return schedule
    