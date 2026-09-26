from enum import Enum

from pydantic import BaseModel, Field


class ImageSourceMode(str, Enum):
    """
    Defines where the campaign image comes from.
    """

    ORIGINAL = "original"
    CATALOGUE = "catalogue"
    AI = "ai"
    BOTH = "both"


class OverlayTarget(str, Enum):
    """
    Defines which generated/source images should receive
    branding or overlay processing.
    """

    NONE = "none"
    ORIGINAL = "original"
    CATALOGUE = "catalogue"
    AI = "ai"
    BOTH = "both"


class ImageStrategy(BaseModel):
    """
    Campaign-level image strategy.

    source_mode determines which image sources are used.

    overlay_target determines which source images receive
    branding/overlay processing.
    """

    source_mode: ImageSourceMode = ImageSourceMode.AI

    overlay_target: OverlayTarget = OverlayTarget.NONE

    def requires_ai_generation(
        self,
    ) -> bool:
        return self.source_mode in (
            ImageSourceMode.AI,
            ImageSourceMode.BOTH,
        )

    def uses_original(
        self,
    ) -> bool:
        return self.source_mode in (
            ImageSourceMode.ORIGINAL,
        )

    def uses_catalogue(
        self,
    ) -> bool:
        return self.source_mode in (
            ImageSourceMode.CATALOGUE,
            ImageSourceMode.BOTH,
        )

    def requires_overlay(
        self,
    ) -> bool:
        return self.overlay_target != OverlayTarget.NONE

    def overlay_for_source(
        self,
        source: ImageSourceMode,
    ) -> bool:
        if self.overlay_target == OverlayTarget.NONE:
            return False

        if self.overlay_target == OverlayTarget.BOTH:
            return True

        if (
            self.overlay_target == OverlayTarget.ORIGINAL
            and source == ImageSourceMode.ORIGINAL
        ):
            return True

        if (
            self.overlay_target == OverlayTarget.CATALOGUE
            and source == ImageSourceMode.CATALOGUE
        ):
            return True

        if (
            self.overlay_target == OverlayTarget.AI
            and source == ImageSourceMode.AI
        ):
            return True

        return False


class ImageRequest(BaseModel):
    """
    Resolved image request for a single campaign post.
    """

    day: int
    title: str
    source: ImageSourceMode
    overlay: bool = False
    source_path: str | None = None
    image_prompt: str | None = None
    metadata: dict = Field(
        default_factory=dict
    )


class GeneratedImage(BaseModel):
    """
    Final normalized image result.

    The image may originate from an original,
    catalogue asset, or AI generation.
    """

    day: int
    title: str
    source: ImageSourceMode = ImageSourceMode.AI
    image_prompt: str = ""
    image_path: str

    asset_id: str | None = None

    template_used: str = ""
    logo_used: str = ""
    product_used: str = ""
    visual_theme: str = ""
    overlay_applied: bool = False
    metadata: dict = Field(
        default_factory=dict
    )


class ImagePlan(BaseModel):
    """
    Final image plan consumed by the scheduler.
    """

    strategy: ImageStrategy | None = None
    images: list[GeneratedImage] = Field(
        default_factory=list
    )