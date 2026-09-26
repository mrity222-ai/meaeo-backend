from pydantic import BaseModel, EmailStr, Field


class SignupVerificationRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=255)
    business_name: str | None = Field(default=None, max_length=255)


class SignupVerificationResponse(BaseModel):
    message: str


class VerifySignupEmailRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)


class VerifySignupEmailResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    tenant_id: str | None = None
    business_account_id: int | None = None

class PasswordResetRequestSchema(BaseModel):
    email: EmailStr


class PasswordResetVerifyRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)


class PasswordResetVerifyResponse(BaseModel):
    reset_token: str


class PasswordResetCompleteRequest(BaseModel):
    email: EmailStr
    reset_token: str = Field(min_length=1, max_length=512)
    new_password: str = Field(min_length=8, max_length=128)


class PasswordResetCompleteResponse(BaseModel):
    message: str