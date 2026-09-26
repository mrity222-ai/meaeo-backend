from app.image.base import BaseImageProvider


class FalImageProvider(BaseImageProvider):

    @property
    def provider_name(self):
        return "fal"

    def generate(
        self,
        prompt,
        output_path,
    ):
        raise NotImplementedError(
            "Fal provider not implemented yet."
        )

    async def agenerate(
        self,
        prompt,
        output_path,
    ):
        raise NotImplementedError(
            "Fal provider not implemented yet."
        )