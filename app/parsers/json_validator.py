import json


class JSONValidator:

    @staticmethod
    def is_json(
        text: str,
    ) -> bool:

        if not text:
            return False

        try:
            json.loads(text.strip())
            return True
        except (json.JSONDecodeError, TypeError):
            return False