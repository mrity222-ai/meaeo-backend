from app.agents.base import BaseAgent
from app.database.models import BusinessChannel
from app.database.session import SessionLocal
from app.examples.content import CONTENT_OUTPUT_EXAMPLE
from app.prompts.builder import PromptBuilder
from app.prompts.content_writer import CONTENT_WRITER_SYSTEM_PROMPT
from app.schemas.content import ContentPlan


class ContentWriterAgent(BaseAgent):

    def get_state_key(self):
        return "content"

    def get_system_prompt(self):
        return CONTENT_WRITER_SYSTEM_PROMPT

    def get_output_schema(self):
        return ContentPlan

    def get_output_example(self):
        return CONTENT_OUTPUT_EXAMPLE

    def validate(self, state):

        self._require(
            state,
            "campaign",
            "brand_profile",
            "research",
            "strategy",
        )

        tenant_id = state.get("tenant_id")

        if not tenant_id:
            raise ValueError(
                "tenant_id is required for content generation."
            )

        business_account_id = state.get(
            "business_account_id"
        )

        if not business_account_id:
            raise ValueError(
                "business_account_id is required "
                "for content generation."
            )

    def invoke(self, state):

        self._apply_connected_platforms(state)

        result = self._generate(state)

        self._normalize_platforms(result)

        return result

    async def ainvoke(self, state):

        self._apply_connected_platforms(state)

        result = await self._agenerate(state)

        self._normalize_platforms(result)

        return result

    def build_context(self, state):

        builder = PromptBuilder()

        builder \
            .section(
                "Campaign Specification",
                state["campaign"],
            ) \
            .section(
                "Brand Profile",
                state["brand_profile"],
            ) \
            .section(
                "Research Report",
                state["research"],
            ) \
            .section(
                "Marketing Strategy",
                state["strategy"],
            ) \
            .task(
                "Generate a complete content plan using ONLY "
                "the concrete publishing platforms specified "
                "by Campaign Specification.target_platforms. "
                "These platforms have already been validated "
                "as active and enabled for the current business "
                "account. Do not invent or add any other platform."
            )

        return builder.build()

    @staticmethod
    def _get_connected_platforms(
        tenant_id: str,
        business_account_id: int,
    ) -> list[str]:

        db = SessionLocal()

        try:

            channels = (
                db.query(BusinessChannel)
                .filter(
                    BusinessChannel.tenant_id
                    == tenant_id,
                    BusinessChannel.business_account_id
                    == business_account_id,
                    BusinessChannel.status
                    == "active",
                    BusinessChannel.is_enabled
                    == True,
                )
                .all()
            )

            platforms = []

            seen = set()

            for channel in channels:

                platform = (
                    channel.platform.strip()
                    if channel.platform
                    else ""
                )

                if not platform:
                    continue

                normalized = platform.lower()

                if normalized in seen:
                    continue

                seen.add(normalized)
                platforms.append(platform)

            return platforms

        finally:
            db.close()

    def _apply_connected_platforms(self, state):

        campaign = state.get("campaign")

        if campaign is None:
            raise ValueError(
                "Campaign specification is missing."
            )

        tenant_id = state.get("tenant_id")

        if not tenant_id:
            raise ValueError(
                "tenant_id is required for content generation."
            )

        business_account_id = state.get(
            "business_account_id"
        )

        if not business_account_id:
            raise ValueError(
                "business_account_id is required "
                "for content generation."
            )

        connected_platforms = (
            self._get_connected_platforms(
                tenant_id=tenant_id,
                business_account_id=business_account_id,
            )
        )

        if not connected_platforms:
            connected_platforms = ["instagram", "facebook"]

        connected_lookup = {
            platform.strip().lower()
            for platform in connected_platforms
            if platform and platform.strip()
        }

        requested_platforms = [
            platform
            for platform in campaign.target_platforms
            if platform and platform.strip()
        ]

        compatible_platforms = [
            platform
            for platform in requested_platforms
            if platform.strip().lower()
            in connected_lookup
        ]

        if compatible_platforms:

            campaign.target_platforms = (
                compatible_platforms
            )

        else:

            campaign.target_platforms = (
                connected_platforms
            )

    def _normalize_platforms(self, state):
        campaign = state.get("campaign")

        if campaign is None:
            raise ValueError(
                "Campaign specification is missing."
            )

        allowed = [
            platform.strip().lower()
            for platform in campaign.target_platforms
            if platform and platform.strip()
        ]

        if not allowed:
            raise ValueError(
                "Campaign has no target publishing platforms."
            )

        content = state.get("content")

        if content is None:
            raise ValueError(
                "Content plan was not generated."
            )

        expected_days = campaign.duration_days

        if content.duration_days != expected_days:
            content.duration_days = expected_days

        posts_by_day = {}

        for post in content.posts:
            if post.day in posts_by_day:
                raise ValueError(
                    f"Campaign contains duplicate content for day {post.day}."
                )

            posts_by_day[post.day] = post

        missing_days = [
            day
            for day in range(1, expected_days + 1)
            if day not in posts_by_day
        ]

        extra_days = [
            day
            for day in posts_by_day
            if day < 1 or day > expected_days
        ]

        if missing_days:
            raise ValueError(
                "Content generation did not produce a post for every "
                f"campaign day. Missing days: {missing_days}"
            )

        if extra_days:
            raise ValueError(
                "Content generation produced posts outside the campaign "
                f"duration. Invalid days: {extra_days}"
            )

        if len(content.posts) != expected_days:
            raise ValueError(
                "Content generation produced "
                f"{len(content.posts)} posts for a "
                f"{expected_days}-day campaign."
            )

        content.posts.sort(key=lambda post: post.day)

        for post in content.posts:
            post.platforms = [
                platform
                for platform in campaign.target_platforms
                if platform.strip().lower() in allowed
            ]

            if not post.platforms:
                raise ValueError(
                    f"Campaign day {post.day} has no "
                    "available publishing platform."
                )