from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Books Library API"
    api_prefix: str = "/api"
    secret_key: str = "change-me-in-production"
    access_token_exp_minutes: int = 60
    refresh_token_exp_minutes: int = 60 * 24 * 7

    database_url: str = "postgresql+psycopg://bookslib:bookslib@localhost:5432/bookslib"
    storage_root: str = "./storage"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def storage_path(self) -> Path:
        return Path(self.storage_root).resolve()


settings = Settings()
