from app.agents.execution.result import (
    AgentExecutionResult,
)
from app.graph.state import AgentState


class StateUpdater:
    """
    Responsible for merging an execution
    result back into the workflow state.
    """

    @staticmethod
    def update(
        state: AgentState,
        state_key: str,
        result: AgentExecutionResult,
    ) -> AgentState:

        StateUpdater._update_output(
            state,
            state_key,
            result,
        )
        StateUpdater._update_warnings(
            state,
            result,
        )
        StateUpdater._update_errors(
            state,
            result,
        )
        StateUpdater._update_status(
            state,
            result,
        )
        return state

    @staticmethod
    def _update_output(
        state: AgentState,
        state_key: str,
        result: AgentExecutionResult,
    ):
        state[state_key] = result.output

    @staticmethod
    def _update_warnings(
        state: AgentState,
        result: AgentExecutionResult,
    ):
        if not result.warnings:
            return

        state.setdefault(
            "warnings",
            [],
        ).extend(
            result.warnings
        )

    @staticmethod
    def _update_errors(
        state: AgentState,
        result: AgentExecutionResult,
    ):
        if not result.errors:
            return

        state.setdefault(
            "errors",
            [],
        ).extend(
            result.errors
        )

    @staticmethod
    def _update_status(
        state: AgentState,
        result: AgentExecutionResult,
    ):
        state["status"] = (
            "success"
            if result.success
            else "failed"
        )