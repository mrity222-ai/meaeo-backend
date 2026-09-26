from __future__ import annotations

from pathlib import Path

from sqlalchemy.orm import Session

from app.schemas.image import (
    GeneratedImage,
    ImagePlan,
)
from app.services.asset_service import (
    AssetService,
)


class CampaignAssetService:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

        self.assets = AssetService(
            db
        )

    def prepare_image_plan(
        self,
        tenant_id: str,
        business_account_id: int,
        image_plan: ImagePlan,
        campaign_name: str,
        ttl_seconds: int | None = None,
    ) -> ImagePlan:

        prepared_images = []

        for image in image_plan.images:

            asset = (
                self.assets.register_file(
                    tenant_id=tenant_id,
                    business_account_id=(
                        business_account_id
                    ),
                    source_path=Path(
                        image.image_path
                    ),
                    source=image.source.value,
                )
            )

            image.metadata[
                "asset_id"
            ] = asset.id

            image.metadata[
                "asset_storage_key"
            ] = asset.storage_key

            image.metadata[
                "asset_url"
            ] = self.assets.build_signed_url(
                asset,
                ttl_seconds=ttl_seconds,
            )

            prepared_images.append(
                image
            )

        return ImagePlan(
            strategy=image_plan.strategy,
            images=prepared_images,
        )

    def reserve_image(
        self,
        tenant_id: str,
        business_account_id: int,
        image: GeneratedImage,
        campaign_name: str,
        day: int,
        platform: str,
    ):

        asset_id = image.metadata.get(
            "asset_id"
        )

        if not asset_id:
            raise ValueError(
                "Generated image has not been "
                "prepared as an asset."
            )

        asset = self.assets.get_asset(
            tenant_id=tenant_id,
            business_account_id=(
                business_account_id
            ),
            asset_id=asset_id,
        )

        if asset is None:
            raise ValueError(
                f"Asset '{asset_id}' was not found "
                "for the specified Business Account."
            )

        return self.assets.reserve_usage(
            asset=asset,
            campaign_name=campaign_name,
            day=day,
            platform=platform,
        )