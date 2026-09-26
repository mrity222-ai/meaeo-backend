import secrets


class OAuthStateManager:

    @staticmethod
    def generate() -> str:

        return secrets.token_urlsafe(
            32
        )

    @staticmethod
    def validate(
        expected: str,
        received: str,
    ) -> bool:

        return secrets.compare_digest(
            expected,
            received,
        )