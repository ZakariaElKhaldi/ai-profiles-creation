from typing import List, Optional, Union
from pydantic import AnyHttpUrl, Field, validator, BaseSettings
import os
from pathlib import Path


class Settings(BaseSettings):
    # Basic application settings
    PROJECT_NAME: str = "AI Profiles API"
    PROJECT_DESCRIPTION: str = "Backend API for AI Profiles Management Dashboard"
    VERSION: str = "0.1.0"
    API_PREFIX: str = "/api"
    DEBUG: bool = False

    # CORS settings
    CORS_ORIGINS: List[Union[str, AnyHttpUrl]] = ["http://localhost:3000"]

    # Database settings
    DATABASE_URL: str = "sqlite+aiosqlite:///backend/data/app.db"  # SQLite in data directory
    
    # OpenRouter settings
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://api.openrouter.ai/api/v1"
    
    # File storage settings
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50 MB
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "docx", "txt", "csv", "xlsx"]
    
    # Profile settings
    MAX_PROFILES_PER_USER: int = 10
    
    # Redis settings
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT settings (for future auth implementation)
    JWT_SECRET: str = "CHANGE_THIS_IN_PRODUCTION"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 60 * 24  # 24 hours
    
    # Supabase settings (for future auth implementation)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True

    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    @validator("UPLOAD_DIR")
    def create_upload_dir(cls, v):
        os.makedirs(v, exist_ok=True)
        return v


# Create a global settings object
settings = Settings()

# Ensure the upload directory exists
upload_dir = Path(settings.UPLOAD_DIR)
upload_dir.mkdir(exist_ok=True) 