from abc import ABC

from app.clients.http import HttpClient


class BaseClient(ABC):

    BASE_URL = ""

    @property
    def headers(self):
        return {}

    def get(
        self,
        endpoint,
        **kwargs,
    ):

        return HttpClient.get(
            self.BASE_URL + endpoint,
            headers=self.headers,
            auth=self.auth,
            **kwargs,
        )

    async def aget(
        self,
        endpoint,
        **kwargs,
    ):

        return await HttpClient.aget(
            self.BASE_URL + endpoint,
            headers=self.headers,
            auth=self.auth,
            **kwargs,
        )

    def post(
        self,
        endpoint,
        **kwargs,
    ):

        return HttpClient.post(
            self.BASE_URL + endpoint,
            headers=self.headers,
            auth=self.auth,
            **kwargs,
        )

    async def apost(
        self,
        endpoint,
        **kwargs,
    ):

        return await HttpClient.apost(
            self.BASE_URL + endpoint,
            headers=self.headers,
            auth=self.auth,
            **kwargs,
        )

    @property
    def auth(self):
        return None