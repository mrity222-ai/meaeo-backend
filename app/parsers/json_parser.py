import json


class JSONParser:

    @staticmethod
    def parse(text: str):

        text = text.strip()

        # Remove markdown fences
        if text.startswith("```"):
            text = text.replace("```json", "")
            text = text.replace("```", "")
            text = text.strip()

        if (
            len(text) >= 2
            and text[0] == text[-1]
            and text[0] in ("'", '"')
        ):
            text = text[1:-1]

        return json.loads(text)