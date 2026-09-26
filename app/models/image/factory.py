from app.models.config import settings
from app.models.image.registry import ImageRegistry


class ImageProviderFactory:

    @staticmethod
    def get_provider():

        provider_class = ImageRegistry.get_provider(
            settings.IMAGE_MODEL_PROVIDER
        )

        model = ImageRegistry.get_model(
            settings.IMAGE_MODEL_PROVIDER,
            settings.IMAGE_MODEL_ALIAS,
        )

        return provider_class(model)