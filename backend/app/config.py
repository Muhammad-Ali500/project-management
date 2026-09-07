from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    mongo_uri: str = "mongodb://localhost:27017"
    db_name: str = "project_manager"
    cors_origins: list[str] = ["http://localhost:3000"]
    environment: str = "development"


settings = Settings()
