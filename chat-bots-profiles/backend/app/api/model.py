from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from app.models import (
    get_model_categories,
    get_models_by_category,
    get_model_details,
    fetch_openrouter_models,
    refresh_models
)

router = APIRouter(tags=["models"])


@router.get("/refresh", response_model=Dict[str, Dict[str, Any]])
async def refresh_model_data():
    """
    Refresh model data from OpenRouter
    
    Returns:
        Updated models data
    """
    return refresh_models()


@router.get("/categories", response_model=List[str])
async def get_categories():
    """
    Get all model categories
    
    Returns:
        List of model categories
    """
    return get_model_categories()


@router.get("/category/{category}", response_model=Dict[str, Dict[str, Any]])
async def get_models_in_category(category: str):
    """
    Get models in a specific category
    
    Args:
        category: Category name
        
    Returns:
        Dictionary of models in the specified category
    """
    return get_models_by_category(category)


@router.get("/{model_id}", response_model=Dict[str, Any])
async def get_model(model_id: str):
    """
    Get details for a specific model
    
    Args:
        model_id: Model ID
        
    Returns:
        Model details
    """
    try:
        return get_model_details(model_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")


@router.get("/", response_model=Dict[str, Dict[str, Any]])
async def get_models():
    """
    Get all available models
    
    Returns:
        Dictionary of models with their details
    """
    return fetch_openrouter_models() 