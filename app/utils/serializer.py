from datetime import date, datetime, time
from enum import Enum
from pathlib import Path


class Serializer:
    """
    Recursively converts complex Python objects
    into JSON-serializable structures.
    """

    @classmethod
    def serialize(cls, obj):

        # Primitive types
        if obj is None or isinstance(
            obj,
            (str, int, float, bool),
        ):
            return obj

        # Pydantic models
        if hasattr(obj, "model_dump"):
            return cls.serialize(
                obj.model_dump()
            )

        # Dictionaries
        if isinstance(obj, dict):
            return {
                key: cls.serialize(value)
                for key, value in obj.items()
            }

        # Lists / Tuples / Sets
        if isinstance(obj, (list, tuple, set)):
            return [
                cls.serialize(item)
                for item in obj
            ]

        # Path objects
        if isinstance(obj, Path):
            return obj.as_posix()

        # Datetime
        if isinstance(obj, (datetime, date, time)):
            return obj.isoformat()

        # Enum
        if isinstance(obj, Enum):
            return obj.value

        # Fallback
        return str(obj)