from loguru import logger

from app.agents.base import BaseAgent
from app.examples.planner import PLANNER_OUTPUT_EXAMPLE
from app.graph.state import AgentState
from app.prompts.builder import PromptBuilder
from app.prompts.planner import PLANNER_PROMPT
from app.schemas.campaign_spec import CampaignSpec


class PlannerAgent(BaseAgent):

    def get_system_prompt(self) -> str:
        return PLANNER_PROMPT

    def get_output_schema(self):
        return CampaignSpec

    def get_output_example(self):
        return PLANNER_OUTPUT_EXAMPLE

    def validate(
        self,
        state: AgentState,
    ) -> None:

        self._require(
            state,
            "user_input",
        )

        available_platforms = state.get(
            "available_platforms",
            [],
        )

        if not available_platforms:
            available_platforms = ["instagram", "facebook"]
            state["available_platforms"] = available_platforms

    def get_state_key(self) -> str:
        return "campaign"

    def invoke(
        self,
        state: AgentState,
    ) -> AgentState:

        result = self._generate(
            state
        )

        self._normalize_platforms(
            result
        )

        self._propagate_image_strategy(
            result
        )

        logger.info(
            "PlannerAgent completed in {:.2f} ms",
            self.get_execution_time(),
        )

        return result

    async def ainvoke(
        self,
        state: AgentState,
    ) -> AgentState:

        result = await self._agenerate(
            state
        )

        self._normalize_platforms(
            result
        )

        self._propagate_image_strategy(
            result
        )

        return result

    def _normalize_platforms(
        self,
        state: AgentState,
    ) -> None:

        campaign = state.get(
            "campaign"
        )

        if campaign is None:
            raise ValueError(
                "Campaign specification was not "
                "created by PlannerAgent."
            )

        available_platforms = state.get(
            "available_platforms",
            [],
        )

        if not available_platforms:
            available_platforms = ["instagram", "facebook"]
            state["available_platforms"] = available_platforms

        available_by_key = {
            platform.strip().lower(): platform
            for platform in available_platforms
            if platform and platform.strip()
        }

        selected_platforms = []

        for platform in campaign.target_platforms:
            if not platform:
                continue

            key = platform.strip().lower()

            if key in available_by_key:
                selected_platforms.append(
                    available_by_key[key]
                )

        # Remove duplicates while preserving order.
        normalized_platforms = list(
            dict.fromkeys(
                selected_platforms
            )
        )

        if not normalized_platforms:
            # If the model ignored the available platforms entirely,
            # use the connected platforms rather than producing an
            # unusable campaign.
            normalized_platforms = list(
                available_platforms
            )

        campaign.target_platforms = (
            normalized_platforms
        )

    def _propagate_image_strategy(
        self,
        state: AgentState,
    ) -> None:

        campaign = state.get(
            "campaign"
        )

        if campaign is None:
            raise ValueError(
                "Campaign specification was not "
                "created by PlannerAgent."
            )

        state[
            "image_strategy"
        ] = campaign.image_strategy

    def build_context(
        self,
        state: AgentState,
    ) -> str:

        builder = PromptBuilder()

        builder.section(
            "User Request",
            state["user_input"],
        )

        available_platforms = state.get(
            "available_platforms",
            [],
        )

        builder.section(
            "Connected Publishing Platforms",
            available_platforms,
        )

        builder.section(
            "Platform Constraint",
            (
                "The campaign may target ONLY the connected "
                "publishing platforms listed above. Do not select "
                "or invent any other platform."
            ),
        )

        campaign_context = state.get(
            "campaign_context"
        )

        if campaign_context is not None:

            business = campaign_context.business

            if business is not None:
                builder.section(
                    "Business Profile",
                    {
                        "business_name": (
                            business.business_name
                        ),
                        "category": (
                            business.category
                        ),
                        "description": (
                            business.description
                        ),
                        "website": (
                            business.website
                        ),
                        "country": (
                            business.country
                        ),
                        "city": (
                            business.city
                        ),
                    },
                )

            brand = campaign_context.brand

            if brand is not None:
                builder.section(
                    "Brand Profile",
                    {
                        "name": brand.name,
                        "primary_color": (
                            brand.primary_color
                        ),
                        "secondary_color": (
                            brand.secondary_color
                        ),
                        "fonts": brand.fonts,
                        "voice": brand.voice,
                        "hashtags": brand.hashtags,
                        "metadata": brand.metadata,
                    },
                )

            products = campaign_context.products

            if products:
                builder.section(
                    "Products",
                    [
                        {
                            "name": product.name,
                            "description": (
                                product.description
                            ),
                            "type": product.type,
                            "price": product.price,
                            "currency": product.currency,
                            "product_url": (
                                product.product_url
                            ),
                            "benefits": (
                                product.benefits
                            ),
                            "features": (
                                product.features
                            ),
                            "target_customer": (
                                product.target_customer
                            ),
                        }
                        for product in products
                    ],
                )

            audience = campaign_context.audience

            if audience is not None:
                builder.section(
                    "Target Audience",
                    {
                        "name": audience.name,
                        "description": (
                            audience.description
                        ),
                        "age_min": audience.age_min,
                        "age_max": audience.age_max,
                        "genders": audience.genders,
                        "locations": audience.locations,
                        "languages": audience.languages,
                        "interests": audience.interests,
                        "pain_points": (
                            audience.pain_points
                        ),
                        "needs": audience.needs,
                    },
                )

            preferences = (
                campaign_context.marketing_preferences
            )

            if preferences is not None:
                builder.section(
                    "Marketing Preferences",
                    {
                        "primary_goal": (
                            preferences.primary_goal
                        ),
                        "secondary_goals": (
                            preferences.secondary_goals
                        ),
                        "content_types": (
                            preferences.content_types
                        ),
                        "creativity_level": (
                            preferences.creativity_level
                        ),
                        "promotional_intensity": (
                            preferences.promotional_intensity
                        ),
                        "approval_mode": (
                            preferences.approval_mode
                        ),
                        "timezone": (
                            preferences.timezone
                        ),
                        "preferred_posting_time": (
                            preferences.preferred_posting_time
                        ),
                        "posting_frequency": (
                            preferences.posting_frequency
                        ),
                    },
                )

        return builder.build()