from app.database.session import SessionLocal
from app.publishers.asset_preparation import (
    AssetPreparationService,
)
from app.publishers.factory import PublisherFactory
from app.schemas.publishing import PublishingResult
from app.schemas.schedule import PublishingSchedule
from app.services.campaign_post_publication_service import (
    CampaignPostPublicationService,
)


class PublishManager:

    def __init__(self):
        pass

    def publish(
        self,
        schedule: PublishingSchedule,
    ) -> PublishingResult:

        db = SessionLocal()

        try:

            schedule = (
                AssetPreparationService(db)
                .prepare_schedule(schedule)
            )

            publication_service = (
                CampaignPostPublicationService(db)
            )

            results = []

            for post in schedule.posts:

                for platform in post.platforms:

                    provider = (
                        PublisherFactory
                        .get_provider(platform)
                    )

                    platform_schedule = (
                        self._single_post_schedule(
                            schedule,
                            post,
                            platform,
                        )
                    )

                    publication = None

                    if (
                        schedule.tenant_id
                        and post.campaign_post_id
                        and post.business_channel_id
                    ):

                        publication = (
                            publication_service
                            .get_or_create(
                                tenant_id=(
                                    schedule.tenant_id
                                ),
                                campaign_post_id=(
                                    post.campaign_post_id
                                ),
                                business_channel_id=(
                                    post.business_channel_id
                                ),
                                platform=platform,
                            )
                        )

                        if (
                            publication.status
                            == "published"
                        ):
                            continue

                        if (
                            publication.status
                            == "reconciliation_required"
                        ):
                            continue

                        publication = (
                            publication_service
                            .mark_processing(
                                publication
                            )
                        )

                    result = provider.publish(
                        platform_schedule
                    )

                    for published_post in result.posts:

                        results.append(
                            published_post
                        )

                        if publication is None:
                            continue

                        if (
                            publication_service
                            .result_is_successful(
                                published_post
                            )
                        ):
                            publication_service.mark_published(
                                publication,
                                published_post.external_id,
                            )

                        else:
                            publication_service.mark_failed(
                                publication,
                                publication_service.result_error(
                                    published_post
                                ),
                            )

            successful = sum(
                1
                for post in results
                if post.status
                in {
                    "published",
                    "scheduled",
                    "success",
                }
            )

            failed = (
                len(results) - successful
            )

            return PublishingResult(
                posts=results,
                successful=successful,
                failed=failed,
                provider="multi",
            )

        finally:
            db.close()

    async def apublish(
        self,
        schedule: PublishingSchedule,
    ) -> PublishingResult:

        db = SessionLocal()

        try:

            schedule = (
                AssetPreparationService(db)
                .prepare_schedule(schedule)
            )

            publication_service = (
                CampaignPostPublicationService(db)
            )

            results = []

            for post in schedule.posts:

                for platform in post.platforms:

                    provider = (
                        PublisherFactory
                        .get_provider(platform)
                    )

                    platform_schedule = (
                        self._single_post_schedule(
                            schedule,
                            post,
                            platform,
                        )
                    )

                    publication = None

                    if (
                        schedule.tenant_id
                        and post.campaign_post_id
                        and post.business_channel_id
                    ):

                        publication = (
                            publication_service
                            .get_or_create(
                                tenant_id=(
                                    schedule.tenant_id
                                ),
                                campaign_post_id=(
                                    post.campaign_post_id
                                ),
                                business_channel_id=(
                                    post.business_channel_id
                                ),
                                platform=platform,
                            )
                        )

                        if (
                            publication.status
                            == "published"
                        ):
                            continue

                        if (
                            publication.status
                            == "reconciliation_required"
                        ):
                            continue

                        publication = (
                            publication_service
                            .mark_processing(
                                publication
                            )
                        )

                    result = await provider.apublish(
                        platform_schedule
                    )

                    for published_post in result.posts:

                        results.append(
                            published_post
                        )

                        if publication is None:
                            continue

                        if (
                            publication_service
                            .result_is_successful(
                                published_post
                            )
                        ):
                            publication_service.mark_published(
                                publication,
                                published_post.external_id,
                            )

                        else:
                            publication_service.mark_failed(
                                publication,
                                publication_service.result_error(
                                    published_post
                                ),
                            )

            successful = sum(
                1
                for post in results
                if post.status
                in {
                    "published",
                    "scheduled",
                    "success",
                }
            )

            failed = (
                len(results) - successful
            )

            return PublishingResult(
                posts=results,
                successful=successful,
                failed=failed,
                provider="multi",
            )

        finally:
            db.close()

    @staticmethod
    def _single_post_schedule(
        schedule: PublishingSchedule,
        post,
        platform: str,
    ) -> PublishingSchedule:

        platform_post = post.model_copy(
            update={
                "platforms": [platform],
            }
        )

        return PublishingSchedule(
            campaign_name=schedule.campaign_name,
            tenant_id=schedule.tenant_id,
            business_account_id=(
                schedule.business_account_id
            ),
            timezone=schedule.timezone,
            posts=[platform_post],
        )