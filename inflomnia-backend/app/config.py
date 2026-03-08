from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_env: str = "development"
    debug: bool = True

    # AWS Core
    aws_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_session_token: str | None = None

    # Google Gemini
    gemini_api_key: str = ""
    gemini_model_id: str = "gemini-2.0-flash"

    # Amazon Bedrock
    bedrock_model_id: str = "us.amazon.nova-2-lite-v1:0"
    bedrock_guardrail_id: str = ""
    bedrock_guardrail_version: str = "DRAFT"

    # Amazon Bedrock Agent (Comment Shield)
    bedrock_agent_id: str = ""
    bedrock_agent_alias_id: str = ""

    # Amazon OpenSearch Serverless
    opensearch_endpoint: str = ""
    opensearch_index: str = "creator-reach-patterns"

    # Amazon S3
    s3_bucket_name: str = "inflomnia-resilience-engine"

    # Database
    database_url: str = "sqlite:///./inflomnia_dev.db"

    # Auth (Cognito)
    cognito_user_pool_id: str = ""
    cognito_client_id: str = ""

    # Integrations
    instagram_access_token: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
