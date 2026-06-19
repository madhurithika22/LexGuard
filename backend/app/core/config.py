import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "LexGuard AI"
    API_V1_STR: str = "/api"
    
    # JWT Settings
    SECRET_KEY: str = os.getenv("LEXGUARD_SECRET_KEY", "super-secret-lexguard-key-for-jwt-signing-2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours for easy testing
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database Settings
    # Supports PostgreSQL, falls back to SQLite
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///C:/Users/Ln/.gemini/antigravity/scratch/lexguard-ai/backend/lexguard.db"
    )
    
    # AI Layer Settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # File Storage Settings
    UPLOAD_DIR: str = os.getenv(
        "UPLOAD_DIR", 
        "C:/Users/Ln/.gemini/antigravity/scratch/lexguard-ai/backend/uploads"
    )
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    class Config:
        case_sensitive = True

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
