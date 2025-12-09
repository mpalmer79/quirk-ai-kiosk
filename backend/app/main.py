"""
Quirk AI Kiosk - FastAPI Main Application
Entry point for the kiosk backend API

Production-hardened with:
- Rate limiting
- Structured logging
- Global exception handling
- Secure CORS configuration
- Comprehensive health checks
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional
import os
import logging
import re
from html import escape

# Rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Configure structured logging
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
LOG_LEVEL = logging.DEBUG if os.getenv("ENVIRONMENT") == "development" else logging.INFO

logging.basicConfig(level=LOG_LEVEL, format=LOG_FORMAT)
logger = logging.getLogger("quirk_kiosk")

# Import routers - the original working routers
from app.routers import inventory, recommendations, leads, analytics, traffic, ai

# Import v2 routers
from app.routers import recommendations_v2, ai_v2

# Import v3 smart recommendations router
from app.routers import smart_recommendations

# Import database
from app.database import init_database, close_database, is_database_configured


# =============================================================================
# CUSTOM EXCEPTIONS
# =============================================================================

class AppException(Exception):
    """Base application exception for consistent error responses"""
    def __init__(
        self, 
        message: str, 
        code: str = "INTERNAL_ERROR", 
        status_code: int = 500,
        details: Optional[dict] = None
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class AIServiceException(AppException):
    """Raised when AI service is unavailable or fails"""
    def __init__(self, message: str = "AI service temporarily unavailable"):
        super().__init__(message, "AI_SERVICE_ERROR", 503)


class ValidationException(AppException):
    """Raised for input validation failures"""
    def __init__(self, message: str, field: Optional[str] = None):
        details = {"field": field} if field else {}
        super().__init__(message, "VALIDATION_ERROR", 400, details)


class RateLimitException(AppException):
    """Raised when rate limit is exceeded"""
    def __init__(self, message: str = "Too many requests. Please slow down."):
        super().__init__(message, "RATE_LIMIT_EXCEEDED", 429)


# =============================================================================
# INPUT SANITIZATION UTILITIES
# =============================================================================

def sanitize_user_input(text: str, max_length: int = 2000) -> str:
    """
    Sanitize user input before processing.
    
    Args:
        text: Raw user input
        max_length: Maximum allowed length
        
    Returns:
        Sanitized text safe for processing
    """
    if not text:
        return ""
    
    # Truncate to max length
    text = text[:max_length]
    
    # Remove control characters (except newlines and tabs)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    
    # Basic XSS prevention - escape HTML entities
    text = escape(text)
    
    return text.strip()


def sanitize_stock_number(stock: str) -> str:
    """Sanitize stock number input - alphanumeric only"""
    if not stock:
        return ""
    return re.sub(r'[^A-Za-z0-9\-]', '', stock)[:20]


def sanitize_phone(phone: str) -> str:
    """Sanitize phone number - digits only"""
    if not phone:
        return ""
    return re.sub(r'[^\d]', '', phone)[:15]


# =============================================================================
# RATE LIMITER SETUP
# =============================================================================

def get_client_identifier(request: Request) -> str:
    """
    Get client identifier for rate limiting.
    Uses X-Forwarded-For header if behind proxy, otherwise remote address.
    Also considers session ID for kiosk-specific limiting.
    """
    # Check for forwarded header (behind load balancer/proxy)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # Take the first IP in the chain
        client_ip = forwarded.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "unknown"
    
    # Optionally combine with session ID for more granular limiting
    session_id = request.headers.get("X-Session-ID", "")
    if session_id:
        return f"{client_ip}:{session_id}"
    
    return client_ip


limiter = Limiter(key_func=get_client_identifier)


# =============================================================================
# ENVIRONMENT & CORS CONFIGURATION
# =============================================================================

# Default to production for security - must explicitly set development
ENVIRONMENT = os.getenv("ENVIRONMENT", "production")
IS_DEVELOPMENT = ENVIRONMENT == "development"

def get_cors_origins() -> list:
    """
    Get CORS origins based on environment.
    Production requires explicit CORS_ORIGINS env var.
    """
    if IS_DEVELOPMENT:
        logger.warning("⚠️  Running in DEVELOPMENT mode - CORS allows all origins")
        return ["*"]
    
    # Production: use explicit allowlist
    default_origins = [
        "https://quirk-ai-kiosk.railway.app",
        "https://quirk-ai-kiosk.netlify.app",
        "https://quirk-ai-kiosk.vercel.app",
        "https://quirk-frontend-production.up.railway.app",
        "https://quirk-backend-production.up.railway.app",
    ]
    
    # Allow override via environment variable
    custom_origins = os.getenv("CORS_ORIGINS", "")
    if custom_origins:
        origins = [o.strip() for o in custom_origins.split(",") if o.strip()]
        logger.info(f"✅ CORS configured with {len(origins)} custom origins")
        return origins
    
    logger.info(f"✅ CORS configured with {len(default_origins)} default origins")
    return default_origins


# =============================================================================
# LIFESPAN HANDLER
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown handler"""
    # Startup
    logger.info("🚀 Quirk AI Kiosk API starting...")
    logger.info(f"📍 Environment: {ENVIRONMENT}")
    logger.info("📊 Loading inventory enrichment service...")
    logger.info("🧠 Initializing entity extraction service...")
    
    # Initialize database
    if is_database_configured():
        logger.info("🗄️  Connecting to PostgreSQL database...")
        db_success = await init_database()
        if db_success:
            logger.info("✅ PostgreSQL database connected")
        else:
            logger.warning("⚠️  PostgreSQL connection failed - using JSON fallback")
    else:
        logger.info("📁 No DATABASE_URL configured - using JSON file storage")
    
    # Verify critical configuration
    if not os.getenv("ANTHROPIC_API_KEY"):
        logger.warning("⚠️  ANTHROPIC_API_KEY not configured - AI chat will use fallback responses")
    else:
        logger.info("✅ Anthropic API key configured")
    
    logger.info("✅ All services initialized")
    yield
    
    # Shutdown
    logger.info("👋 Quirk AI Kiosk API shutting down...")
    await close_database()
    logger.info("✅ Cleanup complete")


# =============================================================================
# CREATE FASTAPI APPLICATION
# =============================================================================

app = FastAPI(
    title="Quirk AI Kiosk API",
    description="""
## Quirk AI Kiosk Backend API

Backend API for Quirk AI Kiosk customer journey with AI-powered recommendations.

### Features
- **V1**: Core inventory, recommendations, leads, analytics, traffic, AI chat
- **V2**: Enhanced recommendations with structured AI responses
- **V3**: Smart recommendations with entity extraction and conversation analysis

### Rate Limits
- AI Chat: 30 requests/minute
- Inventory: 100 requests/minute
- General: 200 requests/minute

### Authentication
Session-based identification via X-Session-ID header.
    """,
    version="2.3.0",
    lifespan=lifespan,
    docs_url="/docs" if IS_DEVELOPMENT else None,  # Disable docs in production
    redoc_url="/redoc" if IS_DEVELOPMENT else None,
    contact={
        "name": "Quirk IT Department",
        "email": "it@quirkchevrolet.com"
    },
)

# Add rate limiter to app state
app.state.limiter = limiter


# =============================================================================
# EXCEPTION HANDLERS
# =============================================================================

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Handle rate limit exceeded errors"""
    logger.warning(
        f"Rate limit exceeded: {get_client_identifier(request)} on {request.url.path}"
    )
    return JSONResponse(
        status_code=429,
        content={
            "error": "RATE_LIMIT_EXCEEDED",
            "message": "Too many requests. Please slow down.",
            "retry_after": 60
        },
        headers={"Retry-After": "60"}
    )


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handle custom application exceptions"""
    logger.error(
        f"AppException: {exc.code} - {exc.message}",
        extra={
            "path": request.url.path,
            "method": request.method,
            "code": exc.code,
            "details": exc.details
        }
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.code,
            "message": exc.message,
            "details": exc.details if IS_DEVELOPMENT else {}
        }
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions - don't leak internal details"""
    logger.exception(
        f"Unhandled exception on {request.method} {request.url.path}",
        exc_info=exc
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_ERROR",
            "message": "An unexpected error occurred. Please try again.",
            # Only show details in development
            "details": {"exception": str(exc)} if IS_DEVELOPMENT else {}
        }
    )


# =============================================================================
# MIDDLEWARE
# =============================================================================

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-RateLimit-Remaining"],
)


@app.middleware("http")
async def add_request_metadata(request: Request, call_next):
    """Add request ID and timing to all requests"""
    import time
    import uuid
    
    request_id = str(uuid.uuid4())[:8]
    start_time = time.time()
    
    # Add request ID to state for logging
    request.state.request_id = request_id
    
    response = await call_next(request)
    
    # Add headers
    process_time = time.time() - start_time
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{process_time:.3f}s"
    
    # Log request (skip health checks to reduce noise)
    if not request.url.path.endswith("/health"):
        logger.info(
            f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s",
            extra={"request_id": request_id}
        )
    
    return response


# =============================================================================
# ROUTES
# =============================================================================

# V1 Routes (Original)
app.include_router(inventory.router, prefix="/api/v1/inventory", tags=["inventory"])
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["recommendations"])
app.include_router(leads.router, prefix="/api/v1/leads", tags=["leads"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(traffic.router, prefix="/api/v1/traffic", tags=["traffic"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])

# V2 Routes (Enhanced)
app.include_router(recommendations_v2.router, prefix="/api/v2/recommendations", tags=["recommendations-v2"])
app.include_router(ai_v2.router, prefix="/api/v2/ai", tags=["ai-v2"])

# V3 Routes (Smart AI Recommendations)
app.include_router(smart_recommendations.router, prefix="/api/v3/smart", tags=["smart-recommendations"])


# =============================================================================
# CORE ENDPOINTS
# =============================================================================

@app.get("/")
async def root():
    """API root - service information"""
    return {
        "service": "Quirk AI Kiosk API",
        "status": "running",
        "version": "2.3.0",
        "environment": ENVIRONMENT,
        "docs": "/docs" if IS_DEVELOPMENT else "disabled",
        "features": {
            "v1": ["inventory", "recommendations", "leads", "analytics", "traffic", "ai"],
            "v2": ["enhanced-recommendations", "structured-ai"],
            "v3": ["smart-recommendations", "entity-extraction", "conversation-analysis"]
        },
        "storage": "postgresql" if is_database_configured() else "json"
    }


@app.get("/api/health")
async def health_check():
    """
    Comprehensive health check endpoint.
    
    Checks all service dependencies and returns detailed status.
    Used by load balancers and monitoring systems.
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "quirk-kiosk-api",
        "version": "2.3.0",
        "environment": ENVIRONMENT,
        "checks": {}
    }
    
    overall_healthy = True
    
    # Database check
    try:
        if is_database_configured():
            from app.database import test_connection
            db_ok = await test_connection()
            health_status["checks"]["database"] = {
                "status": "healthy" if db_ok else "unhealthy",
                "type": "postgresql"
            }
            if not db_ok:
                overall_healthy = False
        else:
            health_status["checks"]["database"] = {
                "status": "healthy",
                "type": "json_fallback"
            }
    except Exception as e:
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "error": str(e) if IS_DEVELOPMENT else "connection_failed"
        }
        overall_healthy = False
    
    # AI Service check
    anthropic_configured = bool(os.getenv("ANTHROPIC_API_KEY"))
    health_status["checks"]["ai_service"] = {
        "status": "configured" if anthropic_configured else "fallback_mode",
        "provider": "anthropic"
    }
    
    # Inventory check
    try:
        from app.routers.inventory import get_vehicle_count
        vehicle_count = get_vehicle_count()
        health_status["checks"]["inventory"] = {
            "status": "healthy",
            "vehicle_count": vehicle_count
        }
    except Exception as e:
        health_status["checks"]["inventory"] = {
            "status": "degraded",
            "error": str(e) if IS_DEVELOPMENT else "load_error"
        }
    
    # Set overall status
    if not overall_healthy:
        health_status["status"] = "unhealthy"
    elif not anthropic_configured:
        health_status["status"] = "degraded"
    
    return health_status


@app.get("/api/health/live")
async def liveness_check():
    """
    Kubernetes liveness probe.
    Simple check that the service is running.
    """
    return {"status": "alive"}


@app.get("/api/health/ready")
async def readiness_check():
    """
    Kubernetes readiness probe.
    Checks if service is ready to accept traffic.
    """
    # Check database connectivity
    if is_database_configured():
        try:
            from app.database import test_connection
            if not await test_connection():
                return JSONResponse(
                    status_code=503,
                    content={"status": "not_ready", "reason": "database_unavailable"}
                )
        except Exception:
            return JSONResponse(
                status_code=503,
                content={"status": "not_ready", "reason": "database_error"}
            )
    
    return {"status": "ready"}


# =============================================================================
# UTILITY EXPORTS (for use in routers)
# =============================================================================

# Export utilities for use in other modules
__all__ = [
    "app",
    "limiter",
    "AppException",
    "AIServiceException",
    "ValidationException",
    "RateLimitException",
    "sanitize_user_input",
    "sanitize_stock_number",
    "sanitize_phone",
    "IS_DEVELOPMENT",
    "ENVIRONMENT",
]


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=IS_DEVELOPMENT,
        log_level="debug" if IS_DEVELOPMENT else "info",
        access_log=IS_DEVELOPMENT,
    )
