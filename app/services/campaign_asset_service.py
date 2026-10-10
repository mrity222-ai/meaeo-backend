from __future__ import annotations

import hashlib
import uuid
from app.models.config import settings
from contextlib import contextmanager
from contextvars import ContextVar
from app.schemas.image import ImageStrategy, ImageSourceMode, OverlayTarget
from dataclasses import replace
from pathlib import Path

from sqlalchemy import select
from app.database.models import Asset
from app.image.catalogue import campaign_catalogue_scope

from sqlalchemy.orm import Session

from app.schemas.image import (
    GeneratedImage,
    ImagePlan,
)
from app.services.asset_service import (
    AssetService,
)


_validated_image_strategy = ContextVar("validated_image_strategy", default=None)


class CampaignAssetService:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

        self.assets = AssetService(
            db
        )

    @contextmanager
    def bind_inputs(self, state):
        tenant_id = state.get("tenant_id")
        business_id = state.get("business_account_id")
        context = state.get("campaign_context")
        if (context is None or context.brand is None or context.tenant_id != tenant_id
                or context.business_account_id != business_id):
            raise ValueError("Validated business context is required for campaign assets.")
        self.assets.validate_business_account_access(tenant_id=tenant_id, business_account_id=business_id)
        catalogue = self.db.scalars(self.assets.catalogue_statement(tenant_id, business_id)
            .order_by(Asset.created_at, Asset.id)).all()
        logo_id = context.brand.metadata.get("logo_asset_id")
        paths = [self.assets.resolve_owned_image_path(tenant_id=tenant_id,
                    business_account_id=business_id, asset_id=asset.id)
                 for asset in catalogue if asset.id != logo_id]
        logos = {}
        if logo_id:
            logos["primary"] = str(self.assets.resolve_owned_image_path(
                tenant_id=tenant_id, business_account_id=business_id, asset_id=logo_id))
        elif context.brand.logos:
            raise ValueError("Brand logo must reference a validated business asset.")
        # Resolve asset IDs to files before passing the existing brand to agents.
        brand = replace(context.brand, logos=logos)
        state["campaign_context"] = replace(context, brand=brand)
        state["brand_profile"] = brand
        state["brand_name"] = brand.name
        owned_paths = {str(path.resolve()) for path in paths}
        if any(str(Path(path).resolve()) not in owned_paths
               for path in state.get("original_images", {}).values()):
            raise ValueError("Original image does not belong to the selected business catalogue.")
        allowed_names = {path.name for path in paths}
        if any(name not in allowed_names for name in state.get("catalogue_selection", {}).values()):
            raise ValueError("Selected catalogue image does not belong to the business.")
        namespace = f"{tenant_id}:{business_id}"
        tenant_folder = hashlib.sha256(tenant_id.encode()).hexdigest()[:24]
        output_root = Path(settings.IMAGE_OUTPUT_DIR) / "businesses" / tenant_folder / str(business_id) / uuid.uuid4().hex
        requested = state.get("image_strategy")
        strategy = ImageStrategy.model_validate(requested) if requested is not None else ImageStrategy(
            source_mode=ImageSourceMode.CATALOGUE if paths else ImageSourceMode.AI,
            overlay_target=OverlayTarget.BOTH,
        )
        if strategy.source_mode == ImageSourceMode.BOTH:
            raise ValueError("Combined catalogue and AI mode is not supported. Select catalogue, original or AI.")
        if strategy.source_mode in {ImageSourceMode.CATALOGUE, ImageSourceMode.ORIGINAL} and not paths:
            raise ValueError("Upload a product catalogue image before requesting real product posts.")
        token = _validated_image_strategy.set(strategy)
        try:
            with campaign_catalogue_scope(paths, output_root=output_root, namespace=namespace):
                yield
        finally:
            _validated_image_strategy.reset(token)

    @staticmethod
    def apply_image_strategy(state):
        # Enforce validated application input after the planner, outside agent code.
        strategy = _validated_image_strategy.get()
        if strategy is not None:
            state["image_strategy"] = strategy.model_copy()
            if state.get("campaign") is not None:
                state["campaign"].image_strategy = strategy.model_copy()
        elif state.get("image_strategy") is not None:
            candidate = ImageStrategy.model_validate(state["image_strategy"])
            if candidate.source_mode == ImageSourceMode.BOTH:
                raise ValueError("Combined catalogue and AI mode is not supported.")
        return state

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
                    source="campaign",
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