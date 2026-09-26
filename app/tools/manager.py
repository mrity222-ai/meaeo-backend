from app.tools.registry import ToolRegistry


class ToolManager:

    @staticmethod
    def execute(
        tool_name: str,
        **kwargs,
    ):

        tool = ToolRegistry.get(tool_name)

        if tool is None:
            raise ValueError(
                f"Tool '{tool_name}' is not registered."
            )

        return tool.execute(**kwargs)

    @staticmethod
    async def aexecute(
        tool_name: str,
        **kwargs,
    ):

        tool = ToolRegistry.get(tool_name)

        if tool is None:
            raise ValueError(
                f"Tool '{tool_name}' is not registered."
            )

        return await tool.aexecute(**kwargs)