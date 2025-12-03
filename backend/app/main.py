"""
Quirk AI Kiosk - FastAPI Main Application
Entry point for the kiosk backend API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

# Import routers - the original working routers
from app.routers import inventory, recommendations, leads, analytics, traffic

# Lifespan handler for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Quirk AI Kiosk API starting...")
    yield
    # Shutdown
    print("👋 Quirk AI Kiosk API shutting down...")

# Create FastAPI app
app = FastAPI(
    title="Quirk AI Kiosk API",
    description="Backend API for Quirk AI Kiosk customer journey",
    version="1.0.0",
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

# Include routers with /api/v1 prefix (this is what the frontend expects)
app.include_router(inventory.router, prefix="/api/v1/inventory", tags=["inventory"])
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["recommendations"])
app.include_router(leads.router, prefix="/api/v1/leads", tags=["leads"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(traffic.router, prefix="/api/v1/traffic", tags=["traffic"])

# Root endpoint
@app.get("/")
async def root():
    return {
        "service": "Quirk AI Kiosk API",
        "status": "running",
        "docs": "/docs",
        "version": "1.0.0"
    }

# Health check at /api/health
@app.get("/api/health")
async def health_check():
    from datetime import datetime
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "quirk-kiosk-api"
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
