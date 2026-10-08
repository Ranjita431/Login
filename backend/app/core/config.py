from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Authentication System"
    app_version: str = "1.0.0"

    # Google
    google_client_id: str

    # Email / SMTP
    smtp_email: str | None = None
    smtp_password: str | None = None
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587

    # JWT
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # Frontend
    frontend_url: str = "http://localhost:5173"

    # PostgreSQL
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "auth_db"
    postgres_user: str = "postgres"
    postgres_password: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()