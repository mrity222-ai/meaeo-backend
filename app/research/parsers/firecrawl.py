from app.research.schemas import (
    BusinessResearch,
)


class FirecrawlParser:

    def parse(
        self,
        response: dict,
    ) -> BusinessResearch:

        data = response.get(
            "data",
            {}
        )

        markdown = data.get(
            "markdown",
            ""
        )

        return BusinessResearch(
            summary=markdown,
            services=[],
            products=[],
            audience=[],
            usp="",
            faqs=[],
        )