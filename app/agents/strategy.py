from app.agents.base import BaseAgent
from app.examples.strategy import STRATEGY_OUTPUT_EXAMPLE
from app.graph.state import AgentState
from app.prompts.builder import PromptBuilder
from app.prompts.strategy import STRATEGY_SYSTEM_PROMPT
from app.schemas.strategy import MarketingStrategy


class StrategyAgent(BaseAgent):

    def get_system_prompt(self) -> str:
        return STRATEGY_SYSTEM_PROMPT

    def get_output_schema(self):
        return MarketingStrategy

    def get_output_example(self) -> dict:
        return STRATEGY_OUTPUT_EXAMPLE

    def validate(
        self,
        state: AgentState
    ):
        self._require(
            state,
            "campaign",
            "research",
        )


    def build_context(
        self,
        state: AgentState,
    ) -> str:

        builder = PromptBuilder()

        builder \
            .section(
                "Campaign Specification",
                state["campaign"],
            ) \
            .section(
                "Research Report",
                state["research"],
            ) \
            .task(
                "Generate a complete MarketingStrategy using only the supplied campaign specification and research report."
            )

        return builder.build()

    def get_state_key(self) -> str:
        return "strategy"

    def invoke(
        self,
        state: AgentState
    ):
        return self._generate(state)

    async def ainvoke(
        self,
        state: AgentState
    ):
        return await self._agenerate(state)