from dataclasses import is_dataclass, asdict
from app.schemas.campaign_bundle import CampaignBundle


class CampaignBuilder:

    @staticmethod
    def _to_serializable_brand(brand_obj):
        if brand_obj is None:
            return {}
        if isinstance(brand_obj, dict):
            return brand_obj
        if is_dataclass(brand_obj):
            return asdict(brand_obj)
        if hasattr(brand_obj, "model_dump"):
            return brand_obj.model_dump(mode="json")
        if hasattr(brand_obj, "__dict__"):
            return {k: v for k, v in brand_obj.__dict__.items() if not k.startswith("_")}
        return str(brand_obj)

    @staticmethod
    def build(
        state,
    ) -> CampaignBundle:

        raw_brand = state.get("brand_profile")
        brand_val = CampaignBuilder._to_serializable_brand(raw_brand)

        return CampaignBundle(
            campaign=state["campaign"],
            brand=brand_val,
            research=state["research"],
            strategy=state["strategy"],
            content=state["content"],
            images=state["image_plan"],
        )