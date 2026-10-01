from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List

class Settings(BaseSettings):
    #App Information
    PROJECT_NAME: str = "LEGAL CONNECT ML Service"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = ["*"]

    # Storage Paths
    BASE_DATA_DIR: str = "./data"
    CHROMA_PERSIST_DIR: str = "./data/vector_stores"
    PDF_UPLOAD_DIR: str = "./data/uploads/pdfs"
    COLLECTION_NAME: str = "vietnamese_legal_docs"

    # AI & LLM Settings
    EMBEDDING_MODEL: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    LLM_PROVIDER: str = "openrouter"  # openrouter, google, openai
    LLM_MODEL: str = "meta-llama/llama-3.3-70b-instruct:free"
    OPENROUTER_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    TEMPERATURE: float = 0.2
    MAX_TOKENS: int = 2048
    TOP_K: int = 5
    # Pydantic v2 Settings Config
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

@lru_cache()
def get_settings() -> Settings:
    """Trả về Singleton instance của Settings"""
    return Settings()