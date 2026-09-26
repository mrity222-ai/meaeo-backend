import asyncio

from app.research.context import ResearchContext
from app.research.context_builder import ResearchContextBuilder
from app.research.registry import ResearchRegistry
from app.research.result import ResearchResult


class ResearchManager:

    @classmethod
    def collect(
        cls,
        state,
    ) -> ResearchContext:

        results = []

        for provider in ResearchRegistry.providers():

            try:

                result = provider.collect(
                    state
                )

                results.append(
                    result
                )

            except Exception as exc:

                results.append(
                    ResearchResult(
                        provider=(
                            provider.provider_name
                        ),
                        success=False,
                        errors=[
                            (
                                f"{provider.provider_name} "
                                f"failed: {exc}"
                            )
                        ],
                    )
                )

        return ResearchContextBuilder.build(
            results
        )

    @classmethod
    async def acollect(
        cls,
        state,
    ) -> ResearchContext:

        async def collect_provider(
            provider,
        ) -> ResearchResult:

            try:

                return await provider.acollect(
                    state
                )

            except Exception as exc:

                return ResearchResult(
                    provider=(
                        provider.provider_name
                    ),
                    success=False,
                    errors=[
                        (
                            f"{provider.provider_name} "
                            f"failed: {exc}"
                        )
                    ],
                )

        results = await asyncio.gather(
            *[
                collect_provider(provider)
                for provider
                in ResearchRegistry.providers()
            ]
        )

        return ResearchContextBuilder.build(
            results
        )