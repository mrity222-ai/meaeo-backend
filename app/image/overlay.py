from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

from app.schemas.brand import BrandProfile


class ImageOverlayProcessor:
    """
    Applies configurable brand identity information
    to an existing image.

    Logo and contact information are rendered as
    independent overlay elements.

    Supported positions:

        upper_left
        upper_middle
        upper_right
        lower_left
        lower_middle
        lower_right

    Legacy position names are also accepted:

        top_left
        top_right
        bottom_left
        bottom_right

    Defaults:

        logo          -> upper_right
        contact info  -> lower_right

    Compatibility:

        Logo and contact information are independently
        optional.

        At least one usable brand element must exist.
    """

    PADDING = 24

    LOGO_MAX_RATIO = 0.20

    TEXT_SPACING = 8

    PANEL_PADDING = 16

    PANEL_RADIUS = 12

    DEFAULT_LOGO_POSITION = "upper_right"

    DEFAULT_CONTACT_POSITION = "lower_right"

    def apply(
        self,
        image_path: str | Path,
        brand: BrandProfile,
        output_path: str | Path,
        *,
        logo_name: str | None = None,
    ) -> Path:

        source = Path(image_path)
        output = Path(output_path)

        if not source.exists():
            raise FileNotFoundError(
                f"Source image does not exist: "
                f"{source}"
            )

        # -------------------------------------------------
        # Resolve logo and contact information.
        #
        # Both are independently optional.
        # At least one usable brand element must exist.
        # -------------------------------------------------

        logo_path = self._resolve_logo(
            brand,
            logo_name,
        )

        text_lines = self._build_text_lines(
            brand
        )

        if logo_path is None and not text_lines:
            raise ValueError(
                "No brand information is "
                "available for overlay."
            )

        # -------------------------------------------------
        # Validate the configured logo only when one exists.
        # -------------------------------------------------

        logo_file = None

        if logo_path is not None:
            candidate = Path(logo_path)
            if candidate.exists() and candidate.is_file():
                logo_file = candidate
            else:
                # Search data/assets for the asset file
                import glob
                matches = glob.glob(f"data/assets/**/{candidate.name}*", recursive=True)
                if matches:
                    logo_file = Path(matches[0])
                else:
                    logo_file = None

        output.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        with Image.open(
            source
        ).convert("RGBA") as base:

            draw = ImageDraw.Draw(
                base,
                "RGBA",
            )

            # ---------------------------------------------
            # Fonts
            # ---------------------------------------------

            font = self._get_font(
                base.size
            )

            small_font = self._get_small_font(
                base.size
            )

            occupied_rectangles = []

            # ---------------------------------------------
            # LOGO OVERLAY
            #
            # Render only when a logo is available.
            # ---------------------------------------------

            if logo_file is not None:

                with Image.open(
                    logo_file
                ).convert("RGBA") as logo_image:

                    logo = self._resize_logo(
                        logo_image,
                        base.size,
                    )

                logo_panel = (
                    self._build_logo_panel(
                        draw=draw,
                        base_size=base.size,
                        logo=logo,
                        position=(
                            self._get_logo_position(
                                brand
                            )
                        ),
                        occupied_rectangles=(
                            occupied_rectangles
                        ),
                    )
                )

                panel_x, panel_y = (
                    logo_panel["position"]
                )

                panel_width = (
                    logo_panel["size"][0]
                )

                panel_height = (
                    logo_panel["size"][1]
                )

                draw.rounded_rectangle(
                    (
                        panel_x,
                        panel_y,
                        panel_x + panel_width,
                        panel_y + panel_height,
                    ),
                    radius=self.PANEL_RADIUS,
                    fill=(
                        0,
                        0,
                        0,
                        150,
                    ),
                )

                base.alpha_composite(
                    logo,
                    dest=(
                        panel_x
                        + self.PANEL_PADDING,
                        panel_y
                        + self.PANEL_PADDING,
                    ),
                )

                occupied_rectangles.append(
                    (
                        panel_x,
                        panel_y,
                        panel_x + panel_width,
                        panel_y + panel_height,
                    )
                )

            # ---------------------------------------------
            # CONTACT OVERLAY
            #
            # Contact information is independent from
            # logo placement and may be rendered alone.
            # ---------------------------------------------

            if text_lines:

                contact_panel = (
                    self._build_contact_panel(
                        draw=draw,
                        base_size=base.size,
                        text_lines=text_lines,
                        font=font,
                        small_font=small_font,
                        position=(
                            self._get_contact_position(
                                brand
                            )
                        ),
                        occupied_rectangles=(
                            occupied_rectangles
                        ),
                    )
                )

                panel_x, panel_y = (
                    contact_panel["position"]
                )

                panel_width = (
                    contact_panel["size"][0]
                )

                panel_height = (
                    contact_panel["size"][1]
                )

                draw.rounded_rectangle(
                    (
                        panel_x,
                        panel_y,
                        panel_x + panel_width,
                        panel_y + panel_height,
                    ),
                    radius=self.PANEL_RADIUS,
                    fill=(
                        0,
                        0,
                        0,
                        150,
                    ),
                )

                cursor_x = (
                    panel_x
                    + self.PANEL_PADDING
                )

                cursor_y = (
                    panel_y
                    + self.PANEL_PADDING
                )

                for index, line in enumerate(
                    text_lines
                ):

                    current_font = (
                        font
                        if index == 0
                        else small_font
                    )

                    draw.text(
                        (
                            cursor_x,
                            cursor_y,
                        ),
                        line,
                        font=current_font,
                        fill=(
                            255,
                            255,
                            255,
                            255,
                        ),
                    )

                    bbox = draw.textbbox(
                        (
                            cursor_x,
                            cursor_y,
                        ),
                        line,
                        font=current_font,
                    )

                    cursor_y += (
                        bbox[3] - bbox[1]
                    )

                    if index < (
                        len(text_lines) - 1
                    ):
                        cursor_y += (
                            self.TEXT_SPACING
                        )

            # ---------------------------------------------
            # Save final image.
            # ---------------------------------------------

            base.convert(
                "RGB"
            ).save(
                output
            )

        return output

    # =====================================================
    # LOGO
    # =====================================================

    @staticmethod
    def _resolve_logo(
        brand: Any,
        logo_name: str | None,
    ) -> str | None:

        logos = brand.get("logos", {}) if isinstance(brand, dict) else getattr(brand, "logos", {})
        if not isinstance(logos, dict) or not logos:
            return None

        if logo_name:
            return logos.get(logo_name)

        return next(
            iter(logos.values()),
            None,
        )

    @staticmethod
    def _resize_logo(
        logo: Image.Image,
        base_size: tuple[int, int],
    ) -> Image.Image:

        base_width, base_height = (
            base_size
        )

        max_width = int(
            base_width
            * ImageOverlayProcessor.LOGO_MAX_RATIO
        )

        max_height = int(
            base_height
            * ImageOverlayProcessor.LOGO_MAX_RATIO
        )

        width, height = logo.size

        if width <= 0 or height <= 0:
            raise ValueError(
                "Brand logo has invalid dimensions."
            )

        scale = min(
            max_width / width,
            max_height / height,
            1.0,
        )

        if scale < 1.0:

            logo = logo.resize(
                (
                    max(
                        1,
                        int(width * scale),
                    ),
                    max(
                        1,
                        int(height * scale),
                    ),
                ),
                Image.Resampling.LANCZOS,
            )

        return logo

    # =====================================================
    # PANELS
    # =====================================================

    @classmethod
    def _build_logo_panel(
        cls,
        draw: ImageDraw.ImageDraw,
        base_size: tuple[int, int],
        logo: Image.Image,
        position: str,
        occupied_rectangles: list[
            tuple[int, int, int, int]
        ],
    ) -> dict:

        panel_width = (
            logo.width
            + cls.PANEL_PADDING * 2
        )

        panel_height = (
            logo.height
            + cls.PANEL_PADDING * 2
        )

        panel_position = cls._calculate_position(
            base_size=base_size,
            overlay_size=(
                panel_width,
                panel_height,
            ),
            position=position,
        )

        panel_position = cls._avoid_overlap(
            base_size=base_size,
            overlay_size=(
                panel_width,
                panel_height,
            ),
            position=position,
            initial_position=panel_position,
            occupied_rectangles=occupied_rectangles,
        )

        return {
            "position": panel_position,
            "size": (
                panel_width,
                panel_height,
            ),
        }

    @classmethod
    def _build_contact_panel(
        cls,
        draw: ImageDraw.ImageDraw,
        base_size: tuple[int, int],
        text_lines: list[str],
        font,
        small_font,
        position: str,
        occupied_rectangles: list[
            tuple[int, int, int, int]
        ],
    ) -> dict:

        panel_width, panel_height = (
            cls._calculate_text_panel_size(
                draw=draw,
                text_lines=text_lines,
                font=font,
                small_font=small_font,
            )
        )

        panel_position = cls._calculate_position(
            base_size=base_size,
            overlay_size=(
                panel_width,
                panel_height,
            ),
            position=position,
        )

        panel_position = cls._avoid_overlap(
            base_size=base_size,
            overlay_size=(
                panel_width,
                panel_height,
            ),
            position=position,
            initial_position=panel_position,
            occupied_rectangles=occupied_rectangles,
        )

        return {
            "position": panel_position,
            "size": (
                panel_width,
                panel_height,
            ),
        }

    @classmethod
    def _calculate_text_panel_size(
        cls,
        draw: ImageDraw.ImageDraw,
        text_lines: list[str],
        font,
        small_font,
    ) -> tuple[int, int]:

        text_width = 0
        text_height = 0

        for index, line in enumerate(
            text_lines
        ):

            current_font = (
                font
                if index == 0
                else small_font
            )

            bbox = draw.textbbox(
                (0, 0),
                line,
                font=current_font,
            )

            text_width = max(
                text_width,
                bbox[2] - bbox[0],
            )

            text_height += (
                bbox[3] - bbox[1]
            )

            if index < (
                len(text_lines) - 1
            ):
                text_height += (
                    cls.TEXT_SPACING
                )

        return (
            text_width
            + cls.PANEL_PADDING * 2,
            text_height
            + cls.PANEL_PADDING * 2,
        )

    # =====================================================
    # POSITIONING
    # =====================================================

    @classmethod
    def _calculate_position(
        cls,
        base_size: tuple[int, int],
        overlay_size: tuple[int, int],
        position: str,
    ) -> tuple[int, int]:

        base_width, base_height = (
            base_size
        )

        overlay_width, overlay_height = (
            overlay_size
        )

        normalized = cls._normalize_position(
            position
        )

        # ---------------------------------------------
        # Horizontal placement
        # ---------------------------------------------

        if normalized.endswith("_left"):

            x = cls.PADDING

        elif normalized.endswith("_middle"):

            x = (
                base_width
                - overlay_width
            ) // 2

        else:

            x = (
                base_width
                - overlay_width
                - cls.PADDING
            )

        # ---------------------------------------------
        # Vertical placement
        # ---------------------------------------------

        if normalized.startswith("upper_"):

            y = cls.PADDING

        else:

            y = (
                base_height
                - overlay_height
                - cls.PADDING
            )

        # ---------------------------------------------
        # Keep overlay inside image boundaries.
        # ---------------------------------------------

        max_x = max(
            cls.PADDING,
            base_width
            - overlay_width
            - cls.PADDING,
        )

        max_y = max(
            cls.PADDING,
            base_height
            - overlay_height
            - cls.PADDING,
        )

        x = max(
            cls.PADDING,
            min(
                x,
                max_x,
            ),
        )

        y = max(
            cls.PADDING,
            min(
                y,
                max_y,
            ),
        )

        return x, y

    @classmethod
    def _avoid_overlap(
        cls,
        base_size: tuple[int, int],
        overlay_size: tuple[int, int],
        position: str,
        initial_position: tuple[int, int],
        occupied_rectangles: list[
            tuple[int, int, int, int]
        ],
    ) -> tuple[int, int]:

        if not occupied_rectangles:
            return initial_position

        x, y = initial_position

        width, height = overlay_size

        current_rect = (
            x,
            y,
            x + width,
            y + height,
        )

        # No collision.
        if not any(
            cls._rectangles_overlap(
                current_rect,
                occupied,
            )
            for occupied in occupied_rectangles
        ):
            return initial_position

        base_width, base_height = (
            base_size
        )

        normalized = cls._normalize_position(
            position
        )

        # ---------------------------------------------
        # Try stacking in the requested vertical
        # direction while preserving the horizontal
        # position.
        # ---------------------------------------------

        if normalized.startswith("upper_"):

            candidate_y = (
                occupied_rectangles[-1][3]
                + cls.PADDING
            )

            if candidate_y + height <= (
                base_height
                - cls.PADDING
            ):

                candidate_rect = (
                    x,
                    candidate_y,
                    x + width,
                    candidate_y + height,
                )

                if not any(
                    cls._rectangles_overlap(
                        candidate_rect,
                        occupied,
                    )
                    for occupied in occupied_rectangles
                ):
                    return (
                        x,
                        candidate_y,
                    )

        else:

            candidate_y = (
                occupied_rectangles[-1][1]
                - height
                - cls.PADDING
            )

            if candidate_y >= cls.PADDING:

                candidate_rect = (
                    x,
                    candidate_y,
                    x + width,
                    candidate_y + height,
                )

                if not any(
                    cls._rectangles_overlap(
                        candidate_rect,
                        occupied,
                    )
                    for occupied in occupied_rectangles
                ):
                    return (
                        x,
                        candidate_y,
                    )

        # ---------------------------------------------
        # Fallback candidates.
        # ---------------------------------------------

        candidates = []

        if normalized.startswith("upper_"):

            candidates.extend(
                [
                    (
                        x,
                        cls.PADDING,
                    ),
                    (
                        x,
                        max(
                            cls.PADDING,
                            base_height
                            - height
                            - cls.PADDING,
                        ),
                    ),
                ]
            )

        else:

            candidates.extend(
                [
                    (
                        x,
                        max(
                            cls.PADDING,
                            base_height
                            - height
                            - cls.PADDING,
                        ),
                    ),
                    (
                        x,
                        cls.PADDING,
                    ),
                ]
            )

        for candidate_x, candidate_y in candidates:

            candidate_rect = (
                candidate_x,
                candidate_y,
                candidate_x + width,
                candidate_y + height,
            )

            if not any(
                cls._rectangles_overlap(
                    candidate_rect,
                    occupied,
                )
                for occupied in occupied_rectangles
            ):
                return (
                    candidate_x,
                    candidate_y,
                )

        # If no collision-free position exists,
        # preserve the requested position.
        return initial_position

    @staticmethod
    def _rectangles_overlap(
        first: tuple[int, int, int, int],
        second: tuple[int, int, int, int],
    ) -> bool:

        return not (
            first[2] <= second[0]
            or first[0] >= second[2]
            or first[3] <= second[1]
            or first[1] >= second[3]
        )

    # =====================================================
    # POSITION NORMALIZATION
    # =====================================================

    @classmethod
    def _normalize_position(
        cls,
        value: str | None,
    ) -> str:

        aliases = {
            "top_left": "upper_left",
            "top_center": "upper_middle",
            "top_middle": "upper_middle",
            "top_right": "upper_right",
            "bottom_left": "lower_left",
            "bottom_center": "lower_middle",
            "bottom_middle": "lower_middle",
            "bottom_right": "lower_right",
        }

        allowed = {
            "upper_left",
            "upper_middle",
            "upper_right",
            "lower_left",
            "lower_middle",
            "lower_right",
        }

        if value in allowed:
            return value

        if value in aliases:
            return aliases[value]

        return cls.DEFAULT_CONTACT_POSITION

    # =====================================================
    # POSITION ACCESSORS
    # =====================================================

    @staticmethod
    def _get_logo_position(
        brand: BrandProfile,
    ) -> str:

        value = getattr(
            brand,
            "logo_position",
            None,
        )

        if value:
            return ImageOverlayProcessor._normalize_position(
                value
            )

        visual = getattr(
            brand,
            "visual",
            {},
        )

        return ImageOverlayProcessor._normalize_position(
            visual.get(
                "logo_position",
                ImageOverlayProcessor.DEFAULT_LOGO_POSITION,
            )
        )

    @staticmethod
    def _get_contact_position(
        brand: BrandProfile,
    ) -> str:

        value = getattr(
            brand,
            "contact_position",
            None,
        )

        if value:
            return ImageOverlayProcessor._normalize_position(
                value
            )

        visual = getattr(
            brand,
            "visual",
            {},
        )

        return ImageOverlayProcessor._normalize_position(
            visual.get(
                "contact_position",
                ImageOverlayProcessor.DEFAULT_CONTACT_POSITION,
            )
        )

    # =====================================================
    # CONTACT INFORMATION
    # =====================================================

    @staticmethod
    def _build_text_lines(
        brand: Any,
    ) -> list[str]:

        lines = []

        brand_name = ""
        if isinstance(brand, dict):
            brand_name = brand.get("name") or brand.get("brand_name") or ""
        else:
            brand_name = getattr(brand, "name", getattr(brand, "brand_name", ""))

        if brand_name and str(brand_name).strip():
            lines.append(str(brand_name).strip())

        contact = brand.get("contact_details", {}) if isinstance(brand, dict) else getattr(brand, "contact_details", {})
        if not isinstance(contact, dict):
            contact = {}

        phone = str(contact.get("phone", "")).strip()
        email = str(contact.get("email", "")).strip()
        whatsapp = str(contact.get("whatsapp", "")).strip()
        address = str(contact.get("address", "")).strip()
        website = str(brand.get("website", "") if isinstance(brand, dict) else getattr(brand, "website", "")).strip()

        if phone:
            lines.append(f"Phone: {phone}")

        if whatsapp:
            lines.append(f"WhatsApp: {whatsapp}")

        if email:
            lines.append(f"Email: {email}")

        if website:
            lines.append(website)

        if address:
            lines.append(address)

        return lines

    # =====================================================
    # FONTS
    # =====================================================

    @staticmethod
    def _get_font(
        base_size: tuple[int, int],
    ):

        size = max(
            18,
            int(
                min(base_size)
                * 0.035
            ),
        )

        return ImageFont.load_default(
            size=size
        )

    @staticmethod
    def _get_small_font(
        base_size: tuple[int, int],
    ):

        size = max(
            14,
            int(
                min(base_size)
                * 0.027
            ),
        )

        return ImageFont.load_default(
            size=size
        )