from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from enum import Enum
import uuid
import secrets

# Base ConfigDict for all models to handle datetime serialization
base_config = ConfigDict(
    extra='allow', 
    from_attributes=True,
    json_encoders={datetime: lambda dt: dt.isoformat()}
)

class ProfileStatus(str, Enum):
    """Profile status enum"""
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class AIModel(str, Enum):
    """Supported AI models enum"""
    GPT4 = "gpt-4"
    GPT35 = "gpt-3.5-turbo"
    CLAUDE3_OPUS = "claude-3-opus"
    CLAUDE3_SONNET = "claude-3-sonnet"
    CLAUDE3_HAIKU = "claude-3-haiku"
    GEMINI_PRO = "gemini-pro"
    LLAMA3_70B = "llama-3-70b"
    MISTRAL_7B = "mistral-7b"


class ProfileBase(BaseModel):
    """Base profile model with common fields"""
    model_config = base_config
    
    name: str
    description: Optional[str] = Field(default=None)
    system_prompt: str
    model: AIModel = Field(default=AIModel.GPT35)
    temperature: float = Field(default=0.7, ge=0.0, le=1.0)
    max_tokens: int = Field(default=1024, ge=1)


class ProfileCreate(ProfileBase):
    """Model for profile creation requests"""
    model_config = base_config


class ProfileUpdate(BaseModel):
    """Model for profile update requests"""
    model_config = base_config
    
    name: Optional[str] = Field(default=None)
    description: Optional[str] = Field(default=None)
    system_prompt: Optional[str] = Field(default=None)
    model: Optional[AIModel] = Field(default=None)
    temperature: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    max_tokens: Optional[int] = Field(default=None, ge=1)
    status: Optional[ProfileStatus] = Field(default=None)


class ProfileInDB(ProfileBase):
    """Model for profile in database"""
    model_config = base_config
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    status: ProfileStatus = Field(default=ProfileStatus.DRAFT)
    document_ids: List[str] = Field(default_factory=list)


class Profile(ProfileInDB):
    """Full profile model for API responses"""
    model_config = base_config
    
    query_count: int = Field(default=0)


class ProfileList(BaseModel):
    """Model for a list of profiles"""
    model_config = base_config
    
    total: int
    profiles: List[Profile]


class ProfileStats(BaseModel):
    """Model for profile usage statistics"""
    model_config = base_config
    
    total_queries: int = Field(default=0)
    total_tokens: int = Field(default=0)
    average_response_time: float = Field(default=0.0)
    documents_count: int = Field(default=0)
    last_used: Optional[datetime] = Field(default=None)


class ProfileWithStats(Profile):
    """Profile model with usage statistics"""
    model_config = base_config
    
    stats: ProfileStats = Field(default_factory=ProfileStats)


class APIKeyBase(BaseModel):
    """Base API key model with common fields"""
    model_config = base_config
    
    name: str
    description: Optional[str] = Field(default=None)


class APIKeyCreate(APIKeyBase):
    """Model for API key creation requests"""
    model_config = base_config
    
    profile_id: str


class APIKey(APIKeyBase):
    """Full API key model for API responses"""
    model_config = base_config
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key: str = Field(default_factory=lambda: f"pk_{secrets.token_urlsafe(32)}")
    profile_id: str
    created_at: datetime = Field(default_factory=datetime.now)
    last_used: Optional[datetime] = Field(default=None)
    usage_count: int = Field(default=0)


class APIKeyList(BaseModel):
    """Model for a list of API keys"""
    model_config = base_config
    
    total: int
    keys: List[APIKey] 