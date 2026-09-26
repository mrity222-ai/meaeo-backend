import re


class JSONCleaner:

    @staticmethod
    def clean(
        text: str,
    ) -> str:

        if not text:
            return ""

        text = text.strip()
        # Remove markdown fences
        text = re.sub(
            r"^```(?:json)?",
            "",
            text,
            flags=re.IGNORECASE,
        )
        text = re.sub(
            r"```$",
            "",
            text,
        )

        return text.strip()