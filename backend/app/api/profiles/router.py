from fastapi import APIRouter, HTTPException, Depends, Body, Query, status, Header
from typing import List, Optional, Dict
import logging

from app.models.profiles import (
    ProfileCreate,
    ProfileUpdate,
    Profile,
    ProfileStatus,
    ProfileList,
    ProfileWithStats,
    ProfileStats,
    APIKeyCreate,
    APIKey,
    APIKeyList
)
from app.services.profiles.profile_service import profile_service
from app.services.openrouter.client import openrouter_client
from app.services.openrouter.key_manager import key_manager
from app.models.openrouter import Message
from app.services.documents.document_service import document_service

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


@router.post("/", response_model=Profile, status_code=status.HTTP_201_CREATED)
async def create_profile(
    profile_create: ProfileCreate,
    current_user: Optional[str] = None
):
    """Create a new AI profile"""
    try:
        logger.info(f"Creating profile: {profile_create}")
        profile = profile_service.create_profile(profile_create, current_user)
        return profile
    except ValueError as ve:
        logger.error(f"Validation error in profile creation: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except TypeError as te:
        # Handle JSON serialization errors
        logger.error(f"Type error in profile creation (possible serialization issue): {str(te)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create profile due to type error: {str(te)}"
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
        # Get the active OpenRouter API key
        active_key = key_manager.get_active_key()
        
        if not active_key:
            # If no key is active, check if there are any keys in storage
            keys = key_manager._read_keys()
            if keys:
                logger.info("No active key found, trying to use first stored key")
                active_key = keys[0]["key"]
                key_manager.set_active_key(active_key)
            else:
                logger.error("No OpenRouter API keys available in system")
                raise ValueError("No API key provided. Please add an OpenRouter API key in Settings.")
        
        # Make sure the client has the latest key
        logger.info(f"Setting API key for openrouter_client: {active_key[:4]}...{active_key[-4:]}")
        openrouter_client.api_key = active_key
        
        # Fetch document content for this profile
        document_content = ""
        
        if profile.document_ids:
            logger.info(f"Profile has {len(profile.document_ids)} documents, fetching content...")
            
            # Get completed documents
            for doc_id in profile.document_ids:
                doc = document_service.get_document(doc_id)
                if doc and doc.status == "completed":
                    try:
                        # Get document content
                        processed_dir = document_service.PROCESSED_DIR / doc_id
                        text_file_path = processed_dir / "extracted_text.txt"
                        
                        if text_file_path.exists():
                            with open(text_file_path, 'r', encoding='utf-8', errors='ignore') as f:
                                doc_text = f.read()
                                # Add document content to the context
                                document_content += f"\n\n--- Document: {doc.title} ---\n{doc_text[:5000]}\n"
                    except Exception as e:
                        logger.warning(f"Error reading document {doc_id}: {str(e)}")
        
        # Prepare messages
        messages = [
            {"role": "system", "content": profile.system_prompt}
        ]
        
        # Create a combined context with both document content and user context
        combined_context = ""
        if document_content:
            combined_context += f"Document content for reference:\n{document_content}\n\n"
        
        if context:
            combined_context += f"Additional context: {context}\n\n"
        
        if combined_context:
            messages.append({"role": "user", "content": combined_context})
        
        # Add the user query
        messages.append({"role": "user", "content": query})
        
        # Send to OpenRouter
        logger.info(f"Sending query to OpenRouter with model: {profile.model.value}")
        response = await openrouter_client.simple_completion(
            model=profile.model.value,
            messages=messages,
            temperature=profile.temperature
        )
        logger.info("Successfully received response from OpenRouter")
        
        # Update profile stats (in a real app, this would include token counts)
        profile_service.update_profile_stats(profile_id, add_query=True)
        
        return {
            "response": response,
            "profile_id": profile_id,
            "model": profile.model.value
        }
    except ValueError as ve:
        logger.error(f"Value Error in query_profile: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to query profile: {str(ve)}"
        )
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


# API Key Management
@router.get("/{profile_id}/keys", response_model=APIKeyList)
async def list_api_keys(profile_id: str):
    """List all API keys for a profile"""
    # Check if profile exists
    profile = profile_service.get_profile(profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with ID {profile_id} not found"
        )
    
    return profile_service.get_api_keys(profile_id)


@router.post("/{profile_id}/keys", response_model=APIKey, status_code=status.HTTP_201_CREATED)
async def create_api_key(profile_id: str, api_key_create: APIKeyCreate):
    """Create a new API key for a profile"""
    # Ensure profile_id in path matches the one in the request
    if api_key_create.profile_id != profile_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile ID in request body must match the profile ID in the path"
        )
    
    try:
        api_key = profile_service.create_api_key(api_key_create)
        return api_key
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Error creating API key: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create API key: {str(e)}"
        )


@router.delete("/{profile_id}/keys/{key_id}")
async def delete_api_key(profile_id: str, key_id: str):
    """Delete an API key"""
    # Check if the key belongs to the profile
    key = profile_service.get_api_key(key_id)
    if not key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API key with ID {key_id} not found"
        )
    
    if key.profile_id != profile_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API key does not belong to this profile"
        )
    
    if profile_service.delete_api_key(key_id):
        return {"message": f"API key {key_id} deleted successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API key with ID {key_id} not found"
        )


# API key authentication endpoint
@router.post("/verify-key")
async def verify_api_key(api_key: str = Body(..., embed=True)):
    """Verify an API key and return the associated profile ID"""
    profile_id = profile_service.verify_api_key(api_key)
    
    if not profile_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    return {"profile_id": profile_id}


# External API access using API key
@router.post("/external/query")
async def external_query_profile(
    query: str = Body(..., embed=True),
    context: Optional[str] = Body(None, embed=True),
    api_key: str = Header(..., description="API key for profile access")
):
    """Query a profile using an API key for authentication (for external access)"""
    # Verify API key
    profile_id = profile_service.verify_api_key(api_key)
    
    if not profile_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    # Get the profile
    profile = profile_service.get_profile(profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with ID {profile_id} not found"
        )
    
    try:
        # Get the active OpenRouter API key
        active_key = key_manager.get_active_key()
        
        if not active_key:
            # If no key is active, check if there are any keys in storage
            keys = key_manager._read_keys()
            if keys:
                logger.info("No active key found, trying to use first stored key")
                active_key = keys[0]["key"]
                key_manager.set_active_key(active_key)
            else:
                logger.error("No OpenRouter API keys available in system")
                raise ValueError("No API key provided. Please add an OpenRouter API key in Settings.")
        
        # Make sure the client has the latest key
        logger.info(f"Setting API key for openrouter_client: {active_key[:4]}...{active_key[-4:]}")
        openrouter_client.api_key = active_key
        
        # Fetch document content for this profile
        document_content = ""
        
        if profile.document_ids:
            logger.info(f"Profile has {len(profile.document_ids)} documents, fetching content...")
            
            # Get completed documents
            for doc_id in profile.document_ids:
                doc = document_service.get_document(doc_id)
                if doc and doc.status == "completed":
                    try:
                        # Get document content
                        processed_dir = document_service.PROCESSED_DIR / doc_id
                        text_file_path = processed_dir / "extracted_text.txt"
                        
                        if text_file_path.exists():
                            with open(text_file_path, 'r', encoding='utf-8', errors='ignore') as f:
                                doc_text = f.read()
                                # Add document content to the context
                                document_content += f"\n\n--- Document: {doc.title} ---\n{doc_text[:5000]}\n"
                    except Exception as e:
                        logger.warning(f"Error reading document {doc_id}: {str(e)}")
        
        # Prepare messages
        messages = [
            {"role": "system", "content": profile.system_prompt}
        ]
        
        # Create a combined context with both document content and user context
        combined_context = ""
        if document_content:
            combined_context += f"Document content for reference:\n{document_content}\n\n"
        
        if context:
            combined_context += f"Additional context: {context}\n\n"
        
        if combined_context:
            messages.append({"role": "user", "content": combined_context})
        
        # Add the user query
        messages.append({"role": "user", "content": query})
        
        # Send to OpenRouter
        logger.info(f"Sending query to OpenRouter with model: {profile.model.value}")
        response = await openrouter_client.simple_completion(
            model=profile.model.value,
            messages=messages,
            temperature=profile.temperature
        )
        logger.info("Successfully received response from OpenRouter")
        
        # Update profile stats
        profile_service.update_profile_stats(profile_id, add_query=True)
        
        return {
            "response": response,
            "profile_id": profile_id,
            "model": profile.model.value
        }
    except ValueError as ve:
        logger.error(f"Value Error in external_query_profile: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to query profile: {str(ve)}"
        )
    except Exception as e:
        logger.error(f"Error querying profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query profile: {str(e)}"
        )


# Training endpoint
@router.post("/{profile_id}/train")
async def train_profile(
    profile_id: str,
    training_data: List[Dict] = Body(..., description="Training data in the format of conversation pairs")
):
    """Train a profile with additional data"""
    # Get the profile
    profile = profile_service.get_profile(profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with ID {profile_id} not found"
        )
    
    try:
        # In a real implementation, this would integrate with the AI model's fine-tuning capability
        # For this demonstration, we'll just update the profile's system prompt with the 
        # extracted information from the training data
        
        # Extract key information from training data
        info_points = []
        for item in training_data:
            if "input" in item and "output" in item:
                info_points.append(f"When asked about {item['input']}, respond with information similar to: {item['output']}")
        
        # Update system prompt with extracted information
        if info_points:
            enhanced_prompt = profile.system_prompt + "\n\nAdditional training context:\n" + "\n".join(info_points)
            
            # Update profile
            profile_update = ProfileUpdate(system_prompt=enhanced_prompt)
            updated_profile = profile_service.update_profile(profile_id, profile_update)
            
            if updated_profile:
                return {"message": f"Profile {profile_id} trained successfully"}
        
        return {"message": "No changes made to profile"}
    except Exception as e:
        logger.error(f"Error training profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to train profile: {str(e)}"
        ) 