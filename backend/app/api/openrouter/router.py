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
        active_key = key_manager.get_active_key()
        if not active_key:
            logger.info("No active API key, returning default models list")
            # Return a default list of popular models when no API key is available
            return ModelsResponse(data=[
                {
                    "id": "gpt-4",
                    "name": "GPT-4",
                    "description": "Most capable GPT-4 model, great at tasks that require creativity and advanced reasoning",
                    "context_length": 8192,
                    "top_provider": "OpenAI"
                },
                {
                    "id": "gpt-3.5-turbo",
                    "name": "GPT-3.5 Turbo",
                    "description": "A good balance between performance and cost",
                    "context_length": 4096,
                    "top_provider": "OpenAI"
                },
                {
                    "id": "claude-3-opus",
                    "name": "Claude 3 Opus",
                    "description": "Most capable Claude model, with improved accuracy and skills across tasks",
                    "context_length": 200000,
                    "top_provider": "Anthropic"
                },
                {
                    "id": "claude-3-sonnet",
                    "name": "Claude 3 Sonnet",
                    "description": "Balanced performance and speed",
                    "context_length": 200000,
                    "top_provider": "Anthropic"
                },
                {
                    "id": "mistral-large",
                    "name": "Mistral Large",
                    "description": "Mistral's most capable model",
                    "context_length": 32768,
                    "top_provider": "Mistral"
                }
            ])
        
        logger.info(f"Fetching models from OpenRouter with API key {active_key[:4]}...")
        try:
            models_response = await openrouter_client.get_models()
            logger.info(f"Successfully retrieved {len(models_response.data)} models from OpenRouter")
            return models_response
        except Exception as model_error:
            logger.error(f"Error fetching models from OpenRouter: {str(model_error)}")
            # Fall back to default models if API call fails
            logger.info("Falling back to default models list due to API error")
            return ModelsResponse(data=[
                {
                    "id": "gpt-3.5-turbo",
                    "name": "GPT-3.5 Turbo (Fallback)",
                    "description": "A good balance between performance and cost",
                    "context_length": 4096,
                    "top_provider": "OpenAI"
                }
            ])
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
        active_key = key_manager.get_active_key()
        if not active_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No OpenRouter API key provided. Please add an API key first."
            )
        
        # Ensure the client has the latest active key
        openrouter_client.api_key = active_key
        
        logger.info(f"Using API key: {active_key[:4]}...{active_key[-4:]}")
        logger.info(f"Request model: {request.model}")
        
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
            # Also ensure the client instance has the key set
            openrouter_client.api_key = key
            logger.info(f"Set active API key and updated openrouter_client: {key[:4]}...{key[-4:]}")
            
            # Test the key to make sure it works
            try:
                logger.info("Testing API key with a simple request...")
                await openrouter_client.get_models()
                logger.info("API key test passed!")
            except Exception as e:
                logger.warning(f"API key test warning: {str(e)}")
                # We don't fail here, just log the warning
            
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


@router.get("/diagnostic")
async def diagnostic():
    """Diagnostic endpoint to check API key configuration"""
    active_key = key_manager.get_active_key()
    client_key = openrouter_client.api_key
    
    # Check if keys match
    keys_match = active_key == client_key
    
    # Format keys for safe display
    formatted_active = f"{active_key[:4]}...{active_key[-4:]}" if active_key else "None"
    formatted_client = f"{client_key[:4]}...{client_key[-4:]}" if client_key else "None"
    
    return {
        "status": "ok",
        "active_key_exists": bool(active_key),
        "client_key_exists": bool(client_key),
        "keys_match": keys_match,
        "active_key": formatted_active,
        "client_key": formatted_client,
        "settings_key": formatted_active,  # Same as active key
        "keys_in_storage": len(key_manager._read_keys())
    } 