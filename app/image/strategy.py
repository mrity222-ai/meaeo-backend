from app.schemas.image import (
    ImageRequest,
    ImageSourceMode,
    ImageStrategy,
)


class ImageStrategyResolver:
    """
    Resolves a campaign-level ImageStrategy into
    one or more concrete ImageRequest objects.
    """

    def resolve(
        self,
        strategy: ImageStrategy,
        post,
        *,
        source_path: str | None = None,
    ) -> list[ImageRequest]:

        requests: list[ImageRequest] = []

        if strategy.source_mode == ImageSourceMode.ORIGINAL:
            requests.append(
                self._build_request(
                    post=post,
                    source=ImageSourceMode.ORIGINAL,
                    strategy=strategy,
                    source_path=source_path,
                )
            )

        elif strategy.source_mode == ImageSourceMode.CATALOGUE:
            requests.append(
                self._build_request(
                    post=post,
                    source=ImageSourceMode.CATALOGUE,
                    strategy=strategy,
                    source_path=source_path,
                )
            )

        elif strategy.source_mode == ImageSourceMode.AI:
            requests.append(
                self._build_request(
                    post=post,
                    source=ImageSourceMode.AI,
                    strategy=strategy,
                )
            )

        elif strategy.source_mode == ImageSourceMode.BOTH:
            requests.append(
                self._build_request(
                    post=post,
                    source=ImageSourceMode.CATALOGUE,
                    strategy=strategy,
                    source_path=source_path,
                )
            )

            requests.append(
                self._build_request(
                    post=post,
                    source=ImageSourceMode.AI,
                    strategy=strategy,
                )
            )

        else:
            raise ValueError(
                f"Unsupported image source: "
                f"{strategy.source_mode}"
            )

        return requests

    def _build_request(
        self,
        *,
        post,
        source: ImageSourceMode,
        strategy: ImageStrategy,
        source_path: str | None = None,
    ) -> ImageRequest:

        overlay = strategy.overlay_for_source(source)

        if source == ImageSourceMode.AI:
            image_prompt = getattr(
                post,
                "image_prompt",
                None,
            )
            resolved_source_path = None

        else:
            image_prompt = None
            resolved_source_path = source_path

        return ImageRequest(
            day=post.day,
            title=post.title,
            source=source,
            overlay=overlay,
            source_path=resolved_source_path,
            image_prompt=image_prompt,
        )