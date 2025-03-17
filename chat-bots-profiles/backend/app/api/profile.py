from fastapi import APIRouter, HTTPException, File, Form, BackgroundTasks, Depends, Query, Path, Body
from typing import List, Dict, Any, Optional
import time
import uuid
import os
import json
import secrets
import logging

from app.schemas.profile import (
    CreateProfileRequest,
    ChatbotProfile,
    ApiKeyResponse,
    TrainingDataResponse,
    Profile,
    ProfileCreate,
    ProfileUpdate,
    ProfileListResponse,
    ProfileDocumentResponse,
    ProfileWithDocuments,
    ProfileApiKeyCreate,
    ProfileApiKeyResponse
)
from app.schemas.chat import ChatRequest, Message
from app.utils import load_profiles, save_profiles, generate_profile_description
from app.services.profile_service import ProfileService
from app.services.documents.service import DocumentService
from app.utils.auth import get_api_key

router = APIRouter(tags=["profiles"])
profile_service = ProfileService()
document_service = DocumentService()

logger = logging.getLogger(__name__)

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
    try:
        profiles = profile_service.get_all_profiles()
        return ProfileListResponse(profiles=profiles)
    except Exception as e:
        logger.error(f"Error getting profiles: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting profiles: {str(e)}")


@router.get("/{profile_id}", response_model=ChatbotProfile)
async def get_profile(profile_id: str = Path(..., description="The ID of the profile to get")):
    """
    Get a profile by ID
    
    Args:
        profile_id: Profile ID
        
    Returns:
        Profile
    """
    try:
        profile = profile_service.get_profile(profile_id)
        if not profile:
            raise HTTPException(status_code=404, detail=f"Profile with ID {profile_id} not found")
        return profile
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting profile {profile_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting profile: {str(e)}")


@router.post("/", response_model=ChatbotProfile)
async def create_profile(profile_data: CreateProfileRequest):
    """
    Create a new profile
    
    Args:
        profile_data: Profile data
        
    Returns:
        Created profile
    """
    try:
        # Validate document IDs if provided
        if profile_data.document_ids:
            for doc_id in profile_data.document_ids:
                try:
                    document_service.get_document(doc_id)
                except Exception:
                    raise HTTPException(
                        status_code=404, 
                        detail=f"Document with ID {doc_id} not found"
                    )
        
        profile = profile_service.create_profile(
            name=profile_data.name,
            description=profile_data.description,
            model=profile_data.model,
            temperature=profile_data.temperature,
            document_ids=profile_data.document_ids or [],
            max_tokens=profile_data.max_tokens,
            system_prompt=profile_data.system_prompt
        )
        return profile
    except Exception as e:
        logger.error(f"Error creating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating profile: {str(e)}")


@router.put("/{profile_id}", response_model=ChatbotProfile)
async def update_profile(
    profile_update: ProfileUpdate,
    profile_id: str = Path(..., description="The ID of the profile to update")
):
    """
    Update a profile
    
    Args:
        profile_update: Updated profile data
        profile_id: Profile ID
        
    Returns:
        Updated profile
    """
    try:
        # Check if profile exists
        existing_profile = profile_service.get_profile(profile_id)
        if not existing_profile:
            raise HTTPException(status_code=404, detail=f"Profile with ID {profile_id} not found")
        
        # Validate document IDs if provided
        if profile_update.document_ids:
            for doc_id in profile_update.document_ids:
                try:
                    document_service.get_document(doc_id)
                except Exception:
                    raise HTTPException(
                        status_code=404, 
                        detail=f"Document with ID {doc_id} not found"
                    )
        
        # Update the profile
        updated_profile = profile_service.update_profile(profile_id, profile_update)
        return updated_profile
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile {profile_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating profile: {str(e)}")


@router.delete("/{profile_id}")
async def delete_profile(profile_id: str = Path(..., description="The ID of the profile to delete")):
    """
    Delete a profile
    
    Args:
        profile_id: Profile ID
        
    Returns:
        Success message
    """
    try:
        # Check if profile exists
        existing_profile = profile_service.get_profile(profile_id)
        if not existing_profile:
            raise HTTPException(status_code=404, detail=f"Profile with ID {profile_id} not found")
        
        # Delete the profile
        profile_service.delete_profile(profile_id)
        return {"message": f"Profile {profile_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting profile {profile_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting profile: {str(e)}")


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
async def generate_api_key(
    profile_id: str = Path(..., description="The ID of the profile to generate an API key for"),
    key_data: ProfileApiKeyCreate = None
):
    """
    Generate an API key for a profile
    
    Args:
        profile_id: Profile ID
        key_data: API key data
        
    Returns:
        Generated API key
    """
    try:
        # Check if profile exists
        existing_profile = profile_service.get_profile(profile_id)
        if not existing_profile:
            raise HTTPException(status_code=404, detail=f"Profile with ID {profile_id} not found")
        
        # Generate API key
        key_name = key_data.name if key_data else "default"
        expiration = key_data.expiration if key_data else None
        
        api_key = secrets.token_urlsafe(32)  # Generate a secure random API key
        key_id = str(uuid.uuid4())
        
        # Store the API key
        profile_service.add_api_key(
            profile_id=profile_id,
            key_id=key_id,
            api_key=api_key,
            name=key_name,
            expires_at=expiration
        )
        
        return ApiKeyResponse(profile_id=profile_id, api_key=api_key)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating API key for profile {profile_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating API key: {str(e)}")


@router.get("/{profile_id}/api-keys", response_model=List[ProfileApiKeyResponse])
async def get_profile_api_keys(
    profile_id: str = Path(..., description="The ID of the profile to get API keys for")
):
    """
    Get all API keys for a profile
    
    Args:
        profile_id: Profile ID
        
    Returns:
        List of API keys
    """
    try:
        # Check if profile exists
        existing_profile = profile_service.get_profile(profile_id)
        if not existing_profile:
            raise HTTPException(status_code=404, detail=f"Profile with ID {profile_id} not found")
        
        # Get API keys
        api_keys = profile_service.get_api_keys(profile_id)
        return api_keys
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting API keys for profile {profile_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting API keys: {str(e)}")


@router.delete("/{profile_id}/api-keys/{key_id}")
async def delete_api_key(
    profile_id: str = Path(..., description="The ID of the profile"),
    key_id: str = Path(..., description="The ID of the API key to delete")
):
    """
    Delete an API key
    
    Args:
        profile_id: Profile ID
        key_id: API key ID
        
    Returns:
        Status of the delete operation
    """
    try:
        # Check if profile exists
        existing_profile = profile_service.get_profile(profile_id)
        if not existing_profile:
            raise HTTPException(status_code=404, detail=f"Profile with ID {profile_id} not found")
        
        # Delete API key
        profile_service.delete_api_key(profile_id, key_id)
        return {"message": f"API key {key_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting API key {key_id} for profile {profile_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting API key: {str(e)}")


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


@router.post("/{profile_id}/documents", response_model=ProfileDocumentResponse)
async def add_documents_to_profile(
    profile_id: str = Path(..., description="Profile ID"),
    document_ids: List[str] = Body(..., description="List of document IDs to attach")
):
    """
    Add document references to a profile
    
    Args:
        profile_id: Profile ID
        document_ids: List of document IDs to attach
        
    Returns:
        Updated document list
    """
    if profile_id not in _profiles:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile = _profiles[profile_id]
    
    # Check document limit
    current_count = len(profile.document_ids)
    limit = profile.settings.document_limit
    if limit > 0 and current_count + len(document_ids) > limit:
        raise HTTPException(
            status_code=400,
            detail=f"Document limit exceeded. Maximum allowed: {limit}, current: {current_count}"
        )
    
    # Add new document IDs, avoiding duplicates
    existing_docs = set(profile.document_ids)
    new_docs = set(document_ids)
    profile.document_ids = list(existing_docs.union(new_docs))
    
    # Update usage stats
    if 'document_count' not in profile.usage_stats:
        profile.usage_stats['document_count'] = 0
    profile.usage_stats['document_count'] = len(profile.document_ids)
    profile.usage_stats['last_document_update'] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    # Save to disk
    save_profiles(_profiles)
    
    return ProfileDocumentResponse(
        profile_id=profile_id,
        document_ids=profile.document_ids,
        message="Documents added successfully"
    )


@router.get("/{profile_id}/documents", response_model=ProfileDocumentResponse)
async def get_profile_documents(
    profile_id: str = Path(..., description="Profile ID")
):
    """
    Get documents attached to a profile
    
    Args:
        profile_id: Profile ID
        
    Returns:
        List of document IDs
    """
    if profile_id not in _profiles:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile = _profiles[profile_id]
    
    return ProfileDocumentResponse(
        profile_id=profile_id,
        document_ids=profile.document_ids,
        message="Documents retrieved successfully"
    )


@router.delete("/{profile_id}/documents/{document_id}", response_model=ProfileDocumentResponse)
async def remove_document_from_profile(
    profile_id: str = Path(..., description="The ID of the profile"),
    document_id: str = Path(..., description="The ID of the document to remove")
):
    """
    Remove a document reference from a profile
    
    Args:
        profile_id: Profile ID
        document_id: Document ID to remove
        
    Returns:
        Updated document list
    """
    if profile_id not in _profiles:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile = _profiles[profile_id]
    
    if document_id not in profile.document_ids:
        raise HTTPException(status_code=404, detail="Document not found in profile")
    
    profile.document_ids.remove(document_id)
    
    # Save to disk
    save_profiles(_profiles)
    
    return ProfileDocumentResponse(
        profile_id=profile_id,
        document_ids=profile.document_ids,
        message=f"Document {document_id} removed successfully"
    )


@router.get("/{profile_id}/with-documents", response_model=ProfileWithDocuments)
async def get_profile_with_documents(profile_id: str = Path(..., description="The ID of the profile to get")):
    """
    Get a profile by ID with its associated documents
    
    Args:
        profile_id: Profile ID
        
    Returns:
        Profile with documents
    """
    try:
        profile = profile_service.get_profile(profile_id)
        if not profile:
            raise HTTPException(status_code=404, detail=f"Profile with ID {profile_id} not found")
        
        # Get document details for each document ID
        documents = []
        for doc_id in profile.document_ids:
            try:
                doc = document_service.get_document(doc_id)
                # Don't include the full content in the response
                if doc and hasattr(doc, 'content'):
                    doc_dict = doc.dict()
                    if 'content' in doc_dict and doc_dict['content']:
                        # Truncate content for preview
                        doc_dict['content'] = doc_dict['content'][:200] + '...' if len(doc_dict['content']) > 200 else doc_dict['content']
                    documents.append(doc_dict)
            except Exception as e:
                logger.warning(f"Could not retrieve document {doc_id}: {str(e)}")
        
        # Create a ProfileWithDocuments instance
        profile_with_docs = ProfileWithDocuments(**profile.dict(), documents=documents)
        return profile_with_docs
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting profile with documents {profile_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting profile with documents: {str(e)}")


@router.post("/{profile_id}/documents/{document_id}")
async def add_document_to_profile(
    profile_id: str = Path(..., description="The ID of the profile"),
    document_id: str = Path(..., description="The ID of the document to add")
):
    """
    Add a document to a profile
    
    Args:
        profile_id: Profile ID
        document_id: Document ID to add
        
    Returns:
        Status of the add operation
    """
    try:
        # Check if profile exists
        existing_profile = profile_service.get_profile(profile_id)
        if not existing_profile:
            raise HTTPException(status_code=404, detail=f"Profile with ID {profile_id} not found")
        
        # Check if document exists
        try:
            document_service.get_document(document_id)
        except Exception:
            raise HTTPException(status_code=404, detail=f"Document with ID {document_id} not found")
        
        # Add document to profile
        if document_id in existing_profile.document_ids:
            return {"message": f"Document {document_id} already associated with profile {profile_id}"}
        
        updated_profile = profile_service.add_document_to_profile(profile_id, document_id)
        return {"message": f"Document {document_id} added to profile {profile_id} successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding document {document_id} to profile {profile_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error adding document to profile: {str(e)}")


@router.delete("/{profile_id}/documents/{document_id}")
async def remove_document_from_profile(
    profile_id: str = Path(..., description="The ID of the profile"),
    document_id: str = Path(..., description="The ID of the document to remove")
):
    """
    Remove a document from a profile
    
    Args:
        profile_id: Profile ID
        document_id: Document ID to remove
        
    Returns:
        Status of the remove operation
    """
    try:
        # Check if profile exists
        existing_profile = profile_service.get_profile(profile_id)
        if not existing_profile:
            raise HTTPException(status_code=404, detail=f"Profile with ID {profile_id} not found")
        
        # Remove document from profile
        if document_id not in existing_profile.document_ids:
            return {"message": f"Document {document_id} not associated with profile {profile_id}"}
        
        updated_profile = profile_service.remove_document_from_profile(profile_id, document_id)
        return {"message": f"Document {document_id} removed from profile {profile_id} successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing document {document_id} from profile {profile_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error removing document from profile: {str(e)}")


@router.get("/by-api-key/{api_key}", response_model=ChatbotProfile)
async def get_profile_by_api_key(
    api_key: str = Path(..., description="The API key to look up")
):
    """
    Get a profile by API key
    
    Args:
        api_key: API key
        
    Returns:
        Profile
    """
    try:
        profile_id = profile_service.get_profile_id_by_api_key(api_key)
        if not profile_id:
            raise HTTPException(status_code=404, detail="Invalid API key")
        
        profile = profile_service.get_profile(profile_id)
        if not profile:
            raise HTTPException(status_code=404, detail=f"Profile with ID {profile_id} not found")
        
        # Update last used timestamp for the API key
        profile_service.update_api_key_last_used(api_key)
        
        return profile
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting profile by API key: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting profile by API key: {str(e)}") 