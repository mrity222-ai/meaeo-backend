from ollama import AsyncClient, Client

from app.models.base import BaseProvider


class OllamaProvider(BaseProvider):

    def __init__(self, model: str):

        self.client = Client(
            host="http://localhost:11434"
        )

        self.async_client = AsyncClient(
            host="http://localhost:11434"
        )

        self.model = model

    def invoke(self, messages):

        response = self.client.chat(
            model=self.model,
            messages=messages,
            format="json",
        )

        return self._normalize(response)

    async def ainvoke(self, messages):

        response = await self.async_client.chat(
            model=self.model,
            messages=messages,
            format="json",
        )

        return self._normalize(response)

    def stream(self, messages):

        raise NotImplementedError

    def _normalize(self, response):

        class Message:

            def __init__(self, content):
                self.content = content

        class Choice:

            def __init__(self, content):
                self.message = Message(content)

        class Response:

            def __init__(self, content):
                self.choices = [
                    Choice(content)
                ]

        return Response(
            response["message"]["content"]
        )