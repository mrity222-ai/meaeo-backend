from datetime import datetime

from app.publishers.base import (
    BasePublisherProvider,
)
from app.schemas.publishing import (
    PublishedPost,
    PublishingResult,
)
from app.schemas.schedule import (
    PublishingSchedule,
)


class MockPublisherProvider(
    BasePublisherProvider
):

    def __init__(
        self,
        name: str = "mock",
    ):

        self._provider_name = (
            name.strip().lower()
        )

    @property
    def provider_name(self) -> str:

        return self._provider_name

    def publish(
        self,
        schedule: PublishingSchedule,
    ) -> PublishingResult:

        posts = []

        for post in schedule.posts:

            for platform in post.platforms:

                posts.append(
                    PublishedPost(
                        day=post.day,
                        platform=platform,
                        title=post.title,
                        status="scheduled",
                        external_id=(
                            f"{self.provider_name}"
                            f"_{platform}"
                            f"_{post.day}"
                        ),
                        scheduled_for=(
                            datetime.combine(
                                post.publish_date,
                                post.publish_time,
                            )
                        ),
                        image_path=(
                            post.image_path
                        ),
                        image_source=(
                            post.image_source
                        ),
                    )
                                    )

        return PublishingResult(
            posts=posts,
            successful=len(posts),
            failed=0,
            provider=self.provider_name,
        )