from app.security.oauth.google_business import (
    GoogleBusinessOAuthProvider,
)
from app.security.oauth.linkedin import (
    LinkedInOAuthProvider,
)
from app.security.oauth.meta import (
    MetaOAuthProvider,
)
from app.security.oauth.mock import (
    MockOAuthProvider,
)
from app.security.oauth.registry import (
    OAuthRegistry,
)


def build_oauth_registry() -> OAuthRegistry:

    registry = OAuthRegistry()

    registry.register(
        MockOAuthProvider()
    )

    registry.register(
        MetaOAuthProvider()
    )

    registry.register(
        GoogleBusinessOAuthProvider()
    )

    registry.register(
        LinkedInOAuthProvider()
    )

    return registry