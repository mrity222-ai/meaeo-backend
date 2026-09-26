from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass(slots=True)
class AgentExecutionContext:

    """
    Runtime information shared across
    a single agent execution.
    """

    agent_name: str

    started_at: datetime = field(
        default_factory=lambda: datetime.now(
            timezone.utc
        )
    )

    finished_at: datetime | None = None
    duration_ms: float = 0.0
    retries: int = 0
    warnings: list[str] = field(
        default_factory=list
    )
    tool_calls: list[str] = field(
        default_factory=list
    )
    model_name: str | None = None
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0