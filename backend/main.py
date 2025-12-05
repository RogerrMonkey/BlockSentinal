from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.logging_config import setup_logging
from app.api import scans

# Setup logging
setup_logging(settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("Starting BlockSentinel API...")
    
    # Create tables
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("[OK] Database tables created successfully")
    except Exception as e:
        logger.error(f"[ERROR] Failed to create database tables: {e}")
        raise
    
    yield
    
    logger.info("Shutting down BlockSentinel API...")


# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Smart Contract Vulnerability Scanner",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(scans.router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "BlockSentinel API",
        "version": settings.VERSION,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint"""
    health_status = {
        "status": "healthy",
        "version": settings.VERSION,
        "database": "unknown",
        "slither": "unknown"
    }
    
    # Check database connection
    try:
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        health_status["database"] = "connected"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health_status["database"] = "error"
        health_status["status"] = "degraded"
    
    # Check Docker for Slither
    try:
        import subprocess
        result = subprocess.run(
            ["docker", "info"],
            capture_output=True,
            timeout=5
        )
        if result.returncode == 0:
            health_status["slither"] = "docker-available"
        else:
            health_status["slither"] = "docker-unavailable"
    except Exception as e:
        logger.warning(f"Docker check failed: {e}")
        health_status["slither"] = "check-failed"
    
    return health_status


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
