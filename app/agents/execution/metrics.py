from dataclasses import dataclass


@dataclass(slots=True)
class ExecutionMetrics:
    """
    Execution statistics collected for one
    agent invocation.
    """

    duration_ms: float = 0.0
    provider: str | None = None
    model: str | None = None
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    tool_calls: int = 0
    retries: int = 0
    cache_hit: bool = False