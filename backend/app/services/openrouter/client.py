import httpx
import json
from typing import Dict, List, Optional, Any
import logging
from datetime import datetime

from app.models.openrouter import (
    CompletionRequest, 
    CompletionResponse, 
    ModelsResponse,
    Message
)
from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenRouterClient:
    """Client for interacting with the OpenRouter API"""
    
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or settings.OPENROUTER_API_KEY
        self.base_url = base_url or "https://openrouter.ai/api/v1"
        
        if not self.api_key:
            logger.warning("OpenRouter API key not provided. API calls will fail.")
            
        # Validate API key format
        if self.api_key and not (self.api_key.startswith('sk-or-') or self.api_key.startswith('sk-')):
            logger.error("Invalid API key format")
            raise ValueError("Invalid API key format. OpenRouter keys should start with 'sk-or-' or 'sk-'")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers with current API key"""
        if not self.api_key:
            raise ValueError("No API key provided")
            
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ai-profiles-app.com",  # Replace with actual domain in production
            "X-Title": settings.PROJECT_NAME
        }
    
    async def get_models(self) -> ModelsResponse:
        """Get available models from OpenRouter"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/models",
                    headers=self._get_headers()
                )
                
                if response.status_code != 200:
                    logger.error(f"Failed to get models: {response.text}")
                    response.raise_for_status()
                
                return ModelsResponse(data=response.json())
        except httpx.RequestError as e:
            logger.error(f"Network error while getting models: {str(e)}")
            raise
    
    async def create_completion(self, request: CompletionRequest) -> CompletionResponse:
        """Create a chat completion using OpenRouter"""
        try:
            if not self.api_key:
                raise ValueError("No API key provided")
                
            async with httpx.AsyncClient(timeout=60.0) as client:
                start_time = datetime.now()
                
                logger.info(f"Sending completion request to OpenRouter with model: {request.model}")
                
                # Convert Pydantic model to dict
                request_dict = request.dict(exclude_none=True)
                
                # Log request details for debugging
                logger.debug(f"Request URL: {self.base_url}/chat/completions")
                logger.debug(f"Request headers: {self._get_headers()}")
                logger.debug(f"Request body: {request_dict}")
                
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self._get_headers(),
                    json=request_dict
                )
                
                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()
                
                if response.status_code != 200:
                    error_text = response.text
                    logger.error(f"OpenRouter API error: {error_text}")
                    raise httpx.HTTPError(f"OpenRouter API error: {error_text}")
                
                logger.info(f"Received response in {duration:.2f}s")
                
                return CompletionResponse(**response.json())
        except httpx.RequestError as e:
            logger.error(f"Network error while creating completion: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error creating completion: {str(e)}")
            raise
    
    async def simple_completion(
        self, 
        model: str, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7
    ) -> str:
        """Simplified method to get completion text directly"""
        formatted_messages = [Message(**msg) for msg in messages]
        
        request = CompletionRequest(
            model=model,
            messages=formatted_messages,
            temperature=temperature
        )
        
        response = await self.create_completion(request)
        
        if not response.choices:
            raise ValueError("No completion choices returned")
            
        return response.choices[0].message.content


# Create a global client instance
openrouter_client = OpenRouterClient() 