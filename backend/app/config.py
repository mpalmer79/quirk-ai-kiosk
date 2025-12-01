"""
Application configuration using Pydantic Settings
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]
    
    # External API Keys (for production)
    PBS_API_KEY: str = "mock-pbs-key-dev"
    PBS_API_URL: str = "https://api.pbssystems.com/v1"
    
    CRM_API_KEY: str = "mock-crm-key-dev"
    CRM_API_URL: str = "https://api.vinsolutions.com/v1"
    
    # AI Service
    AI_SERVICE_URL: str = "http://ai_service:8001"
    
    # Feature flags
    USE_MOCK_DATA: bool = False
    ENABLE_ANALYTICS: bool = True
    
    class Config:
        env_file = ".env.development"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
