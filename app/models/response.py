from typing import Any


class ModelResponse:

    @staticmethod
    def content(
        response: Any,
    ) -> str:

        if hasattr(
            response,
            "choices",
        ):
            return response.choices[0].message.content

        if hasattr(
            response,
            "text",
        ):
            return response.text

        if hasattr(
            response,
            "message",
        ):
            return response.message.content

        raise ValueError(
            "Unsupported model response."
        )