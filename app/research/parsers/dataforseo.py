import logging

from app.research.schemas import SeoResearch, TrendResearch

logger = logging.getLogger(__name__)


class DataForSEOParser:

    def parse_seo(
        self,
        search_volume: dict,
        search_intent: dict,
    ) -> SeoResearch:

        seo = SeoResearch()

        try:
            tasks = search_volume.get(
                "tasks",
                [],
            )

            if tasks:
                results = (
                    tasks[0]
                    .get("result", [])
                )

                for keyword in results:
                    value = keyword.get(
                        "keyword"
                    )
                    if value:
                        seo.primary_keywords.append(
                            value
                        )

        except (AttributeError, IndexError, TypeError) as exc:
            logger.warning(
                "failed to parse DataForSeo search volume response: %s",
                exc
            )

        try:
            tasks = search_intent.get(
                "tasks",
                [],
            )

            if tasks:
                results = (
                    tasks[0]
                    .get("result", [])
                )

                for item in results:
                    keyword = item.get(
                        "keyword"
                    )
                    intent = item.get(
                        "search_intent"
                    )

                    if intent:
                        seo.search_intent.append(
                            f"{keyword}: {intent}"
                        )

        except (AttributeError, IndexError, TypeError) as exc:
            logger.warning(
                "Failed to parse DataForSEO search intent response: %s",
                exc,
            )
        return seo

    def parse_trends(
        self,
        response: dict,
    ) -> TrendResearch:

        trends = TrendResearch()

        try:
            tasks = response.get(
                "tasks",
                [],
            )

            if tasks:
                results = (
                    tasks[0]
                    .get("result", [])
                )

                for item in results:
                    keyword = item.get(
                        "keyword"
                    )

                    if keyword:
                        trends.trending_topics.append(
                            keyword
                        )

        except (AttributeError, IndexError, TypeError) as exc:
            logger.warning(
                "Failed to parse DataForSEO trends response: %s",
                exc,
            )
        return trends

    def parse_keyword_results(
        self,
        search_volume: dict,
        search_intent: dict,
        trends: dict,
    ) -> dict[str, dict]:
        """
        Convert DataForSEO responses into
        normalized per-keyword records.
        """

        results = {}

        volume_tasks = search_volume.get(
            "tasks",
            [],
        )

        if volume_tasks:

            volume_results = (
                volume_tasks[0].get(
                    "result",
                    [],
                )
            )

            for item in volume_results:

                keyword = item.get(
                    "keyword"
                )

                if not keyword:
                    continue

                results.setdefault(
                    keyword,
                    {},
                )

                results[keyword][
                    "search_volume"
                ] = item

        intent_tasks = search_intent.get(
            "tasks",
            [],
        )

        if intent_tasks:

            intent_results = (
                intent_tasks[0].get(
                    "result",
                    [],
                )
            )

            for item in intent_results:

                keyword = item.get(
                    "keyword"
                )

                if not keyword:
                    continue

                results.setdefault(
                    keyword,
                    {},
                )

                results[keyword][
                    "search_intent"
                ] = item

        trend_tasks = trends.get(
            "tasks",
            [],
        )

        if trend_tasks:

            trend_results = (
                trend_tasks[0].get(
                    "result",
                    [],
                )
            )

            for item in trend_results:

                keyword = item.get(
                    "keyword"
                )

                if not keyword:
                    continue

                results.setdefault(
                    keyword,
                    {},
                )

                results[keyword][
                    "trend"
                ] = item

        return results

    def build_seo_research(
        self,
        results: dict[str, dict],
    ) -> SeoResearch:

        seo = SeoResearch()

        for keyword, data in results.items():

            if keyword not in seo.primary_keywords:
                seo.primary_keywords.append(
                    keyword
                )

            intent = data.get(
                "search_intent",
                {},
            ).get(
                "search_intent"
            )

            if intent:
                seo.search_intent.append(
                    f"{keyword}: {intent}"
                )

        return seo

    def build_trend_research(
        self,
        results: dict[str, dict],
    ) -> TrendResearch:

        trends = TrendResearch()

        for keyword, data in results.items():

            trend = data.get(
                "trend"
            )

            if trend is not None:

                trends.trending_topics.append(
                    keyword
                )

        return trends