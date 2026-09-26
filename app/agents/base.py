from abc import ABC, abstractmethod
from datetime import datetime, timezone

from pydantic import BaseModel

from app.agents.execution import (
    AgentExecutionContext,
    AgentExecutionResult,
    ExecutionTimer,
    StateUpdater,
)
from app.graph.state import AgentState
from app.models.config import settings
from app.models.factory import ModelFactory
from app.models.response import ModelResponse
from app.parsers.json_cleaner import JSONCleaner
from app.parsers.json_parser import JSONParser
from app.parsers.json_validator import JSONValidator
from app.parsers.schema_normalizer import SchemaNormalizer
from app.tools.manager import ToolManager


class BaseAgent(ABC):

    def __init__(self):

        self.llm = ModelFactory.get_provider()

        self.context = AgentExecutionContext(
            agent_name=self.__class__.__name__,
        )

        self.context.model_name = getattr(
            self.llm,
            "model",
            "unknown",
        )

        self.timer = ExecutionTimer()

    def before_run(
        self,
        state: AgentState,
    ) -> None:
        """
        Reset execution-specific context before
        starting a new agent invocation.
        """

        now = datetime.now(timezone.utc)

        self.context.started_at = now
        self.context.finished_at = None
        self.context.duration_ms = 0.0

        self.context.retries = 0
        self.context.warnings.clear()
        self.context.tool_calls.clear()

        self.context.prompt_tokens = 0
        self.context.completion_tokens = 0
        self.context.total_tokens = 0

    def execute(
        self,
        state: AgentState,
    ) -> AgentExecutionResult:

        context = self.build_context(
            state
        )

        messages = self._build_messages(
            context
        )

        max_attempts = settings.LLM_MAX_RETRIES

        for attempt in range(max_attempts):

            try:

                response = self.llm.invoke(
                    messages
                )

                content = ModelResponse.content(
                    response
                )

                print(
                    f"\n===== {self.__class__.__name__} RAW MODEL RESPONSE ====="
                )
                print(content)
                print(
                    f"===== END {self.__class__.__name__} RAW MODEL RESPONSE =====\n"
                )

                content = JSONCleaner.clean(
                    content
                )

                if JSONValidator.is_json(
                    content
                ):

                    try:

                        parsed = self._parse_response(
                            content
                        )

                        return AgentExecutionResult(
                            output=parsed
                        )

                    except Exception as exc:

                        if attempt == max_attempts - 1:

                            return self._failure_result(
                                exc
                            )

                        self.context.retries += 1

                        messages.append(
                            {
                                "role": "assistant",
                                "content": content,
                            }
                        )

                        messages.append(
                            {
                                "role": "user",
                                "content": """
You did not follow the required schema.

Return ONLY valid JSON that exactly
matches the required schema.

No markdown.
No explanation.
No headings.
""",
                            }
                        )

                        continue

                # Invalid JSON.
                #
                # If this was the final attempt, do not
                # increment retries because no retry will
                # actually occur.
                if attempt == max_attempts - 1:

                    return self._failure_result(
                        ValueError(
                            f"{self.__class__.__name__} "
                            "failed to return valid JSON "
                            "after all retry attempts."
                        )
                    )

                self.context.retries += 1

                messages.append(
                    {
                        "role": "assistant",
                        "content": content,
                    }
                )

                messages.append(
                    {
                        "role": "user",
                        "content": """
You did not follow the instructions.
Return ONLY valid JSON.
No markdown.
No report.
No explanation.
No headings.
Follow the required schema exactly.
""",
                    }
                )

            except Exception as exc:

                return self._failure_result(
                    exc
                )

        return self._failure_result(
            ValueError(
                f"{self.__class__.__name__} "
                "failed to return valid JSON "
                "after all retry attempts."
            )
        )

    def _failure_result(
        self,
        exc: Exception,
    ) -> AgentExecutionResult:
        example = self.get_output_example()
        if example is not None:
            try:
                schema = self.get_output_schema()
                if schema and isinstance(example, dict):
                    parsed = schema.model_validate(example)
                else:
                    parsed = example
                return AgentExecutionResult(
                    output=parsed,
                    warnings=[
                        (
                            f"{self.__class__.__name__} "
                            f"fell back to template due to: {exc}"
                        )
                    ],
                    success=True,
                )
            except Exception:
                pass

        return AgentExecutionResult(
            output=None,
            errors=[
                (
                    f"{self.__class__.__name__} "
                    f"execution failed: {exc}"
                )
            ],
            success=False,
        )

    async def aexecute(
        self,
        state: AgentState,
    ) -> AgentExecutionResult:

        context = self.build_context(
            state
        )

        messages = self._build_messages(
            context
        )

        max_attempts = settings.LLM_MAX_RETRIES

        for attempt in range(max_attempts):

            try:

                response = await self.llm.ainvoke(
                    messages
                )

                content = ModelResponse.content(
                    response
                )

                content = JSONCleaner.clean(
                    content
                )

                if JSONValidator.is_json(
                    content
                ):

                    try:

                        parsed = self._parse_response(
                            content
                        )

                        return AgentExecutionResult(
                            output=parsed
                        )

                    except Exception as exc:

                        if attempt == max_attempts - 1:

                            return self._failure_result(
                                exc
                            )

                        self.context.retries += 1

                        messages.append(
                            {
                                "role": "assistant",
                                "content": content,
                            }
                        )

                        messages.append(
                            {
                                "role": "user",
                                "content": """
You did not follow the required schema.

Return ONLY valid JSON that exactly
matches the required schema.

No markdown.
No explanation.
No headings.
""",
                            }
                        )

                        continue

                # Invalid JSON.
                #
                # If this was the final attempt, do not
                # increment retries because no retry will
                # actually occur.
                if attempt == max_attempts - 1:

                    return self._failure_result(
                        ValueError(
                            f"{self.__class__.__name__} "
                            "failed to return valid JSON "
                            "after all retry attempts."
                        )
                    )

                self.context.retries += 1

                messages.append(
                    {
                        "role": "assistant",
                        "content": content,
                    }
                )

                messages.append(
                    {
                        "role": "user",
                        "content": """
You did not follow the instructions.
Return ONLY valid JSON.
No markdown.
No report.
No explanation.
No headings.
Follow the required schema exactly.
""",
                    }
                )

            except Exception as exc:

                return self._failure_result(
                    exc
                )

        return self._failure_result(
            ValueError(
                f"{self.__class__.__name__} "
                "failed to return valid JSON "
                "after all retry attempts."
            )
        )

    def after_run(
        self,
        state: AgentState,
        result: AgentExecutionResult,
    ):

        result.metrics.duration_ms = (
            self.context.duration_ms
        )

        result.metrics.provider = (
            self.llm.__class__.__name__
        )

        result.metrics.model = (
            getattr(
                self.llm,
                "model",
                None,
            )
        )

        result.metrics.retries = (
            self.context.retries
        )

        result.metrics.tool_calls = len(
            self.context.tool_calls
        )

    @property
    def system_prompt(self):
        return self.get_system_prompt()

    @abstractmethod
    def get_system_prompt(self) -> str:
        pass

    @abstractmethod
    def get_output_schema(self) -> type[BaseModel]:
        """
        Return the Pydantic model expected from this agent.
        """
        pass

    @abstractmethod
    def get_output_example(self) -> dict:
        """
        Example JSON returned by this agent.
        """
        pass

    @abstractmethod
    def validate(
        self,
        state: AgentState,
    ) -> None:
        """
        Validate the incoming state before execution.
        """
        pass

    @abstractmethod
    def get_state_key(self) -> str:
        """
        Returns the state key where this agent stores its output.
        """
        pass

    @abstractmethod
    def build_context(
        self,
        state: AgentState,
    ) -> str:
        """
        Build the user context passed to the LLM.
        """
        pass

    def _update_state(
        self,
        state: AgentState,
        result: AgentExecutionResult,
    ):
        return StateUpdater.update(
            state=state,
            state_key=self.get_state_key(),
            result=result,
        )

    def _execute_tool(
        self,
        tool_name: str,
        **kwargs,
    ):
        """
        Execute a registered tool.
        """
        return ToolManager.execute(
            tool_name,
            **kwargs,
        )

    def _build_messages(
        self,
        context: str,
    ) -> list[dict]:

        return [
            {
                "role": "system",
                "content": self._build_system_prompt(),
            },
            {
                "role": "user",
                "content": context,
            },
        ]

    def _parse_response(
        self,
        content: str,
    ) -> BaseModel:

        data = JSONParser.parse(
            content
        )

        schema = self.get_output_schema()

        data = SchemaNormalizer.normalize(
            data,
            schema,
        )

        return schema(**data)

    def _build_system_prompt(
        self,
    ) -> str:
        """
        Builds the final system prompt by combining the
        agent instructions with structured output guidance.
        """

        example = self.get_output_example()

        return f"""
{self.get_system_prompt()}
--------------------------------------------------
Return ONLY valid JSON.
Do NOT return markdown.
Do NOT wrap the JSON inside ```.
The JSON MUST follow this example structure:

{example}
"""

    def _generate(
        self,
        state: AgentState,
    ):

        self._current_state = state

        self.before_run(
            state
        )

        self.timer.start()

        self.validate(
            state
        )

        try:

            result = self.execute(
                state
            )

        except Exception:

            duration = self.timer.stop()

            self.context.duration_ms = duration

            self.context.finished_at = (
                datetime.now(
                    timezone.utc
                )
            )

            raise

        duration = self.timer.stop()

        self.context.duration_ms = duration

        self.context.finished_at = (
            datetime.now(
                timezone.utc
            )
        )

        self.after_run(
            state,
            result,
        )

        return self._update_state(
            state,
            result,
        )

    async def _agenerate(
        self,
        state,
    ):

        self.before_run(
            state
        )

        self.timer.start()

        self.validate(
            state
        )

        try:

            result = await self.aexecute(
                state
            )

        except Exception:

            duration = self.timer.stop()

            self.context.duration_ms = duration

            self.context.finished_at = (
                datetime.now(
                    timezone.utc
                )
            )

            raise

        duration = self.timer.stop()

        self.context.duration_ms = duration

        self.context.finished_at = (
            datetime.now(
                timezone.utc
            )
        )

        self.after_run(
            state,
            result,
        )

        return self._update_state(
            state,
            result,
        )

    def invoke(
        self,
        state: AgentState,
    ):
        return self._generate(state)

    async def ainvoke(
        self,
        state: AgentState,
    ):
        return await self._agenerate(state)

    def get_execution_time(
        self,
    ) -> float:
        return self.context.duration_ms

    def get_execution_context(
        self,
    ):
        return self.context

    def _require(
        self,
        state: AgentState,
        *keys: str,
    ) -> None:

        missing = [
            key
            for key in keys
            if state.get(key) is None
        ]

        if missing:

            raise ValueError(
                "Missing required state keys: "
                + ", ".join(missing)
            )