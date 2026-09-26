import asyncio
from time import sleep

import httpx
import requests

from app.exceptions.http import (
    HttpAuthenticationError,
    HttpRateLimitError,
    HttpRequestError,
    HttpServerError,
)


class HttpClient:

    DEFAULT_TIMEOUT = 30
    DEFAULT_RETRIES = 3
    BACKOFF_FACTOR = 2

    @classmethod
    def _request(
        cls,
        method,
        url,
        **kwargs,
    ):

        retries = kwargs.pop(
            "retries",
            None,
        )

        timeout = kwargs.pop(
            "timeout",
            cls.DEFAULT_TIMEOUT,
        )

        method = method.upper()

        if retries is None:

            retries = (
                cls.DEFAULT_RETRIES
                if method == "GET"
                else 1
            )

        retries = max(
            1,
            int(retries),
        )

        delay = 1

        for attempt in range(retries):

            try:

                response = requests.request(
                    method,
                    url,
                    timeout=timeout,
                    **kwargs,
                )

                if response.status_code == 401:

                    raise HttpAuthenticationError(
                        response.text
                    )

                if response.status_code == 429:

                    raise HttpRateLimitError(
                        response.text
                    )

                if response.status_code >= 500:

                    raise HttpServerError(
                        response.text
                    )

                response.raise_for_status()

                try:

                    return response.json()

                except ValueError as exc:

                    raise HttpRequestError(
                        "HTTP response contained "
                        "invalid JSON."
                    ) from exc

            except HttpRateLimitError:

                if attempt == retries - 1:
                    raise

                sleep(delay)

                delay *= (
                    cls.BACKOFF_FACTOR
                )

            except (
                requests.Timeout,
                requests.ConnectionError,
                HttpServerError,
            ):

                if attempt == retries - 1:
                    raise HttpRequestError()

                sleep(delay)

                delay *= (
                    cls.BACKOFF_FACTOR
                )

    @classmethod
    def get(
        cls,
        url,
        **kwargs,
    ):

        return cls._request(
            "GET",
            url,
            **kwargs,
        )

    @classmethod
    def post(
        cls,
        url,
        **kwargs,
    ):

        return cls._request(
            "POST",
            url,
            **kwargs,
        )

    @classmethod
    async def _arequest(
        cls,
        method,
        url,
        **kwargs,
    ):

        retries = kwargs.pop(
            "retries",
            None,
        )

        timeout = kwargs.pop(
            "timeout",
            cls.DEFAULT_TIMEOUT,
        )

        method = method.upper()

        if retries is None:

            retries = (
                cls.DEFAULT_RETRIES
                if method == "GET"
                else 1
            )

        retries = max(
            1,
            int(retries),
        )

        delay = 1

        for attempt in range(retries):

            try:

                async with httpx.AsyncClient(
                    timeout=timeout
                ) as client:

                    response = (
                        await client.request(
                            method,
                            url,
                            **kwargs,
                        )
                    )

                if response.status_code == 401:

                    raise HttpAuthenticationError(
                        response.text
                    )

                if response.status_code == 429:

                    raise HttpRateLimitError(
                        response.text
                    )

                if response.status_code >= 500:

                    raise HttpServerError(
                        response.text
                    )

                response.raise_for_status()

                try:

                    return response.json()

                except ValueError as exc:

                    raise HttpRequestError(
                        "HTTP response contained "
                        "invalid JSON."
                    ) from exc

            except HttpRateLimitError:

                if attempt == retries - 1:
                    raise

                await cls._asleep(
                    delay
                )

                delay *= (
                    cls.BACKOFF_FACTOR
                )

            except (
                httpx.TimeoutException,
                httpx.ConnectError,
                HttpServerError,
            ):

                if attempt == retries - 1:
                    raise HttpRequestError()

                await cls._asleep(
                    delay
                )

                delay *= (
                    cls.BACKOFF_FACTOR
                )

    @classmethod
    async def _asleep(
        cls,
        seconds: float,
    ):

        await asyncio.sleep(
            seconds
        )

    @classmethod
    async def aget(
        cls,
        url,
        **kwargs,
    ):

        return await cls._arequest(
            "GET",
            url,
            **kwargs,
        )

    @classmethod
    async def apost(
        cls,
        url,
        **kwargs,
    ):

        return await cls._arequest(
            "POST",
            url,
            **kwargs,
        )