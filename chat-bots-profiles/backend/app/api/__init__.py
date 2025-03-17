"""
API routers for the application.
"""
from fastapi import APIRouter
from app.api.chat import router as chat_router
from app.api.document import router as document_router
from app.api.profile import router as profile_router
from app.api.model import router as model_router
from app.api.dataset import router as dataset_router
from app.api.tag import router as tag_router

# Create the main API router
api_router = APIRouter(prefix="/api")

# Include all routers
api_router.include_router(chat_router, prefix="/chat", tags=["chat"])
api_router.include_router(document_router, prefix="/documents", tags=["documents"])
api_router.include_router(profile_router, prefix="/profiles", tags=["profiles"])
api_router.include_router(model_router, prefix="/models", tags=["models"])
api_router.include_router(dataset_router, prefix="/datasets", tags=["datasets"])
api_router.include_router(tag_router, prefix="/tags", tags=["tags"]) 