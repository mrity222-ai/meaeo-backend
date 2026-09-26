from app.schemas.campaign_bundle import CampaignBundle


class CampaignBuilder:

    @staticmethod
    def build(
        state,
    ) -> CampaignBundle:

        return CampaignBundle(

            campaign=state["campaign"],
            brand=state["brand_profile"],
            research=state["research"],
            strategy=state["strategy"],
            content=state["content"],
            images=state["image_plan"],
        )