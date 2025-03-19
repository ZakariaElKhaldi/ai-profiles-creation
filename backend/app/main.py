import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import uvicorn

from app.api.openrouter.router import router as openrouter_router
from app.api.documents.router import router as documents_router
from app.api.profiles.router import router as profiles_router
from app.core.config import settings

# Initialize the FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(openrouter_router, prefix=f"{settings.API_PREFIX}/openrouter", tags=["OpenRouter"])
app.include_router(documents_router, prefix=f"{settings.API_PREFIX}/documents", tags=["Documents"])
app.include_router(profiles_router, prefix=f"{settings.API_PREFIX}/profiles", tags=["Profiles"])

# Root route handler
@app.get("/")
async def root():
    """Redirect root URL to API documentation"""
    return RedirectResponse(url="/api/docs")

# Health check endpoint
@app.get(f"{settings.API_PREFIX}/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "version": settings.VERSION}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 