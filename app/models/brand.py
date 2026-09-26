from dataclasses import dataclass, field


@dataclass
class BrandProfile:

    name: str

    primary_color: str
    secondary_color: str

    fonts: dict[str, str]

    voice: dict[str, str]

    hashtags: list[str]

    products: list[dict]

    logos: dict[str, str]

    templates: dict[str, str]

    visual: dict = field(
        default_factory=dict
    )

    website: str = ""

    contact_details: dict[str, str] = field(
        default_factory=dict
    )

    logo_position: str = "upper_right"

    contact_position: str = "lower_right"

    metadata: dict = field(
        default_factory=dict
    )