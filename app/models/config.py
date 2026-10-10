from contextvars import ContextVar
from pydantic import SecretStr, field_validator

# Request/task snapshots prevent settings saves changing an in-flight operation.
runtime_settings: ContextVar[dict | None] = ContextVar("runtime_settings", default=None)
from pydantic_settings import BaseSettings, SettingsConfigDict


class ModelSettings(BaseSettings):
    def __getattribute__(self, name):
        snapshot = runtime_settings.get()
        if snapshot is not None and name in snapshot:
            return snapshot[name]
        return super().__getattribute__(name)

    DEFAULT_BRAND: str = "brand_001"
    APP_ENV: str = "development"

    HF_TOKEN: SecretStr

    TEXT_MODEL_PROVIDER: str = "huggingface"
    TEXT_MODEL_ALIAS: str = "default_chat"

    IMAGE_MODEL_PROVIDER: str = "huggingface"
    IMAGE_MODEL_ALIAS: str = "default"
    IMAGE_MODEL: str = "black-forest-labs/FLUX.1-schnell"
    IMAGE_OUTPUT_DIR: str = "generated/images"

    TAVILY_API_KEY: SecretStr
    FIRECRAWL_API_KEY: SecretStr | None = None
    RESEARCH_PROVIDERS: str = "tavily"
    TAVILY_ENABLED: bool | None = None
    FIRECRAWL_ENABLED: bool | None = None
    SEO_ENABLED: bool | None = None

    DATAFORSEO_API_KEY: str | None = None
    DATAFORSEO_LOGIN: str | None = None
    DATAFORSEO_PASSWORD: str | None = None

    DATABASE_URL: str = "sqlite:///./app.db"
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_TIMEOUT: int = 30

    STORAGE_BACKEND: str = "json"

    PUBLISH_PROVIDER: str = "mock"
    PUBLISH_MODE: str = "development"
    PUBLISH_TIMEZONE: str = "UTC"

    CREDENTIAL_STORAGE_ROOT: str = "data/credentials"
    CREDENTIAL_ENCRYPTION_KEY: SecretStr

    @field_validator("CREDENTIAL_ENCRYPTION_KEY")
    @classmethod
    def valid_credential_key(cls, value: SecretStr) -> SecretStr:
        from cryptography.fernet import Fernet
        try:
            Fernet(value.get_secret_value().encode("utf-8"))
        except (ValueError, TypeError):
            raise ValueError("CREDENTIAL_ENCRYPTION_KEY must be a valid Fernet key; retain the existing key for stored credentials") from None
        return value

    @field_validator("CREDENTIAL_STORAGE_ROOT")
    @classmethod
    def valid_credential_root(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("CREDENTIAL_STORAGE_ROOT must not be blank")
        return value


    META_API_VERSION: str = "v26.0"
    META_APP_ID: str | None = None
    META_APP_SECRET: str | None = None
    META_REDIRECT_URI: str | None = None
    META_CONFIG_ID: str | None = None

    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: SecretStr | None = None
    GOOGLE_REDIRECT_URI: str | None = None

    LINKEDIN_CLIENT_ID: str | None = None
    LINKEDIN_CLIENT_SECRET: SecretStr | None = None
    LINKEDIN_REDIRECT_URI: str | None = None

    JWT_SECRET_KEY: SecretStr
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    LLM_MAX_RETRIES: int = 3
    TEMPERATURE: float = 0.8
    MAX_TOKENS: int = 4096

    ASSET_STORAGE_ROOT: str = "data/assets"
    ASSET_PUBLIC_BASE_URL: str = "http://localhost:8000"
    ASSET_URL_TTL_SECONDS: int = 3600
    ASSET_SIGNING_SECRET: SecretStr
    ASSET_STORAGE_BACKEND: str = "local"
    ASSET_MAX_IMAGES: int = 100

    OPENAI_API_KEY: SecretStr | None = None
    ANTHROPIC_API_KEY: SecretStr | None = None
    GEMINI_API_KEY: SecretStr | None = None
    STABILITY_API_KEY: SecretStr | None = None

    # -------------------------------------------------
    # Payments & Razorpay
    # -------------------------------------------------
    RAZORPAY_KEY_ID: str | None = None
    RAZORPAY_KEY_SECRET: SecretStr | None = None
    RAZORPAY_WEBHOOK_SECRET: SecretStr | None = None

    # -------------------------------------------------
    # Email delivery & SMTP
    # -------------------------------------------------

    EMAIL_PROVIDER: str = "console"
    EMAIL_FROM: str = "no-reply@example.com"
    EMAIL_FROM_NAME: str = "Autonomous Marketing System"
    RESEND_API_KEY: SecretStr | None = None
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: SecretStr | None = None
    SMTP_USE_TLS: bool = True

    # -------------------------------------------------
    # Super Administrator Credentials
    # -------------------------------------------------
    SUPER_ADMIN_EMAIL: str = "admin@marketingsystem.com"
    SUPER_ADMIN_PASSWORD: str = "Admin@12345"
    SUPER_ADMIN_PIN: str = "984102"

    GOOGLE_BUSINESS_REDIRECT_URI: str = (
    "http://127.0.0.1:8000/oauth/google-business/callback"
    )


    # Optional application-level upload size limit.
    # None means no application-level limit.
    # Infrastructure/reverse-proxy limits may still apply.
    ASSET_MAX_UPLOAD_MB: int | None = None

    CORS_ALLOWED_ORIGINS: str = ""

    # -------------------------------------------------
    # Feature flags
    #
    # Analytics is intentionally disabled for V1.
    # Set ANALYTICS_ENABLED=true when activating
    # the Analytics pipeline in V2.
    # -------------------------------------------------

    ANALYTICS_ENABLED: bool = False
    ANALYTICS_SYNC_ENABLED: bool = True
    LINKEDIN_OAUTH_SCOPES: str = "openid profile email w_member_social"
    LINKEDIN_ANALYTICS_API_VERSION: str = "202609"

    def validate_production_config(self) -> None:
        if self.APP_ENV.strip().lower() not in {"production", "prod"}:
            return

        errors: list[str] = []
        from urllib.parse import urlsplit
        for key in ("SUPER_ADMIN_PASSWORD", "SUPER_ADMIN_PIN"):
            value = getattr(self, key)
            value = value.get_secret_value() if hasattr(value, "get_secret_value") else value
            if not value or value == type(self).model_fields[key].default:
                errors.append(f"{key} must be explicitly changed from its built-in default")
        for key, platform in (("META_REDIRECT_URI", "meta"),
                              ("GOOGLE_BUSINESS_REDIRECT_URI", "google_business"),
                              ("LINKEDIN_REDIRECT_URI", "linkedin")):
            client_key = {"meta": "META_APP_ID", "google_business": "GOOGLE_CLIENT_ID", "linkedin": "LINKEDIN_CLIENT_ID"}[platform]
            if not getattr(self, client_key):
                continue
            uri = urlsplit(getattr(self, key) or "")
            path = uri.path.replace("-", "_")
            allowed = {f"{prefix}/oauth/callback/{platform}" for prefix in ("", "/api/v1")} | {f"{prefix}/oauth/{platform}/callback" for prefix in ("", "/api/v1")}
            if uri.scheme != "https" or not uri.hostname or uri.hostname in {"localhost", "127.0.0.1", "::1"} or uri.username or uri.password or path not in allowed:
                errors.append(f"{key} must be a public HTTPS URL for this platform's callback route")

        if self.PUBLISH_MODE.strip().lower() != "production":
            errors.append("PUBLISH_MODE must be 'production'")

        if self.PUBLISH_PROVIDER.strip().lower() != "facebook":
            errors.append("PUBLISH_PROVIDER must be 'facebook'")

        if self.STORAGE_BACKEND.strip().lower() != "database":
            errors.append("STORAGE_BACKEND must be 'database'")

        if self.IMAGE_MODEL_PROVIDER.strip().lower() == "mock":
            errors.append("IMAGE_MODEL_PROVIDER cannot be 'mock'")

        if self.ASSET_PUBLIC_BASE_URL.startswith("http://"):
            errors.append(
                "ASSET_PUBLIC_BASE_URL must use HTTPS"
            )

        if (
            self.META_REDIRECT_URI
            and self.META_REDIRECT_URI.startswith("http://")
        ):
            errors.append(
                "META_REDIRECT_URI must use HTTPS"
            )

        if errors:
            raise ValueError(
                "Invalid production configuration:\n- "
                + "\n- ".join(errors)
            )

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        hide_input_in_errors=True,
    )


settings = ModelSettings()
