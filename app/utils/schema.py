from pydantic import BaseModel


def build_json_template(schema: type[BaseModel]) -> str:
    """
    Build a compact JSON template from a Pydantic model.
    """

    instance = schema.model_construct()

    return instance.model_dump_json(
        indent=2,
        exclude_none=True
    )