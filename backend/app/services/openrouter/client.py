import httpx
import json
from typing import Dict, List, Optional, Any
import logging
from datetime import datetime
from fastapi import HTTPException

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
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers with current API key"""
        if not self.api_key:
            logger.error("No API key available for OpenRouter request")
            raise ValueError("No API key provided")
        
        # Always use the latest key from settings
        api_key = self.api_key or settings.OPENROUTER_API_KEY
        
        if not api_key:
            logger.error("No API key found in client or settings")
            raise ValueError("No API key available")
            
        # Log the key being used (safely)
        logger.debug(f"Using OpenRouter API key: {api_key[:4]}...{api_key[-4:]}")
            
        return {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ai-profiles-app.com",  # Replace with actual domain in production
            "X-Title": settings.PROJECT_NAME
        }
    
    async def get_models(self) -> ModelsResponse:
        """Get available models from OpenRouter"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = self._get_headers()
                logger.debug(f"Request headers: {json.dumps({k: v if k != 'Authorization' else '[REDACTED]' for k, v in headers.items()})}")
                
                response = await client.get(
                    f"{self.base_url}/models",
                    headers=headers
                )
                
                if response.status_code != 200:
                    logger.error(f"Failed to get models: {response.text}")
                    response.raise_for_status()
                
                # Log the response for debugging
                response_data = response.json()
                logger.debug(f"Models response structure: {type(response_data)}")
                
                if isinstance(response_data, dict):
                    logger.debug(f"Models response keys: {list(response_data.keys())}")
                    # If there's a 'data' key, extract it
                    if 'data' in response_data:
                        logger.debug(f"Models data type: {type(response_data['data'])}")
                        logger.debug(f"Number of models: {len(response_data['data'])}")
                
                # Wrap response in ModelsResponse
                return ModelsResponse(data=response_data)
        except httpx.RequestError as e:
            logger.error(f"Network error while getting models: {str(e)}")
            raise
        except ValueError as e:
            logger.error(f"JSON parsing error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error parsing OpenRouter response: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in get_models: {str(e)}")
            raise
    
    async def create_completion(self, request: CompletionRequest) -> CompletionResponse:
        """Create a chat completion using OpenRouter"""
        try:
            headers = self._get_headers()
            logger.debug(f"API key in use: {self.api_key[:4]}...{self.api_key[-4:] if self.api_key else 'None'}")
                
            async with httpx.AsyncClient(timeout=60.0) as client:
                start_time = datetime.now()
                
                logger.info(f"Sending completion request to OpenRouter with model: {request.model}")
                
                # Convert Pydantic model to dict
                request_dict = request.dict(exclude_none=True)
                
                # Log request details for debugging (without sensitive info)
                logger.debug(f"Request URL: {self.base_url}/chat/completions")
                logger.debug(f"Request headers (Auth redacted): {json.dumps({k: v if k != 'Authorization' else '[REDACTED]' for k, v in headers.items()})}")
                logger.debug(f"Request body: {json.dumps(request_dict)}")
                
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=request_dict
                )
                
                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()
                
                if response.status_code == 401:
                    error_text = response.text
                    logger.error(f"Authentication error with OpenRouter API: {error_text}")
                    raise ValueError(f"Authentication failed with OpenRouter: {error_text}")
                
                if response.status_code != 200:
                    error_text = response.text
                    logger.error(f"OpenRouter API error: {error_text}")
                    raise httpx.HTTPError(f"OpenRouter API error: {error_text}")
                
                logger.info(f"Received response in {duration:.2f}s")
                
                return CompletionResponse(**response.json())
        except httpx.RequestError as e:
            logger.error(f"Network error while creating completion: {str(e)}")
            raise
        except ValueError as e:
            logger.error(f"API key error: {str(e)}")
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