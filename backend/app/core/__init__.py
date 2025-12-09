"""
Core utilities and services for the Quirk AI Kiosk backend.
"""

from .exceptions import (
    AppException,
    AIServiceException,
    ValidationException,
    RateLimitException,
    NotFoundError,
    DatabaseError,
)
from .security import get_key_manager, APIKeyManager
from .logging import setup_logging, get_logger
from .cache import CacheService, get_cache

__all__ = [
    # Exceptions
    "AppException",
    "AIServiceException", 
    "ValidationException",
    "RateLimitException",
    "NotFoundError",
    "DatabaseError",
    # Security
    "get_key_manager",
    "APIKeyManager",
    # Logging
    "setup_logging",
    "get_logger",
    # Cache
    "CacheService",
    "get_cache",
]
