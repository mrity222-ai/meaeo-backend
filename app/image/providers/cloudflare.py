from app.image.base import BaseImageProvider


class CloudflareImageProvider(BaseImageProvider):

    @property
    def provider_name(self):
        return "cloudflare"

    def generate(
        self,
        prompt,
        output_path,
    ):
        raise NotImplementedError(
            "Cloudflare provider not implemented yet."
        )

    async def agenerate(
        self,
        prompt,
        output_path,
    ):
        raise NotImplementedError(
            "Cloudflare provider not implemented yet."
        )