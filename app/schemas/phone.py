import re


def normalize_phone(value: str) -> str:
    if not isinstance(value, str):
        raise ValueError("Mobile number is required, including country code.")
    value = re.sub(r"[\s().-]", "", value.strip())
    if not re.fullmatch(r"\+[1-9][0-9]{7,14}", value):
        raise ValueError("Enter a valid mobile number with country code, e.g. +919876543210.")
    return value
