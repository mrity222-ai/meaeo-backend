import base64
import hashlib
import hmac
import secrets


class PasswordService:

    ALGORITHM = "scrypt"

    @classmethod
    def hash(
        cls,
        password: str,
    ) -> str:

        if not password:
            raise ValueError(
                "Password cannot be empty."
            )

        salt = secrets.token_bytes(16)

        derived = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=2**14,
            r=8,
            p=1,
        )

        return (
            f"{cls.ALGORITHM}$"
            f"{base64.urlsafe_b64encode(salt).decode()}$"
            f"{base64.urlsafe_b64encode(derived).decode()}"
        )

    @classmethod
    def verify(
        cls,
        password: str,
        encoded: str,
    ) -> bool:

        try:

            algorithm, salt_b64, hash_b64 = (
                encoded.split("$", 2)
            )

            if algorithm != cls.ALGORITHM:
                return False

            salt = base64.urlsafe_b64decode(
                salt_b64.encode()
            )

            expected = (
                base64.urlsafe_b64decode(
                    hash_b64.encode()
                )
            )

            actual = hashlib.scrypt(
                password.encode("utf-8"),
                salt=salt,
                n=2**14,
                r=8,
                p=1,
            )

            return hmac.compare_digest(
                actual,
                expected,
            )

        except (
            ValueError,
            TypeError,
        ):
            return False