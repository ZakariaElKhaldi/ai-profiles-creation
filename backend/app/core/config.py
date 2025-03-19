from typing import List, Optional, Union, Any
from pydantic import BaseModel, Field, ConfigDict
from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from pathlib import Path
import json


class Settings(BaseSettings):
    # Basic application settings
    PROJECT_NAME: str = Field(default="AI Profiles API")
    PROJECT_DESCRIPTION: str = Field(default="Backend API for AI Profiles Management Dashboard")
    VERSION: str = Field(default="0.1.0")
    API_PREFIX: str = Field(default="/api")
    DEBUG: bool = Field(default=False)

    # CORS settings
    CORS_ORIGINS: str = Field(default="http://localhost:3000,http://localhost:5173")

    # Database settings
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./backend/data/app.db")  # SQLite for development
    
    # OpenRouter settings
    OPENROUTER_API_KEY: str = Field(default="")
    OPENROUTER_BASE_URL: str = Field(default="https://api.openrouter.ai/api/v1")
    
    # File storage settings
    UPLOAD_DIR: str = Field(default="uploads")
    MAX_UPLOAD_SIZE: int = Field(default=50 * 1024 * 1024)  # 50 MB
    ALLOWED_EXTENSIONS: str = Field(default="pdf,docx,txt,csv,xlsx")
    
    # Profile settings
    MAX_PROFILES_PER_USER: int = Field(default=10)
    
    # Redis settings
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    
    # JWT settings (for future auth implementation)
    JWT_SECRET: str = Field(default="CHANGE_THIS_IN_PRODUCTION")
    JWT_ALGORITHM: str = Field(default="HS256")
    JWT_EXPIRATION: int = Field(default=60 * 24)  # 24 hours
    
    # Supabase settings (for future auth implementation)
    SUPABASE_URL: Optional[str] = Field(default=None)
    SUPABASE_KEY: Optional[str] = Field(default=None)

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra='allow'
    )

    @property
    def cors_origins_list(self) -> List[str]:
        if self.CORS_ORIGINS.startswith("[") and self.CORS_ORIGINS.endswith("]"):
            try:
                return json.loads(self.CORS_ORIGINS)
            except json.JSONDecodeError:
                pass
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def allowed_extensions_list(self) -> List[str]:
        return [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(",")]

    def model_post_init(self, *args, **kwargs):
        # Create upload directory
        os.makedirs(self.UPLOAD_DIR, exist_ok=True)


# Create a global settings object
settings = Settings()

# Ensure the upload directory exists
upload_dir = Path(settings.UPLOAD_DIR)
upload_dir.mkdir(exist_ok=True) 