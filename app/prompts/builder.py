import json
from typing import Any


class PromptBuilder:

    def __init__(self):

        self._sections: list[str] = []

    def section(
        self,
        title: str,
        content: Any,
    ) -> "PromptBuilder":

        if content is None:
            return self

        if hasattr(
            content,
            "model_dump_json",
        ):

            content = content.model_dump_json(
                indent=2,
            )

        elif isinstance(
            content,
            (dict, list),
        ):

            content = json.dumps(
                content,
                indent=2,
                ensure_ascii=False,
            )

        else:

            content = str(content)

        content = content.strip()

        if not content:
            return self

        self._sections.append(
            f"""
# {title}

{content}
""".strip()
        )

        return self

    def items(
        self,
        title: str,
        items: list[str],
    ) -> "PromptBuilder":

        if not items:
            return self

        return self.section(
            title,
            "\n".join(
                f"- {item}"
                for item in items
            ),
        )

    def instruction(
        self,
        text: str,
    ) -> "PromptBuilder":

        return self.section(
            "Instructions",
            text,
        )

    def build(self) -> str:

        return "\n\n".join(
            self._sections
        )

    def schema(
        self,
        title: str,
        schema: type,
    ) -> "PromptBuilder":

        if hasattr(schema, "model_json_schema"):

            return self.section(
                title,
                schema.model_json_schema(),
            )

        return self

    def task(
        self,
        text: str,
    ) -> "PromptBuilder":

        return self.section(
            "Task",
            text,
        )