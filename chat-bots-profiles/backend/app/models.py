"""
Configuration for dynamically fetching AI models from OpenRouter

This module provides functionality to fetch, cache, and categorize AI models
from the OpenRouter API, with fallback options for when the API is unavailable.
"""
import requests
import json
import os
import time
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# OpenRouter API endpoint for models
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/models"

# Model Categories
MODEL_CATEGORIES = {
    "General Purpose": "Models balanced for everyday tasks with good performance and cost",
    "Advanced": "More powerful models with superior reasoning and capabilities",
    "Specialized": "Models optimized for specific tasks or domains"
}

# Default model for the application
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "openai/gpt-3.5-turbo")

# Cache settings
_model_cache = {}
_last_fetch_time = 0
CACHE_DURATION = 3600  # Cache duration in seconds (1 hour)

def categorize_model(model_info: Dict[str, Any]) -> str:
    """Categorize a model based on its pricing and capabilities
    
    Args:
        model_info: Dictionary containing model information
        
    Returns:
        Category string
    """
    # Get pricing info if available
    pricing = model_info.get("pricing", {})
    input_price = pricing.get("input", 0) if isinstance(pricing, dict) else 0
    
    # Categorization logic based on model ID and pricing
    model_id = model_info.get("id", "").lower()
    
    # Advanced models
    if any(name in model_id for name in ["gpt-4", "claude-3-opus", "claude-3-sonnet", "gemini-1.5"]):
        return "Advanced"
    # Specialized models
    elif any(name in model_id for name in ["command", "pplx", "wizardlm", "codellama"]):
        return "Specialized"
    # High-priced models are typically more advanced
    elif input_price > 0.003:
        return "Advanced"
    # Default to general purpose
    else:
        return "General Purpose"

def fetch_openrouter_models(use_cache: bool = True) -> Dict[str, Dict[str, Any]]:
    """Fetch models from OpenRouter API with caching
    
    Args:
        use_cache: Whether to use cached data if available
        
    Returns:
        Dictionary of model data
    """
    global _model_cache, _last_fetch_time
    
    # Use cache if enabled and cache is fresh
    current_time = time.time()
    if use_cache and _model_cache and (current_time - _last_fetch_time) < CACHE_DURATION:
        return _model_cache
    
    try:
        # Get API key from environment
        api_key = os.environ.get("OPENROUTER_API_KEY", "")
        
        if not api_key:
            print("Warning: OPENROUTER_API_KEY not found in environment variables")
            return _get_fallback_models()
        
        # Set up headers
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Make API request
        response = requests.get(OPENROUTER_API_URL, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Parse response
        api_data = response.json()
        api_models = api_data.get("data", [])
        
        # Format models to match our structure
        formatted_models = {}
        for model in api_models:
            model_id = model.get("id")
            if not model_id:
                continue
                
            # Extract model name and provider
            name_parts = model_id.split("/")
            provider = name_parts[0] if len(name_parts) > 1 else "Unknown"
            display_name = model.get("name", name_parts[-1])
            
            # Determine category
            category = categorize_model(model)
            
            # Extract pricing information
            pricing_info = model.get("pricing", {})
            if isinstance(pricing_info, dict):
                input_price = pricing_info.get("input", 0)
                output_price = pricing_info.get("output", 0)
                price_str = f"${input_price:.6f} / 1K input tokens, ${output_price:.6f} / 1K output tokens"
            else:
                price_str = "Pricing information unavailable"
            
            # Format model information
            formatted_models[model_id] = {
                "name": display_name,
                "provider": provider.capitalize(),
                "description": model.get("description", f"{display_name} by {provider}"),
                "context_window": model.get("context_length", 4096),
                "strengths": model.get("strengths", ["General capabilities"]),
                "pricing": price_str,
                "category": category,
                "recommended_for": model.get("recommended_for", ["General use"]),
                "image": f"https://openrouter.ai/api/v1/models/{model_id}/logo"
            }
        
        # Update cache
        _model_cache = formatted_models
        _last_fetch_time = current_time
        
        return formatted_models
        
    except Exception as e:
        print(f"Error fetching models from OpenRouter: {e}")
        # If cache is available but expired, still use it in case of failure
        if _model_cache:
            print("Using expired cache due to API error")
            return _model_cache
        # Otherwise use fallback models
        return _get_fallback_models()

def _get_fallback_models() -> Dict[str, Dict[str, Any]]:
    """Get fallback models when API is unavailable
    
    Returns:
        Dictionary of fallback model data
    """
    return {
        "openai/gpt-3.5-turbo": {
            "name": "GPT-3.5 Turbo",
            "provider": "OpenAI",
            "description": "Fast, affordable, and versatile model for general-purpose tasks",
            "context_window": 16385,
            "strengths": ["Fast responses", "Cost-effective", "Good general knowledge"],
            "pricing": "$0.0015 / 1K tokens",
            "category": "General Purpose",
            "recommended_for": ["Simple queries", "Drafting", "General assistance"],
            "image": "https://openrouter.ai/api/v1/models/openai/gpt-3.5-turbo/logo"
        },
        "openai/gpt-4o": {
            "name": "GPT-4o",
            "provider": "OpenAI",
            "description": "OpenAI's most advanced model with enhanced reasoning capabilities",
            "context_window": 128000,
            "strengths": ["Strong reasoning", "Knowledge of events up to 2023", "Long context"],
            "pricing": "$0.005 / 1K tokens",
            "category": "Advanced",
            "recommended_for": ["Complex tasks", "Research assistance", "Creative writing"],
            "image": "https://openrouter.ai/api/v1/models/openai/gpt-4o/logo"
        },
        "anthropic/claude-3-opus": {
            "name": "Claude 3 Opus",
            "provider": "Anthropic",
            "description": "Anthropic's most powerful model with exceptional reasoning and language understanding",
            "context_window": 200000,
            "strengths": ["Top-tier reasoning", "Nuanced responses", "Long context", "Factual accuracy"],
            "pricing": "$0.015 / 1K tokens",
            "category": "Advanced",
            "recommended_for": ["Complex reasoning", "Scientific research", "Detailed analysis"],
            "image": "https://openrouter.ai/api/v1/models/anthropic/claude-3-opus/logo"
        }
    }

def get_model_details(model_id: str) -> Dict[str, Any]:
    """Get detailed information about a specific model
    
    Args:
        model_id: Model identifier
        
    Returns:
        Model information dictionary
    """
    models = fetch_openrouter_models()
    return models.get(model_id, {})

def get_models_by_category(category: Optional[str] = None) -> Dict[str, Dict[str, Any]]:
    """Get models filtered by category or all if no category specified
    
    Args:
        category: Optional category to filter models by
        
    Returns:
        Dictionary of filtered models
    """
    models = fetch_openrouter_models()
    
    if not category:
        return models
    
    return {
        model_id: model_info 
        for model_id, model_info in models.items() 
        if model_info.get("category") == category
    }

def refresh_models() -> Dict[str, Dict[str, Any]]:
    """Force refresh of models data from API
    
    Returns:
        Updated models dictionary
    """
    return fetch_openrouter_models(use_cache=False)

def get_available_model_ids() -> List[str]:
    """Get list of all available model IDs
    
    Returns:
        List of model IDs
    """
    return list(fetch_openrouter_models().keys())

def get_model_display_names() -> Dict[str, str]:
    """Get mapping of model IDs to display names
    
    Returns:
        Dictionary mapping model IDs to display names
    """
    models = fetch_openrouter_models()
    return {model_id: info["name"] for model_id, info in models.items()}

def get_model_categories() -> List[str]:
    """Get list of available model categories
    
    Returns:
        List of category names
    """
    return list(MODEL_CATEGORIES.keys()) 