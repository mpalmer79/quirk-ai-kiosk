"""
Quirk AI Kiosk - Application Settings
Pydantic-based configuration with validation and type safety.

All environment variables are validated at startup.
Missing required variables will prevent the application from starting.
"""

from functools import lru_cache
from typing import Optional, List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
import secrets


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    Required variables will raise ValidationError if missing.
    Optional variables have sensible defaults.
    """
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
    
    # =========================================================================
    # ENVIRONMENT
    # =========================================================================
    
    environment: str = Field(
        default="production",
        description="Runtime environment: development or production"
    )
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)
    
    @property
    def is_development(self) -> bool:
        return self.environment.lower() == "development"
    
    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"
    
    # =========================================================================
    # AI SERVICE
    # =========================================================================
    
    anthropic_api_key: Optional[str] = Field(
        default=None,
        description="Anthropic API key for Claude AI"
    )
    
    @property
    def is_ai_configured(self) -> bool:
        return bool(self.anthropic_api_key and self.anthropic_api_key.startswith("sk-ant-"))
    
    # =========================================================================
    # AUTHENTICATION
    # =========================================================================
    
    jwt_secret_key: str = Field(
        default_factory=lambda: secrets.token_hex(32),
        description="Secret key for JWT token signing"
    )
    jwt_expiration_minutes: int = Field(
        default=480,
        description="JWT token expiration time in minutes"
    )
    jwt_algorithm: str = Field(default="HS256")
    
    # API Keys for service auth
    api_service_key: Optional[str] = Field(
        default=None,
        description="API key for service-to-service authentication"
    )
    admin_api_key: Optional[str] = Field(
        default=None,
        description="API key for admin dashboard access"
    )
    
    @field_validator("jwt_secret_key")
    @classmethod
    def validate_jwt_secret(cls, v: str, info) -> str:
        # In production, require a proper secret
        if len(v) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters")
        return v
    
    # =========================================================================
    # DATABASE
    # =========================================================================
    
    database_url: Optional[str] = Field(
        default=None,
        description="PostgreSQL connection URL"
    )
    sql_echo: bool = Field(default=False)
    
    @property
    def database_url_async(self) -> Optional[str]:
        """Convert DATABASE_URL to async-compatible format"""
        if not self.database_url:
            return None
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url
    
    @property
    def is_database_configured(self) -> bool:
        return bool(self.database_url and "postgresql" in self.database_url)
    
    # =========================================================================
    # CORS
    # =========================================================================
    
    cors_origins: Optional[str] = Field(
        default=None,
        description="Comma-separated list of allowed CORS origins"
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins into list"""
        if self.cors_origins:
            return [o.strip() for o in self.cors_origins.split(",") if o.strip()]
        
        # Default origins for known deployments
        return [
            "https://quirk-ai-kiosk.railway.app",
            "https://quirk-ai-kiosk.netlify.app",
            "https://quirk-ai-kiosk.vercel.app",
            "https://quirk-frontend-production.up.railway.app",
            "https://quirk-backend-production.up.railway.app",
        ]
    
    # =========================================================================
    # RATE LIMITING
    # =========================================================================
    
    ai_rate_limit_per_minute: int = Field(
        default=30,
        description="AI chat requests per minute per session"
    )
    api_rate_limit_per_minute: int = Field(
        default=100,
        description="General API requests per minute per IP"
    )
    
    # =========================================================================
    # EXTERNAL SERVICES
    # =========================================================================
    
    elevenlabs_api_key: Optional[str] = Field(default=None)
    elevenlabs_voice_id: Optional[str] = Field(default=None)
    
    pbs_api_key: Optional[str] = Field(default=None)
    pbs_api_url: Optional[str] = Field(default=None)
    
    crm_api_key: Optional[str] = Field(default=None)
    crm_api_url: Optional[str] = Field(default=None)
    
    # =========================================================================
    # MONITORING
    # =========================================================================
    
    sentry_dsn: Optional[str] = Field(default=None)
    log_level: str = Field(default="INFO")
    json_logging: bool = Field(default=True)
    
    # =========================================================================
    # FEATURE FLAGS
    # =========================================================================
    
    enable_analytics: bool = Field(default=True)
    enable_tts: bool = Field(default=True)
    enable_photo_analysis: bool = Field(default=True)


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    
    Settings are loaded once and cached for performance.
    Call get_settings.cache_clear() to reload.
    """
    return Settings()


# Convenience function for checking configuration at startup
def validate_settings() -> dict:
    """
    Validate settings and return status report.
    
    Returns dict with configuration status for logging.
    """
    settings = get_settings()
    
    return {
        "environment": settings.environment,
        "ai_configured": settings.is_ai_configured,
        "database_configured": settings.is_database_configured,
        "auth_configured": bool(settings.admin_api_key),
        "tts_configured": bool(settings.elevenlabs_api_key),
        "monitoring_configured": bool(settings.sentry_dsn),
        "warnings": _get_config_warnings(settings),
    }


def _get_config_warnings(settings: Settings) -> List[str]:
    """Generate configuration warnings"""
    warnings = []
    
    if not settings.is_ai_configured:
        warnings.append("ANTHROPIC_API_KEY not configured - AI will use fallback responses")
    
    if settings.is_production and not settings.admin_api_key:
        warnings.append("ADMIN_API_KEY not set - dashboard endpoints are unprotected")
    
    if settings.is_development:
        warnings.append("Running in DEVELOPMENT mode - not for production use")
    
    if not settings.is_database_configured:
        warnings.append("DATABASE_URL not configured - using JSON file storage")
    
    return warnings
