from app.models.config import settings
from app.models.registry import ModelRegistry


class ModelFactory:

    @staticmethod
    def get_provider():

        provider_class = ModelRegistry.get_provider(
            settings.TEXT_MODEL_PROVIDER
        )

        model = ModelRegistry.get_model(
            settings.TEXT_MODEL_PROVIDER,
            settings.TEXT_MODEL_ALIAS,
        )

        return provider_class(model)