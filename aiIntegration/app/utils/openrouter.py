import httpx
import json
import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings

# Set up logging
logger = logging.getLogger(__name__)

class OpenRouterClient:
    """
    Client for interacting with the OpenRouter API
    """
    def __init__(self, api_key: str = None):
        """
        Initialize the OpenRouter client
        
        Args:
            api_key: API key for OpenRouter, defaults to the one in settings
        """
        self.api_key = api_key or settings.OPENROUTER_API_KEY
        self.api_url = settings.OPENROUTER_API_URL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": settings.OPENROUTER_REFERER,
            "Content-Type": "application/json"
        }

    async def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        model: str = None,
        max_tokens: int = None,
        temperature: float = None,
        user: str = "anonymous"
    ) -> Optional[Dict[str, Any]]:
        """
        Generate a response using the OpenRouter API.
        
        Args:
            messages: List of message objects with role and content
            model: Model identifier to use
            max_tokens: Maximum tokens to generate
            temperature: Randomness of generation (0-1)
            user: User identifier for tracking
            
        Returns:
            Response from the API or None if failed
        """
        try:
            # Use default settings if not specified
            model = model or settings.DEFAULT_MODEL
            max_tokens = max_tokens or settings.MAX_TOKENS
            temperature = temperature or settings.TEMPERATURE
            
            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "user": user
            }
            
            logger.debug(f"Sending request to OpenRouter: {json.dumps(payload)}")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.api_url,
                    headers=self.headers,
                    json=payload,
                    timeout=30.0
                )
                
                response.raise_for_status()
                result = response.json()
                logger.debug(f"OpenRouter response: {json.dumps(result)}")
                
                return result
                
        except httpx.HTTPError as e:
            logger.error(f"HTTP error occurred: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response text: {e.response.text}")
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            
        return None 