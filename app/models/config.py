from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class ModelSettings(BaseSettings):
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

    CREDENTIAL_ENCRYPTION_KEY: SecretStr

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

    def validate_production_config(self) -> None:
        if self.APP_ENV.strip().lower() != "production":
            return

        errors: list[str] = []

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
    )


settings = ModelSettings()