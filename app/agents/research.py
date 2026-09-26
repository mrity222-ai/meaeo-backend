from app.agents.base import BaseAgent
from app.examples.research import RESEARCH_OUTPUT_EXAMPLE
from app.graph.state import AgentState
from app.prompts.builder import PromptBuilder
from app.prompts.research import RESEARCH_PROMPT
from app.research.manager import ResearchManager
from app.schemas.research import ResearchReport
from app.research.context import ResearchContext


class ResearchAgent(BaseAgent):

    def get_system_prompt(self) -> str:
        return RESEARCH_PROMPT
    
    def get_output_schema(self):
        return ResearchReport

    def get_output_example(self):
        return RESEARCH_OUTPUT_EXAMPLE

    def validate(
        self,
        state: AgentState,
    ) -> None:
        self._require(
            state,
            "campaign",
        )


    def build_context(
        self,
        state: AgentState,
    ) -> str:

        campaign = state["campaign"]
        context = state["raw_research"]

        builder = PromptBuilder()
        builder.section(
            "Campaign",
            campaign.model_dump_json(indent=2),
        )
        builder.section(
            "Business Research",
            context.business.model_dump_json(indent=2),
        )
        builder.section(
            "Industry Research",
            context.industry.model_dump_json(indent=2),
        )
        builder.section(
            "SEO Research",
            context.seo.model_dump_json(indent=2),
        )
        builder.section(
            "Trend Research",
            context.trends.model_dump_json(indent=2),
        )
        builder.section(
            "Audience Research",
            context.audience.model_dump_json(indent=2),
        )
        builder.section(
            "Review Research",
            context.reviews.model_dump_json(indent=2),
        )
        builder.section(
            "Your Task",
            """
    The sections above contain VERIFIED research collected from multiple providers.

    DO NOT repeat the research.

    DO NOT rewrite the research.

    DO NOT invent new competitors, keywords, or trends.

    Analyze the supplied research and generate ONLY:

    - recommendations
    - priority_actions
    - content_angles
    - campaign_risks

    Return ONLY valid JSON.
    """,
        )

        return builder.build()

    def get_state_key(self) -> str:
        return "research"
    
    def invoke(
        self,
        state: AgentState,
    ) -> AgentState:

        context = ResearchManager.collect(
            state
        )

        state["raw_research"] = context

        state = self._generate(
            state
        )

        report = state["research"]

        report.business = context.business
        report.industry = context.industry
        report.seo = context.seo
        report.trends = context.trends
        report.audience = context.audience
        report.reviews = context.reviews
        report.citations = context.citations

        self._finalize_research_status(
            state,
            context,
        )

        return state

    async def ainvoke(
        self,
        state: AgentState,
    ) -> AgentState:

        context = await (
            ResearchManager.acollect(
                state
            )
        )

        state["raw_research"] = context

        state = await self._agenerate(
            state
        )

        report = state["research"]

        report.business = context.business
        report.industry = context.industry
        report.seo = context.seo
        report.trends = context.trends
        report.audience = context.audience
        report.reviews = context.reviews
        report.citations = context.citations

        self._finalize_research_status(
            state,
            context,
        )

        return state

    def _finalize_research_status(
        self,
        state: AgentState,
        context,
    ) -> None:

        successful = len(
            context.providers
        )

        failed = len(
            context.failed_providers
        )

        if successful == 0:

            state["status"] = "failed"

            if context.errors:

                state.setdefault(
                    "errors",
                    [],
                ).extend(
                    context.errors
                )

            return

        if failed == 0:

            state["status"] = "success"

            return

        state["status"] = "success"

        state.setdefault(
            "warnings",
            [],
        ).append(
            "Research partially failed: "
            f"{failed} provider(s) failed."
        )

        if context.errors:

            state.setdefault(
                "warnings",
                [],
            ).extend(
                context.errors
            )
                
  

