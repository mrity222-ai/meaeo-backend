from app.parsers.normalization_context import NormalizationContext
from app.parsers.rules.collection import CollectionNormalizer
from app.parsers.rules.model import ModelNormalizer
from app.parsers.rules.primitive import PrimitiveNormalizer
from app.parsers.rules.registry import NormalizerRegistry


class SchemaNormalizer:

    _initialized = False

    @classmethod
    def _initialize(cls):

        if cls._initialized:
            return

        NormalizerRegistry.register(
            PrimitiveNormalizer
        )

        NormalizerRegistry.register(
            CollectionNormalizer
        )

        NormalizerRegistry.register(
            ModelNormalizer
        )

        cls._initialized = True

    @classmethod
    def normalize(
        cls,
        value,
        schema,
    ):

        cls._initialize()

        context = NormalizationContext()

        return context.normalize(
            value,
            schema,
        )