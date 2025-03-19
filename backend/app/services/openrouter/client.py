import httpx
import json
from typing import Dict, List, Optional, Any
import logging
from datetime import datetime

from backend.app.models.openrouter import (
    CompletionRequest, 
    CompletionResponse, 
    ModelsResponse,
    Message
)
from backend.app.core.config import settings

logger = logging.getLogger(__name__)


class OpenRouterClient:
    """Client for interacting with the OpenRouter API"""
    
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or settings.OPENROUTER_API_KEY
        self.base_url = base_url or settings.OPENROUTER_BASE_URL
        
        if not self.api_key:
            logger.warning("OpenRouter API key not provided. API calls will fail.")
        
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ai-profiles-app.com",  # Replace with actual domain in production
            "X-Title": settings.PROJECT_NAME
        }
    
    async def get_models(self) -> ModelsResponse:
        """Get available models from OpenRouter"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/models",
                headers=self.headers,
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to get models: {response.text}")
                response.raise_for_status()
            
            return ModelsResponse(data=response.json())
    
    async def create_completion(self, request: CompletionRequest) -> CompletionResponse:
        """Create a chat completion using OpenRouter"""
        async with httpx.AsyncClient() as client:
            start_time = datetime.now()
            
            logger.info(f"Sending completion request to OpenRouter with model: {request.model}")
            
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=request.dict(),
                timeout=60.0
            )
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            if response.status_code != 200:
                logger.error(f"OpenRouter API error: {response.text}")
                response.raise_for_status()
            
            logger.info(f"Received response in {duration:.2f}s")
            
            return CompletionResponse(**response.json())
    
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