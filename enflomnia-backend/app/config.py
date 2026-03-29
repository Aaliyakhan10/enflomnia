from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_env: str = "development"
    debug: bool = True

    # Google Gemini
    gemini_api_key: str = ""
    gemini_model_id: str = "gemini-2.5-flash"

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""
    jwt_secret: str = ""

    # Langfuse (LLM Observability)
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    langfuse_host: str = "https://cloud.langfuse.com"

    # Database (Supabase PostgreSQL or local SQLite fallback)
    database_url: str = "sqlite:///./enflomnia_dev.db"

    # Integrations
    instagram_access_token: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
