"""
Database configuration and connection management for PostgreSQL.
Uses SQLAlchemy async with asyncpg driver.
"""
import os
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text

logger = logging.getLogger("quirk_kiosk.database")

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Convert postgres:// to postgresql+asyncpg:// for SQLAlchemy async
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Create async engine
engine = None
async_session_factory = None
Base = declarative_base()


def is_database_configured() -> bool:
    """Check if database is configured."""
    return bool(DATABASE_URL and DATABASE_URL.startswith("postgresql"))


async def init_database():
    """Initialize database connection and create tables."""
    global engine, async_session_factory
    
    if not is_database_configured():
        logger.warning("DATABASE_URL not configured - using fallback JSON storage")
        return False
    
    try:
        engine = create_async_engine(
            DATABASE_URL,
            echo=os.getenv("SQL_ECHO", "false").lower() == "true",
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,
        )
        
        async_session_factory = async_sessionmaker(
            engine, 
            class_=AsyncSession, 
            expire_on_commit=False
        )
        
        # Create tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("✅ PostgreSQL database connected and tables created")
        return True
        
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        engine = None
        async_session_factory = None
        return False


async def close_database():
    """Close database connection."""
    global engine
    if engine:
        await engine.dispose()
        logger.info("Database connection closed")


async def get_session() -> AsyncSession:
    """Get a database session."""
    if async_session_factory is None:
        raise RuntimeError("Database not initialized")
    async with async_session_factory() as session:
        yield session


async def test_connection() -> bool:
    """Test database connection."""
    if not engine:
        return False
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False
