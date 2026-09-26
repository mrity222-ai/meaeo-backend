from pathlib import Path

from app.agents.task import BaseTaskAgent
from app.graph.state import AgentState
from app.image.catalogue_selector import (
    CatalogueSelector,
)
from app.image.generation_manager import (
    ImageGenerationManager,
)
from app.image.manager import ImageManager
from app.image.overlay import (
    ImageOverlayProcessor,
)
from app.image.schemas import PreparedImage
from app.image.strategy import (
    ImageStrategyResolver,
)
from app.models.config import settings
from app.schemas.content import ContentPlan
from app.schemas.image import (
    GeneratedImage,
    ImagePlan,
    ImageRequest,
    ImageSourceMode,
    ImageStrategy,
)


class ImageGeneratorAgent(BaseTaskAgent):

    def __init__(self):

        self.image_manager = ImageManager()
        self.image_provider_manager = (
            ImageGenerationManager()
        )
        self.strategy_resolver = (
            ImageStrategyResolver()
        )
        self.catalogue_selector = (
            CatalogueSelector()
        )
        self.overlay_processor = (
            ImageOverlayProcessor()
        )


    def invoke(
        self,
        state: AgentState,
    ) -> AgentState:

        self._require(
            state,
            "content",
        )

        content_plan = state["content"]
        strategy = self._get_strategy(
            state
        )

        image_plan = self._generate_images(
            state,
            content_plan,
            strategy,
        )
        state[
            self.get_state_key()
        ] = image_plan
        return state

    async def ainvoke(
        self,
        state: AgentState,
    ) -> AgentState:

        self._require(
            state,
            "content",
        )

        content_plan = state["content"]
        strategy = self._get_strategy(
            state
        )
        image_plan = await (
            self._agenerate_images(
                state,
                content_plan,
                strategy,
            )
        )

        state[
            self.get_state_key()
        ] = image_plan
        return state

    def _get_strategy(
        self,
        state: AgentState,
    ) -> ImageStrategy:

        strategy = state.get(
            "image_strategy"
        )

        if strategy is None:
            return ImageStrategy()
        if not isinstance(
            strategy,
            ImageStrategy,
        ):
            raise TypeError(
                "image_strategy must be "
                "an ImageStrategy instance."
            )
        return strategy


    def _generate_images(
        self,
        state: AgentState,
        content_plan: ContentPlan,
        strategy: ImageStrategy,
    ) -> ImagePlan:

        images = []
        requested = 0
        failed = 0

        for post in content_plan.posts:

            requests = (
                self.strategy_resolver.resolve(
                    strategy,
                    post,
                    source_path=(
                        self._get_source_path(
                            state,
                            post,
                            strategy,
                        )
                    ),
                )
            )

            for request in requests:

                requested += 1

                try:

                    image = self._execute_request(
                        state,
                        post,
                        request,
                    )

                    images.append(image)

                except Exception as exc:

                    failed += 1

                    state.setdefault(
                        "errors",
                        [],
                    ).append(
                        f"Day {post.day}: {exc}"
                    )

        self._finalize_generation_status(
            state,
            requested=requested,
            successful=len(images),
            failed=failed,
        )

        return ImagePlan(
            strategy=strategy,
            images=images,
        )
    
    async def _agenerate_images(
        self,
        state: AgentState,
        content_plan: ContentPlan,
        strategy: ImageStrategy,
    ) -> ImagePlan:

        images = []
        requested = 0
        failed = 0

        for post in content_plan.posts:

            requests = (
                self.strategy_resolver.resolve(
                    strategy,
                    post,
                    source_path=(
                        self._get_source_path(
                            state,
                            post,
                            strategy,
                        )
                    ),
                )
            )

            for request in requests:

                requested += 1

                try:

                    image = (
                        await self._aexecute_request(
                            state,
                            post,
                            request,
                        )
                    )

                    images.append(image)

                except Exception as exc:  # noqa: BLE001

                    failed += 1

                    state.setdefault(
                        "errors",
                        [],
                    ).append(
                        f"Day {post.day}: {exc}"
                    )

        self._finalize_generation_status(
            state,
            requested=requested,
            successful=len(images),
            failed=failed,
        )
        
        return ImagePlan(
            strategy=strategy,
            images=images,
        )

    def _finalize_generation_status(
        self,
        state: AgentState,
        *,
        requested: int,
        successful: int,
        failed: int,
    ) -> None:

        if requested == 0:
            state["status"] = "failed"

            state.setdefault(
                "errors",
                [],
            ).append(
                "Image generation produced "
                "no image requests."
            )

            return

        if failed == 0:
            state["status"] = "success"
            return

        if successful == 0:
            state["status"] = "failed"
            return

        state["status"] = "success"

        state.setdefault(
            "warnings",
            [],
        ).append(
            "Image generation partially failed: "
            f"{successful}/{requested} images generated."
        )

    def _execute_request(
        self,
        state: AgentState,
        post,
        request: ImageRequest,
    ) -> GeneratedImage:

        if request.source == ImageSourceMode.ORIGINAL:
            image = self._build_source_image(
                post,
                request,
            )

        elif request.source == ImageSourceMode.CATALOGUE:
            image = self._build_source_image(
                post,
                request,
            )

        elif request.source == ImageSourceMode.AI:
            image = self._generate_ai_image(
                state,
                post,
                request,
            )

        else:
            raise ValueError(
                f"Unsupported image source: "
                f"{request.source}"
            )

        return self._apply_overlay_if_required(
            state,
            post,
            request,
            image,
        )

    async def _aexecute_request(
        self,
        state: AgentState,
        post,
        request: ImageRequest,
    ) -> GeneratedImage:

        if request.source == ImageSourceMode.ORIGINAL:
            image = self._build_source_image(
                post,
                request,
            )

        elif request.source == ImageSourceMode.CATALOGUE:
            image = self._build_source_image(
                post,
                request,
            )

        elif request.source == ImageSourceMode.AI:
            image = await self._agenerate_ai_image(
                state,
                post,
                request,
            )

        else:
            raise ValueError(
                f"Unsupported image source: "
                f"{request.source}"
            )

        return self._apply_overlay_if_required(
            state,
            post,
            request,
            image,
        )

    def _apply_overlay_if_required(
        self,
        state: AgentState,
        post,
        request: ImageRequest,
        image: GeneratedImage,
    ) -> GeneratedImage:

        if not request.overlay:
            return image
        brand = state.get(
            "brand_profile"
        )
        if brand is None:
            raise ValueError(
                "brand_profile is required "
                "when image overlay is enabled."
            )
        source_path = Path(
            image.image_path
        )
        output_path = (
            self._build_overlay_output_path(
                post.day,
                request.source,
            )
        )
        logo_name = (
            request.metadata.get(
                "logo_name"
            )
            if request.metadata
            else None
        )
        result = (
            self.overlay_processor.apply(
                image_path=source_path,
                brand=brand,
                output_path=output_path,
                logo_name=logo_name,
            )
        )
        return image.model_copy(
            update={
                "image_path": (
                    result.as_posix()
                ),
                "overlay_applied": True,
            }
        )


    def _build_source_image(
        self,
        post,
        request: ImageRequest,
    ) -> GeneratedImage:

        if not request.source_path:
            raise ValueError(
                f"No source image supplied "
                f"for day {post.day}."
            )

        source_path = Path(
            request.source_path
        )
        if not source_path.exists():
            raise FileNotFoundError(
                "Image source does not exist: "
                f"{source_path}"
            )

        return GeneratedImage(
            day=post.day,
            title=post.title,
            source=request.source,
            image_prompt="",
            image_path=(
                source_path.as_posix()
            ),
            overlay_applied=False,
        )

    def _generate_ai_image(
        self,
        state: AgentState,
        post,
        request: ImageRequest,
    ) -> GeneratedImage:

        output_path = (
            self._build_output_path(
                post.day
            )
        )

        brand = state.get(
            "brand_profile"
        )

        prepared = (
            self.image_manager.prepare(
                brand,
                post,
            )
        )

        image_result = (
            self.image_provider_manager.generate(
                prompt=prepared.prompt,
                output_path=output_path,
            )
        )

        return self._build_generated_image(
            post,
            image_result,
            prepared,
        )
    
    async def _agenerate_ai_image(
        self,
        state: AgentState,
        post,
        request: ImageRequest,
    ) -> GeneratedImage:

        output_path = (
            self._build_output_path(
                post.day
            )
        )

        brand = state.get(
            "brand_profile"
        )

        prepared = (
            self.image_manager.prepare(
                brand,
                post,
            )
        )

        image_result = await (
            self.image_provider_manager.agenerate(
                prompt=prepared.prompt,
                output_path=output_path,
            )
        )

        return self._build_generated_image(
            post,
            image_result,
            prepared,
        )

    def _get_source_path(
        self,
        state: AgentState,
        post,
        strategy: ImageStrategy,
    ) -> str | None:

        if strategy.source_mode == (
            ImageSourceMode.ORIGINAL
        ):
            original_path = (
                self._get_original_path(
                    state,
                    post,
                )
            )

            if original_path:
                return original_path

            return self._get_catalogue_path(
                state,
                post,
            )

        if strategy.source_mode == (
            ImageSourceMode.CATALOGUE
        ):
            return self._get_catalogue_path(
                state,
                post,
            )

        return None

    def _get_original_path(
        self,
        state: AgentState,
        post,
    ) -> str | None:
        paths = state.get(
            "original_images",
            {},
        )
        return paths.get(
            post.day
        )

    def _get_catalogue_path(
        self,
        state: AgentState,
        post,
    ) -> str:

        brand_name = (
            state.get(
                "brand_name"
            )
            or settings.DEFAULT_BRAND
        )
        filename = (
            self._get_catalogue_filename(
                state,
                post,
            )
        )
        if filename:
            return (
                self.catalogue_selector
                .select(
                    brand_name,
                    filename=filename,
                )
                .as_posix()
            )
        return (
            self.catalogue_selector
            .select(
                brand_name,
                index=post.day - 1,
            )
            .as_posix()
        )

    def _get_catalogue_filename(
        self,
        state: AgentState,
        post,
    ) -> str | None:

        catalogue_selection = (
            state.get(
                "catalogue_selection",
                {},
            )
        )
        return catalogue_selection.get(
            post.day
        )


    def _build_output_path(
        self,
        day: int,
    ) -> Path:

        return (
            Path(
                settings.IMAGE_OUTPUT_DIR
            )
            / f"day_{day}.png"
        )

    def _build_overlay_output_path(
        self,
        day: int,
        source: ImageSourceMode,
    ) -> Path:

        return (
            Path(
                settings.IMAGE_OUTPUT_DIR
            )
            / (
                f"day_{day}_"
                f"{source.value}_branded.png"
            )
        )



    def _build_generated_image(
        self,
        post,
        image_result,
        prepared: PreparedImage,
    ) -> GeneratedImage:

        return GeneratedImage(
            day=post.day,
            title=post.title,
            source=ImageSourceMode.AI,
            image_prompt=(
                prepared.prompt
            ),
            image_path=(
                image_result.image_path
                .as_posix()
            ),
            logo_used=(
                prepared.assets["logo"]
                or ""
            ),
            template_used=(
                prepared.assets["template"]
                or ""
            ),
            product_used=str(
                prepared.assets["product"]
                or ""
            ),
            visual_theme=(
                prepared.style["style"]
            ),
            overlay_applied=False,
        )


    def get_state_key(
        self,
    ) -> str:

        return "image_plan"