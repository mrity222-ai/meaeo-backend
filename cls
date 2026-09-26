from datetime import date, time

from app.publishers.factory import (
    PublisherFactory,
)
from app.publishers.manager import (
    PublishManager,
)
from app.publishers.registry import (
    PublisherRegistry,
)
from app.publishers.providers.mock import (
    MockPublisherProvider,
)
from app.schemas.schedule import (
    ScheduledPost,
    PublishingSchedule,
)


def build_schedule():
    return PublishingSchedule(
        campaign_name="Routing Test",
        timezone="Asia/Kolkata",
        posts=[
            ScheduledPost(
                day=1,
                publish_date=date.today(),
                publish_time=time(
                    10,
                    0,
                ),
                platforms=[
                    "instagram",
                    "linkedin",
                    "google_business",
                ],
                title="Test Post",
                caption="Test caption",
                hashtags=[],
                image_path=(
                    "generated/test.png"
                ),
                call_to_action="Learn more",
            )
        ],
    )


def setup_providers():
    PublisherRegistry.clear()

    PublisherRegistry.register(
        MockPublisherProvider(
            "instagram"
        )
    )

    PublisherRegistry.register(
        MockPublisherProvider(
            "linkedin"
        )
    )

    PublisherRegistry.register(
        MockPublisherProvider(
            "google_business"
        )
    )


def test_registry_platform_lookup():
    setup_providers()

    assert (
        PublisherRegistry.exists(
            "instagram"
        )
    )

    assert (
        PublisherRegistry.exists(
            "linkedin"
        )
    )

    assert (
        PublisherRegistry.exists(
            "google_business"
        )
    )

    print(
        "Platform provider lookup: PASSED"
    )


def test_multi_platform_publish():
    setup_providers()

    manager = PublishManager()

    result = manager.publish(
        build_schedule()
    )

    assert len(
        result.posts
    ) == 3

    platforms = {
        post.platform
        for post in result.posts
    }

    assert "instagram" in platforms
    assert "linkedin" in platforms
    assert "google_business" in platforms

    assert (
        result.successful == 3
    )

    assert (
        result.failed == 0
    )

    print(
        "Multi-platform publishing: PASSED"
    )


def test_platform_provider_isolated():
    setup_providers()

    instagram = (
        PublisherFactory.get_provider(
            "instagram"
        )
    )

    linkedin = (
        PublisherFactory.get_provider(
            "linkedin"
        )
    )

    assert (
        instagram.provider_name
        == "instagram"
    )

    assert (
        linkedin.provider_name
        == "linkedin"
    )

    assert (
        instagram is not linkedin
    )

    print(
        "Platform provider isolation: PASSED"
    )


def main():
    test_registry_platform_lookup()
    test_multi_platform_publish()
    test_platform_provider_isolated()

    print()

    print(
        "PUBLISHER ROUTING TEST: PASSED"
    )


if __name__ == "__main__":
    main()