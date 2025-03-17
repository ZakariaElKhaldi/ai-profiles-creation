from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


class CreateProfileRequest(BaseModel):
    """Request model for creating a chatbot profile"""
    name: str = Field(..., description="Name of the chatbot profile")
    description: str = Field(..., description="Description of the chatbot profile")
    model: str = Field(..., description="LLM model to use for this profile")
    temperature: float = Field(..., description="Temperature setting for the model")
    document_ids: Optional[List[str]] = Field(None, description="List of document IDs to associate with this profile")
    max_tokens: Optional[int] = Field(None, description="Maximum tokens to use for this profile")
    system_prompt: Optional[str] = Field(None, description="System prompt for this profile")


class ChatbotProfile(BaseModel):
    """Model for chatbot profile data"""
    id: str
    name: str
    description: str
    model: str
    temperature: float
    document_ids: List[str] = []
    max_tokens: Optional[int] = None
    system_prompt: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True


class ApiKeyResponse(BaseModel):
    """Response model for API key generation"""
    profile_id: str
    api_key: str


class TrainingDataResponse(BaseModel):
    """Response model for training data operations"""
    profile_id: str
    count: int
    data: List[Dict[str, Any]]


# Adding missing classes that are imported in profile.py

class ProfileSettings(BaseModel):
    """Model for profile settings"""
    document_limit: Optional[int] = Field(default=10, ge=0, description="Maximum number of documents that can be attached")
    token_limit: Optional[int] = Field(default=1000000, ge=0, description="Maximum number of tokens that can be processed")
    response_time_limit: Optional[int] = Field(default=30000, ge=0, description="Maximum response time in milliseconds")


class ProfileCreate(BaseModel):
    """Request model for creating a profile"""
    name: str
    description: str
    model: str
    temperature: float
    document_ids: List[str] = []
    max_tokens: Optional[int] = None
    system_prompt: Optional[str] = None


class ProfileUpdate(BaseModel):
    """Request model for updating a profile"""
    name: Optional[str] = None
    description: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = None
    document_ids: Optional[List[str]] = None
    max_tokens: Optional[int] = None
    system_prompt: Optional[str] = None


class Profile(BaseModel):
    """Model for profile data"""
    id: str
    name: str
    personality_traits: List[str]
    description: str
    example_messages: List[str] = []
    avatar_url: str = ""
    settings: ProfileSettings = Field(default_factory=ProfileSettings)
    document_ids: List[str] = Field(default_factory=list, description="List of document IDs attached to this profile")
    usage_stats: Dict[str, Any] = Field(default_factory=dict, description="Usage statistics for the profile")


class ProfileListResponse(BaseModel):
    """Response model for list of profiles"""
    profiles: List[ChatbotProfile]


class ProfileDocumentResponse(BaseModel):
    """Response model for profile document operations"""
    profile_id: str
    document_ids: List[str]
    message: str


class ProfileAnalytics(BaseModel):
    total_chats: int
    total_tokens: int
    average_tokens_per_chat: float
    last_used: Optional[datetime] = None


class ProfileWithAnalytics(ChatbotProfile):
    analytics: ProfileAnalytics


class ProfileWithDocuments(ChatbotProfile):
    documents: List[Dict[str, Any]] = []


class ProfileApiKeyCreate(BaseModel):
    name: Optional[str] = Field("default", description="Name for this API key")
    expiration: Optional[datetime] = Field(None, description="Expiration date for this API key")


class ProfileApiKey(BaseModel):
    id: str
    profile_id: str
    key: str
    name: str
    created_at: datetime
    expires_at: Optional[datetime] = None
    last_used: Optional[datetime] = None


class ProfileApiKeyResponse(BaseModel):
    id: str
    profile_id: str
    key: str
    name: str
    created_at: datetime
    expires_at: Optional[datetime] = None 