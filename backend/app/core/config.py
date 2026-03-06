from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "stock-dashboard"
    env: str = "dev"

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@db:5432/stocks"

    # Redis
    redis_url: str = "redis://redis:6379/0"

    # Data source behavior
    free_mode: bool = True  # if True, prefer free/delayed sources


settings = Settings()
