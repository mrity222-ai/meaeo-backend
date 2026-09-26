from abc import ABC, abstractmethod


class EncryptionService(ABC):

    @abstractmethod
    def encrypt(
        self,
        value: str,
    ) -> str:
        ...

    @abstractmethod
    def decrypt(
        self,
        value: str,
    ) -> str:
        ...