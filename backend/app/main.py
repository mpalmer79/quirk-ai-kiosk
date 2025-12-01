"""
QUIRK AI Kiosk - Backend API Gateway
Main application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routers import inventory, recommendations, leads, analytics
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    # Startup
    print(f"🚀 QUIRK AI Kiosk Backend starting on {settings.HOST}:{settings.PORT}")
    print(f"📊 Environment: {settings.ENVIRONMENT}")
    yield
    # Shutdown
    print("👋 QUIRK AI Kiosk Backend shutting down")


app = FastAPI(
    title="QUIRK AI Kiosk API",
    description="Backend API Gateway for the QUIRK AI Kiosk system",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
            allow_origin_regex=r"https://.*\.app\.github\.dev",


    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(inventory.router, prefix="/api/v1/inventory", tags=["Inventory"])
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["AI Recommendations"])
app.include_router(leads.router, prefix="/api/v1/leads", tags=["CRM Leads"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])


@app.get("/")
async def root():
    """Root endpoint - API info"""
    return {
        "name": "QUIRK AI Kiosk API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs" if settings.ENVIRONMENT == "development" else "disabled",
    }


@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "quirk-ai-kiosk-backend",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
    )
