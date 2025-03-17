from fastapi import APIRouter, HTTPException, File, Form, BackgroundTasks, Depends, Query, Path
from typing import List, Dict, Any, Optional
import time
import uuid
import os
import json

from app.schemas.profile import (
    CreateProfileRequest,
    ChatbotProfile,
    ApiKeyResponse,
    TrainingDataResponse,
    Profile,
    ProfileCreate,
    ProfileUpdate,
    ProfileListResponse
)
from app.schemas.chat import ChatRequest, Message
from app.utils import load_profiles, save_profiles, generate_profile_description

router = APIRouter(tags=["profiles"])

# Simulated profiles storage (in production this would be a database)
profiles_db = {}
profile_api_keys = {}

# Storage for training data (in production this would be a database)
training_data_db = {}

# Load initial profiles
_profiles = load_profiles()


@router.get("/", response_model=ProfileListResponse)
async def get_profiles():
    """
    Get all profiles
    
    Returns:
        List of profiles
    """
    return ProfileListResponse(profiles=list(_profiles.values()))


@router.get("/{profile_id}", response_model=Profile)
async def get_profile(profile_id: str = Path(..., description="Profile ID")):
    """
    Get a profile by ID
    
    Args:
        profile_id: Profile ID
        
    Returns:
        Profile
    """
    if profile_id not in _profiles:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return _profiles[profile_id]


@router.post("/", response_model=Profile)
async def create_profile(profile: ProfileCreate):
    """
    Create a new profile
    
    Args:
        profile: Profile data
        
    Returns:
        Created profile
    """
    # Generate a unique ID
    profile_id = str(uuid.uuid4())
    
    # Generate a description if not provided
    description = profile.description
    if not description:
        description = generate_profile_description(profile.name, profile.personality_traits)
    
    # Create the profile
    new_profile = Profile(
        id=profile_id,
        name=profile.name,
        personality_traits=profile.personality_traits,
        description=description,
        example_messages=profile.example_messages or [],
        avatar_url=profile.avatar_url or "",
        settings=profile.settings
    )
    
    # Add to the collection
    _profiles[profile_id] = new_profile
    
    # Save to disk
    save_profiles(_profiles)
    
    return new_profile


@router.put("/{profile_id}", response_model=Profile)
async def update_profile(
    profile_update: ProfileUpdate,
    profile_id: str = Path(..., description="Profile ID")
):
    """
    Update a profile
    
    Args:
        profile_update: Updated profile data
        profile_id: Profile ID
        
    Returns:
        Updated profile
    """
    if profile_id not in _profiles:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get existing profile
    profile = _profiles[profile_id]
    
    # Update fields
    for field, value in profile_update.dict(exclude_unset=True).items():
        setattr(profile, field, value)
    
    # Save to disk
    save_profiles(_profiles)
    
    return profile


@router.delete("/{profile_id}", response_model=Dict[str, Any])
async def delete_profile(profile_id: str = Path(..., description="Profile ID")):
    """
    Delete a profile
    
    Args:
        profile_id: Profile ID
        
    Returns:
        Success message
    """
    if profile_id not in _profiles:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Remove from collection
    del _profiles[profile_id]
    
    # Save to disk
    save_profiles(_profiles)
    
    return {"status": "success", "message": f"Profile {profile_id} deleted"}


@router.post("/{profile_id}/generate_description", response_model=Dict[str, str])
async def generate_description(
    profile_id: str = Path(..., description="Profile ID")
):
    """
    Generate a description for a profile
    
    Args:
        profile_id: Profile ID
        
    Returns:
        Generated description
    """
    if profile_id not in _profiles:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile = _profiles[profile_id]
    
    # Generate description
    description = generate_profile_description(profile.name, profile.personality_traits)
    
    # Update profile
    profile.description = description
    
    # Save to disk
    save_profiles(_profiles)
    
    return {"description": description}


@router.post("/{profile_id}/api-key", response_model=ApiKeyResponse)
async def generate_api_key(profile_id: str):
    """
    Generate an API key for a profile
    
    Args:
        profile_id: Profile ID
        
    Returns:
        Generated API key
    """
    if profile_id not in profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Generate a new API key
    api_key = f"sk-{uuid.uuid4().hex}"
    
    # Store the API key
    profile_api_keys[profile_id] = api_key
    
    return ApiKeyResponse(profile_id=profile_id, api_key=api_key)


@router.delete("/{profile_id}/api-key")
async def revoke_api_key(profile_id: str):
    """
    Revoke an API key for a profile
    
    Args:
        profile_id: Profile ID
        
    Returns:
        Status of the revoke operation
    """
    if profile_id not in profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    if profile_id not in profile_api_keys:
        raise HTTPException(status_code=404, detail="No API key found for this profile")
    
    # Delete the API key
    del profile_api_keys[profile_id]
    
    return {"message": "API key revoked successfully"}


@router.post("/{profile_id}/test")
async def test_chatbot(profile_id: str, message: Dict[str, str]):
    """
    Test a chatbot profile with a message
    
    Args:
        profile_id: Profile ID
        message: Test message
        
    Returns:
        Response from the chatbot
    """
    if profile_id not in profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile = profiles_db[profile_id]
    
    # Import the chat function from the chat module
    from app.api.chat import chat
    
    # Create a chat request
    chat_request = ChatRequest(
        messages=[Message(role="user", content=message["content"])],
        model=profile.model,
        temperature=profile.temperature
    )
    
    # Process the request
    background_tasks = BackgroundTasks()
    response = await chat(chat_request, background_tasks)
    
    return {"response": response.message.content}


@router.post("/{profile_id}/training-data")
async def add_training_data(
    profile_id: str,
    question: str = Form(...),
    answer: str = Form(...)
):
    """
    Add training data for a profile
    
    Args:
        profile_id: Profile ID
        question: Training question
        answer: Training answer
        
    Returns:
        Status of the training data addition
    """
    if profile_id not in profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    data_id = str(uuid.uuid4())
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    # Create training data entry
    training_data = {
        "id": data_id,
        "profile_id": profile_id,
        "question": question,
        "answer": answer,
        "created_at": timestamp
    }
    
    # Store the training data
    if profile_id not in training_data_db:
        training_data_db[profile_id] = []
    
    training_data_db[profile_id].append(training_data)
    
    # Update the profile's training data count
    profile = profiles_db[profile_id]
    profile.training_data_count = len(training_data_db[profile_id])
    
    return {"id": data_id, "message": "Training data added successfully"}


@router.get("/{profile_id}/training-data", response_model=TrainingDataResponse)
async def get_training_data(profile_id: str):
    """
    Get training data for a profile
    
    Args:
        profile_id: Profile ID
        
    Returns:
        Training data for the profile
    """
    if profile_id not in profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get the training data
    data = training_data_db.get(profile_id, [])
    
    return TrainingDataResponse(
        profile_id=profile_id,
        count=len(data),
        data=data
    )


@router.delete("/{profile_id}/training-data/{data_id}")
async def delete_training_data(profile_id: str, data_id: str):
    """
    Delete training data for a profile
    
    Args:
        profile_id: Profile ID
        data_id: Training data ID
        
    Returns:
        Status of the delete operation
    """
    if profile_id not in profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    if profile_id not in training_data_db:
        raise HTTPException(status_code=404, detail="No training data found for this profile")
    
    # Find and delete the training data
    data_list = training_data_db[profile_id]
    for i, item in enumerate(data_list):
        if item["id"] == data_id:
            data_list.pop(i)
            
            # Update the profile's training data count
            profile = profiles_db[profile_id]
            profile.training_data_count = len(data_list)
            
            return {"message": "Training data deleted successfully"}
    
    raise HTTPException(status_code=404, detail="Training data not found") 