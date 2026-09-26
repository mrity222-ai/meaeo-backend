from app.security.oauth.base import OAuthProvider


class OAuthRegistry:

    def __init__(self):

        self._providers: dict[
            str,
            OAuthProvider,
        ] = {}

    def register(
        self,
        provider: OAuthProvider,
    ) -> None:

        name = (
            provider.provider_name
            .strip()
            .lower()
        )

        if not name:
            raise ValueError(
                "OAuth provider name cannot be empty."
            )

        self._providers[name] = provider

    def get(
        self,
        platform: str,
    ) -> OAuthProvider:

        name = platform.lower()

        if name not in self._providers:
            raise ValueError(
                f"Unknown OAuth provider: {name}"
            )

        return self._providers[name]

    def exists(
        self,
        platform: str,
    ) -> bool:

        return (
            platform.lower()
            in self._providers
        )

    def all(
        self,
    ) -> dict[str, OAuthProvider]:

        return dict(
            self._providers
        )