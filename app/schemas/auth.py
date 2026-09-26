from pydantic import BaseModel, Field, EmailStr


class RegisterRequest(BaseModel):

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    name: str = Field(
        min_length=1,
        max_length=255,
    )

    business_name: str = Field(
        min_length=1,
        max_length=255,
    )


class LoginRequest(BaseModel):

    email: EmailStr

    password: str = Field(
        min_length=1
    )


class LoginResponse(BaseModel):

    access_token: str
    token_type: str = "bearer"


class RegisterResponse(BaseModel):

    access_token: str
    token_type: str = "bearer"
    tenant_id: str | None = None
    business_account_id: int | None = None
    message: str = "Account created successfully."