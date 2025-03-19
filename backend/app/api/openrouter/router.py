from fastapi import APIRouter, HTTPException, Depends, Body, Query, status
from typing import List, Optional
import logging

from app.models.openrouter import (
    CompletionRequest, 
    CompletionResponse, 
    ModelsResponse,
    APIKeyResponse,
    APIKeyListResponse
)
from app.services.openrouter.client import openrouter_client
from app.services.openrouter.key_manager import key_manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/models", response_model=ModelsResponse)
async def get_models():
    """Get available models from OpenRouter"""
    try:
        if not key_manager.get_active_key():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No OpenRouter API key provided. Please add an API key first."
            )
            
        return await openrouter_client.get_models()
    except Exception as e:
        logger.error(f"Error getting models: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get models: {str(e)}"
        )


@router.post("/chat/completions", response_model=CompletionResponse)
async def create_completion(request: CompletionRequest):
    """Create a chat completion using OpenRouter"""
    try:
        if not key_manager.get_active_key():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No OpenRouter API key provided. Please add an API key first."
            )
            
        return await openrouter_client.create_completion(request)
    except Exception as e:
        logger.error(f"Error creating completion: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create completion: {str(e)}"
        )


@router.get("/keys", response_model=APIKeyListResponse)
async def list_keys():
    """List all stored API keys (masked)"""
    try:
        return key_manager.get_keys()
    except Exception as e:
        logger.error(f"Error listing keys: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list API keys: {str(e)}"
        )


@router.post("/keys", response_model=APIKeyResponse)
async def add_key(key: str = Body(..., embed=True)):
    """Add a new OpenRouter API key"""
    try:
        return key_manager.add_key(key)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error adding key: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add API key: {str(e)}"
        )


@router.delete("/keys/{key}")
async def delete_key(key: str):
    """Delete an OpenRouter API key"""
    try:
        if key_manager.delete_key(key):
            return {"message": "API key deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )
    except Exception as e:
        logger.error(f"Error deleting key: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete API key: {str(e)}"
        )


@router.post("/keys/active")
async def set_active_key(key: str = Body(..., embed=True)):
    """Set the active OpenRouter API key"""
    try:
        if key_manager.set_active_key(key):
            return {"message": "Active API key set successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to set active API key"
            )
    except Exception as e:
        logger.error(f"Error setting active key: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set active API key: {str(e)}"
        )


@router.get("/keys/active")
async def get_active_key():
    """Get information about the currently active API key"""
    active_key = key_manager.get_active_key()
    if not active_key:
        return {"active": False, "message": "No active API key set"}
    
    return {
        "active": True,
        "key": f"{active_key[:4]}...{active_key[-4:]}" if active_key else None
    } 