class ImagePromptBuilder:

    def build(
        self,
        post,
        style: dict,
        assets: dict,
    ) -> str:

        return f"""
Subject

{post.image_prompt}

Visual Style

Style:
{style["style"]}

Photography:
{style["photography"]}

Lighting:
{style["lighting"]}

Composition:
{style["composition"]}

Background:
{style["background"]}

Primary Color:
{style["primary_color"]}

Secondary Color:
{style["secondary_color"]}

Logo Position:
{style["logo_position"]}

Aspect Ratio:
{style["aspect_ratio"]}

Instructions

High quality commercial marketing image.

Do not render any text.

Leave space for the logo.

Maintain brand consistency.
""".strip()