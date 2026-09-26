from app.research.context import ResearchContext
from app.research.result import ResearchResult
from app.research.schemas import SearchDocument


class ResearchContextBuilder:

    @staticmethod
    def build(
        results: list[ResearchResult],
    ) -> ResearchContext:

        context = ResearchContext()
        for result in results:

            if result.business:
                context.business = result.business
                context.citations.append(
                    SearchDocument(
                        title=result.business.title,
                        url=result.business.website
                    )
                )

            if result.industry:
                context.industry = result.industry
                context.citations.extend(
                    result.industry.references
                )

            if result.seo:
                context.seo = result.seo

            if result.trends:
                context.trends = result.trends

            if result.audience:
                context.audience = result.audience

            if result.reviews:
                context.reviews = result.reviews

            if result.success:

                context.providers.append(
                    result.provider
                )

            else:

                context.failed_providers.append(
                    result.provider
                )
            if not result.errors:
                context.successful_providers.append(
                    result.provider
                )

            context.errors.extend(
                result.errors
            )
        return context