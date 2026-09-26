from abc import ABC, abstractmethod

from langgraph.graph import StateGraph

from app.graph.state import AgentState


class BaseGraph(ABC):

    def __init__(self):
        self.graph = StateGraph(AgentState)

    @abstractmethod
    def build(self):
        pass