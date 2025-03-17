from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class CreateProfileRequest(BaseModel):
    """Request model for creating a chatbot profile"""
    name: str
    description: str
    model: str
    temperature: float = Field(default=0.7, ge=0, le=2.0)


class ChatbotProfile(BaseModel):
    """Model for chatbot profile data"""
    id: str
    name: str
    description: str
    model: str
    temperature: float
    created_at: str
    updated_at: Optional[str] = None
    training_data_count: Optional[int] = 0


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

class ProfileCreate(BaseModel):
    """Request model for creating a profile"""
    name: str
    personality_traits: List[str]
    description: Optional[str] = None
    example_messages: Optional[List[str]] = None
    avatar_url: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class ProfileUpdate(BaseModel):
    """Request model for updating a profile"""
    name: Optional[str] = None
    personality_traits: Optional[List[str]] = None
    description: Optional[str] = None
    example_messages: Optional[List[str]] = None
    avatar_url: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class Profile(BaseModel):
    """Model for profile data"""
    id: str
    name: str
    personality_traits: List[str]
    description: str
    example_messages: List[str] = []
    avatar_url: str = ""
    settings: Dict[str, Any] = {}


class ProfileListResponse(BaseModel):
    """Response model for list of profiles"""
    profiles: List[Profile] 