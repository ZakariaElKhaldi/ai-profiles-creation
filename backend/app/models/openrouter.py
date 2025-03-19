from typing import Dict, List, Optional, Union, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator


class Message(BaseModel):
    """Model for a chat message in OpenRouter format"""
    model_config = ConfigDict(extra='allow')
    
    role: str
    content: str


class CompletionRequest(BaseModel):
    """Model for the OpenRouter API request payload for completions"""
    model_config = ConfigDict(extra='allow')
    
    model: str
    messages: List[Message]
    temperature: Optional[float] = Field(default=0.7)
    top_p: Optional[float] = Field(default=0.95)
    max_tokens: Optional[int] = Field(default=1024)
    stream: Optional[bool] = Field(default=False)
    stop: Optional[Union[str, List[str]]] = Field(default=None)
    frequency_penalty: Optional[float] = Field(default=0)
    presence_penalty: Optional[float] = Field(default=0)


class Choice(BaseModel):
    """Model for a completion choice returned by OpenRouter"""
    model_config = ConfigDict(extra='allow')
    
    index: int
    message: Message
    finish_reason: Optional[str] = Field(default=None)


class Usage(BaseModel):
    """Model for token usage information"""
    model_config = ConfigDict(extra='allow')
    
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class CompletionResponse(BaseModel):
    """Model for the OpenRouter API response for completions"""
    model_config = ConfigDict(extra='allow')
    
    id: str
    object: str = Field(default="chat.completion")
    created: int
    model: str
    choices: List[Choice]
    usage: Usage


class AvailableModel(BaseModel):
    """Model for available OpenRouter model information"""
    model_config = ConfigDict(extra='allow')
    
    id: str
    name: str
    description: Optional[str] = Field(default=None)
    pricing: Optional[Dict[str, Any]] = Field(default=None)
    context_length: Optional[int] = Field(default=None)
    top_provider: Optional[str] = Field(default=None)


class ModelsResponse(BaseModel):
    """Model for the OpenRouter API response for available models"""
    model_config = ConfigDict(extra='allow')
    
    data: List[AvailableModel] = Field(default_factory=list)
    
    @field_validator('data', mode='before')
    @classmethod
    def validate_data(cls, v):
        # If data is not a list but a dict with data key, extract it
        if isinstance(v, dict) and 'data' in v:
            return v['data']
        # If it's already a list, just return it
        if isinstance(v, list):
            return v
        # If it's something else, return an empty list
        return []


class APIKeyResponse(BaseModel):
    """Model for API key management responses"""
    model_config = ConfigDict(extra='allow')
    
    key: str
    created_at: str


class APIKeyListResponse(BaseModel):
    """Model for a list of API keys"""
    model_config = ConfigDict(extra='allow')
    
    keys: List[APIKeyResponse] 