"""
Quirk AI Kiosk - FastAPI Main Application
Entry point for the kiosk backend API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("quirk_kiosk")

# Import routers - the original working routers
from app.routers import inventory, recommendations, leads, analytics, traffic, ai

# Import v2 routers
from app.routers import recommendations_v2, ai_v2

# Import v3 smart recommendations router
from app.routers import smart_recommendations

# Import database
from app.database import init_database, close_database, is_database_configured


# Lifespan handler for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Quirk AI Kiosk API starting...")
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
    
    logger.info("✅ All services initialized")
    yield
    
    # Shutdown
    logger.info("👋 Quirk AI Kiosk API shutting down...")
    await close_database()


# Create FastAPI app
app = FastAPI(
    title="Quirk AI Kiosk API",
    description="Backend API for Quirk AI Kiosk customer journey with AI-powered recommendations",
    version="2.2.0",
    lifespan=lifespan
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "https://quirk-ai-kiosk.railway.app",
    "https://quirk-ai-kiosk.netlify.app",
    "https://quirk-ai-kiosk.vercel.app",
    "https://quirk-frontend-production.up.railway.app",
    "https://quirk-backend-production.up.railway.app",
]

# Allow all origins in development
if os.getenv("ENVIRONMENT", "development") == "development":
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


# Root endpoint
@app.get("/")
async def root():
    return {
        "service": "Quirk AI Kiosk API",
        "status": "running",
        "docs": "/docs",
        "version": "2.2.0",
        "features": {
            "v1": ["inventory", "recommendations", "leads", "analytics", "traffic", "ai"],
            "v2": ["enhanced-recommendations", "structured-ai"],
            "v3": ["smart-recommendations", "entity-extraction", "conversation-analysis"]
        },
        "storage": "postgresql" if is_database_configured() else "json"
    }


# Health check at /api/health
@app.get("/api/health")
async def health_check():
    from datetime import datetime
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "quirk-kiosk-api",
        "version": "2.2.0",
        "components": {
            "inventory": "ok",
            "ai": "ok",
            "recommendations": "ok",
            "smart_recommendations": "ok",
            "entity_extraction": "ok",
            "database": "postgresql" if is_database_configured() else "json_fallback"
        }
    }


# Run with uvicorn
if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=os.getenv("ENVIRONMENT", "development") == "development"
    )
