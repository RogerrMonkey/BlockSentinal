from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path
import os


class Settings(BaseSettings):
    # API
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "BlockSentinel"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # Database
    DATABASE_URL: str = "sqlite:///./blocksentinel.db"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Etherscan
    ETHERSCAN_API_KEY: Optional[str] = None
    ETHERSCAN_API_URL: str = "https://api.etherscan.io/api"
    
    # File storage
    REPORTS_DIR: str = "./reports"
    MAX_UPLOAD_SIZE_MB: int = 10
    
    # Slither
    SLITHER_TIMEOUT: int = 120  # seconds
    DOCKER_TIMEOUT: int = 300  # seconds for building images
    
    # Supabase
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_KEY: Optional[str] = None
    SUPABASE_STORAGE_BUCKET: str = "scan-reports"
    
    # AI Analysis - Ollama (Local LLM)
    OLLAMA_API_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2:3b"
    
    class Config:
        # Load from root .env file (3 levels up: app/core/config.py -> backend -> root)
        env_file = os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env")
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"  # Ignore NEXT_PUBLIC_* and other frontend vars


settings = Settings()
