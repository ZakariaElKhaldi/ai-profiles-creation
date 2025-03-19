from fastapi import APIRouter, HTTPException, Depends, Body, Query, status
from typing import List, Optional
import logging

from app.models.profiles import (
    ProfileCreate,
    ProfileUpdate,
    Profile,
    ProfileStatus,
    ProfileList,
    ProfileWithStats,
    ProfileStats
)
from app.services.profiles.profile_service import profile_service
from app.services.openrouter.client import openrouter_client
from app.models.openrouter import Message

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=ProfileList)
async def list_profiles(
    user_id: Optional[str] = None,
    status: Optional[ProfileStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get a list of profiles, optionally filtered"""
    try:
        return profile_service.get_profiles(
            user_id=user_id,
            status=status,
            skip=skip,
            limit=limit
        )
    except Exception as e:
        logger.error(f"Error listing profiles: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list profiles: {str(e)}"
        )


@router.get("/{profile_id}", response_model=Profile)
async def get_profile(profile_id: str):
    """Get a profile by ID"""
    profile = profile_service.get_profile(profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with ID {profile_id} not found"
        )
    return profile


@router.get("/{profile_id}/stats", response_model=ProfileWithStats)
async def get_profile_with_stats(profile_id: str):
    """Get a profile with its usage statistics"""
    profile = profile_service.get_profile_with_stats(profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with ID {profile_id} not found"
        )
    return profile


@router.post("/", response_model=Profile)
async def create_profile(
    profile_create: ProfileCreate,
    user_id: Optional[str] = None
):
    """Create a new AI profile"""
    try:
        return profile_service.create_profile(profile_create, user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create profile: {str(e)}"
        )


@router.put("/{profile_id}", response_model=Profile)
async def update_profile(profile_id: str, profile_update: ProfileUpdate):
    """Update profile information"""
    updated_profile = profile_service.update_profile(profile_id, profile_update)
    
    if not updated_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with ID {profile_id} not found"
        )
    
    return updated_profile


@router.delete("/{profile_id}")
async def delete_profile(profile_id: str):
    """Delete a profile"""
    if profile_service.delete_profile(profile_id):
        return {"message": f"Profile {profile_id} deleted successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with ID {profile_id} not found"
        )


@router.post("/{profile_id}/query")
async def query_profile(
    profile_id: str,
    query: str = Body(..., embed=True),
    context: Optional[str] = Body(None, embed=True)
):
    """Send a query to an AI profile"""
    # Get the profile
    profile = profile_service.get_profile(profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with ID {profile_id} not found"
        )
    
    try:
        # Prepare messages
        messages = [
            {"role": "system", "content": profile.system_prompt}
        ]
        
        # Add context if provided
        if context:
            messages.append({"role": "user", "content": f"Context information: {context}"})
        
        # Add the user query
        messages.append({"role": "user", "content": query})
        
        # Send to OpenRouter
        response = await openrouter_client.simple_completion(
            model=profile.model.value,
            messages=messages,
            temperature=profile.temperature
        )
        
        # Update profile stats (in a real app, this would include token counts)
        profile_service.update_profile_stats(profile_id, add_query=True)
        
        return {
            "response": response,
            "profile_id": profile_id,
            "model": profile.model.value
        }
    except Exception as e:
        logger.error(f"Error querying profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query profile: {str(e)}"
        )


@router.post("/{profile_id}/activate")
async def activate_profile(profile_id: str):
    """Set a profile's status to active"""
    profile_update = ProfileUpdate(status=ProfileStatus.ACTIVE)
    updated_profile = profile_service.update_profile(profile_id, profile_update)
    
    if not updated_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with ID {profile_id} not found"
        )
    
    return {"message": f"Profile {profile_id} activated successfully"}


@router.post("/{profile_id}/archive")
async def archive_profile(profile_id: str):
    """Set a profile's status to archived"""
    profile_update = ProfileUpdate(status=ProfileStatus.ARCHIVED)
    updated_profile = profile_service.update_profile(profile_id, profile_update)
    
    if not updated_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with ID {profile_id} not found"
        )
    
    return {"message": f"Profile {profile_id} archived successfully"} 