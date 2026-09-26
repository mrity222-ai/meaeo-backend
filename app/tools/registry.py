from typing import ClassVar


class ToolRegistry:

    _registry: ClassVar[dict] = {}

    @classmethod
    def register(cls, name, tool):
        cls._registry[name] = tool