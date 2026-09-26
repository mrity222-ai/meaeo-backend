from dataclasses import dataclass, field
from typing import Any

from app.agents.execution.metrics import ExecutionMetrics


@dataclass(slots=True)
class AgentExecutionResult:
    """
    Represents the complete result of a single
    agent execution.
    """

    output: Any = None
    warnings: list[str] = field(
        default_factory=list
    )
    errors: list[str] = field(
        default_factory=list
    )
    metrics: ExecutionMetrics = field(
        default_factory=ExecutionMetrics
    )
    tool_calls: list[str] = field(
        default_factory=list
    )
    success: bool = True