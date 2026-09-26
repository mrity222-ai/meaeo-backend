from app.models.factory import ModelFactory
from app.models.config import settings

llm = ModelFactory.get_provider(settings.TEXT_MODEL_PROVIDER)

response = llm.invoke([
    {
        "role":"user",
        "content": "Introduce yourself in one sentence."
    }
])

print(response.choices[0].message.content)
