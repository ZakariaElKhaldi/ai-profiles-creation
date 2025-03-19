from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime
from enum import Enum
import uuid


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
    name: str
    description: Optional[str] = None
    system_prompt: str
    model: AIModel = AIModel.GPT35
    temperature: float = Field(0.7, ge=0.0, le=1.0)
    max_tokens: int = Field(1024, ge=1)


class ProfileCreate(ProfileBase):
    """Model for profile creation requests"""
    pass


class ProfileUpdate(BaseModel):
    """Model for profile update requests"""
    name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    model: Optional[AIModel] = None
    temperature: Optional[float] = Field(None, ge=0.0, le=1.0)
    max_tokens: Optional[int] = Field(None, ge=1)
    status: Optional[ProfileStatus] = None


class ProfileInDB(ProfileBase):
    """Model for profile in database"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    status: ProfileStatus = ProfileStatus.DRAFT
    document_ids: List[str] = Field(default_factory=list)
    
    class Config:
        orm_mode = True


class Profile(ProfileInDB):
    """Full profile model for API responses"""
    query_count: int = 0


class ProfileList(BaseModel):
    """Model for a list of profiles"""
    total: int
    profiles: List[Profile]


class ProfileStats(BaseModel):
    """Model for profile usage statistics"""
    total_queries: int = 0
    total_tokens: int = 0
    average_response_time: float = 0.0
    documents_count: int = 0
    last_used: Optional[datetime] = None


class ProfileWithStats(Profile):
    """Profile model with usage statistics"""
    stats: ProfileStats = Field(default_factory=ProfileStats) 