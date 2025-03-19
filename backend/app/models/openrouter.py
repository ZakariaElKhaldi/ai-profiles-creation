from typing import Dict, List, Optional, Union, Any
from pydantic import BaseModel, Field


class Message(BaseModel):
    """Model for a chat message in OpenRouter format"""
    role: str
    content: str


class CompletionRequest(BaseModel):
    """Model for the OpenRouter API request payload for completions"""
    model: str
    messages: List[Message]
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 0.95
    max_tokens: Optional[int] = 1024
    stream: Optional[bool] = False
    stop: Optional[Union[str, List[str]]] = None
    frequency_penalty: Optional[float] = 0
    presence_penalty: Optional[float] = 0


class Choice(BaseModel):
    """Model for a completion choice returned by OpenRouter"""
    index: int
    message: Message
    finish_reason: Optional[str] = None


class Usage(BaseModel):
    """Model for token usage information"""
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class CompletionResponse(BaseModel):
    """Model for the OpenRouter API response for completions"""
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[Choice]
    usage: Usage


class AvailableModel(BaseModel):
    """Model for available OpenRouter model information"""
    id: str
    name: str
    description: Optional[str] = None
    pricing: Optional[Dict[str, Any]] = None
    context_length: Optional[int] = None
    top_provider: Optional[str] = None


class ModelsResponse(BaseModel):
    """Model for the OpenRouter API response for available models"""
    data: List[AvailableModel]


class APIKeyResponse(BaseModel):
    """Model for API key management responses"""
    key: str
    created_at: str


class APIKeyListResponse(BaseModel):
    """Model for a list of API keys"""
    keys: List[APIKeyResponse] 