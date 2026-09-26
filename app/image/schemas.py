from pathlib import Path

from pydantic import BaseModel


class PreparedImage(BaseModel):

    prompt: str
    assets: dict
    style: dict


class GeneratedImageResult(BaseModel):

    image_path: Path
    provider: str
    prompt: str
    generation_time_ms: float = 0
    revised_prompt: str | None = None
    seed: int | None = None