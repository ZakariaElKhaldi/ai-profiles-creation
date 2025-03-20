from fastapi import APIRouter, HTTPException, Depends, Body, File, UploadFile, Form, status, Query
from typing import List, Optional
import logging

from app.models.documents import (
    DocumentCreate,
    DocumentUpdate,
    Document,
    DocumentStatus,
    DocumentList,
    DocumentUploadResponse,
    DocumentType
)
from app.services.documents.document_service import document_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=DocumentList)
async def list_documents(
    profile_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get a list of documents, optionally filtered by profile"""
    try:
        return document_service.get_documents(profile_id=profile_id, skip=skip, limit=limit)
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list documents: {str(e)}"
        )


@router.get("/{document_id}", response_model=Document)
async def get_document(document_id: str):
    """Get a document by ID"""
    document = document_service.get_document(document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found"
        )
    return document


@router.post("/", response_model=DocumentUploadResponse)
async def upload_document(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    profile_id: str = Form(...),
    document_type: DocumentType = Form(...),
    file: UploadFile = File(...)
):
    """Upload a new document"""
    try:
        # Create document model
        document_create = DocumentCreate(
            title=title,
            description=description,
            profile_id=profile_id,
            document_type=document_type
        )
        
        # Create document
        document = await document_service.create_document(document_create, file)
        
        return DocumentUploadResponse(
            document_id=document.id,
            status=document.status
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}"
        )


@router.put("/{document_id}", response_model=Document)
async def update_document(document_id: str, document_update: DocumentUpdate):
    """Update document information"""
    updated_document = document_service.update_document(document_id, document_update)
    
    if not updated_document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found"
        )
    
    return updated_document


@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """Delete a document"""
    if document_service.delete_document(document_id):
        return {"message": f"Document {document_id} deleted successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found"
        )


@router.put("/{document_id}/status", response_model=Document)
async def update_document_status(
    document_id: str,
    status: DocumentStatus = Body(..., embed=True),
    error: Optional[str] = Body(None, embed=True)
):
    """Update document processing status"""
    updated_document = document_service.update_document_status(document_id, status, error)
    
    if not updated_document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found"
        )
    
    return updated_document


@router.get("/{document_id}/content")
async def get_document_content(document_id: str):
    """Get the extracted text content of a document"""
    # Get the document
    document = document_service.get_document(document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found"
        )
    
    try:
        # Construct the path to the extracted text file
        processed_dir = document_service.PROCESSED_DIR / document_id
        text_file_path = processed_dir / "extracted_text.txt"
        
        # Check if the file exists
        if not text_file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Content for document with ID {document_id} not found"
            )
        
        # Read the file content
        with open(text_file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        return {"content": content}
    except Exception as e:
        logger.error(f"Error reading document content: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read document content: {str(e)}"
        )


@router.post("/sync-with-profiles")
async def sync_documents_with_profiles():
    """Maintenance endpoint to ensure all document IDs are in their corresponding profiles' document_ids arrays"""
    try:
        from app.services.profiles.profile_service import profile_service
        from app.models.profiles import ProfileUpdate
        
        # Get all documents
        document_list = document_service.get_documents()
        documents = document_list.documents
        
        # Track results
        updated_profiles = set()
        skipped_documents = []
        failed_updates = []
        
        # Process only completed documents
        for document in documents:
            if document.status != DocumentStatus.COMPLETED:
                skipped_documents.append(f"{document.id} (status: {document.status})")
                continue
                
            if not document.profile_id:
                skipped_documents.append(f"{document.id} (no profile_id)")
                continue
                
            try:
                # Get the profile
                profile = profile_service.get_profile(document.profile_id)
                if not profile:
                    skipped_documents.append(f"{document.id} (profile not found: {document.profile_id})")
                    continue
                    
                # Check if document ID already exists in profile's document_ids
                if document.id in profile.document_ids:
                    skipped_documents.append(f"{document.id} (already in profile)")
                    continue
                    
                # Create a new list with the document ID added
                updated_document_ids = list(profile.document_ids)
                updated_document_ids.append(document.id)
                
                # Create a profile update object
                profile_update = ProfileUpdate(document_ids=updated_document_ids)
                
                # Update the profile
                profile_service.update_profile(profile.id, profile_update)
                updated_profiles.add(profile.id)
                logger.info(f"Added document {document.id} to profile {profile.id}")
                
            except Exception as e:
                error_msg = f"Error updating profile {document.profile_id} with document {document.id}: {str(e)}"
                logger.error(error_msg)
                failed_updates.append(error_msg)
        
        return {
            "success": True,
            "updated_profiles_count": len(updated_profiles),
            "updated_profiles": list(updated_profiles),
            "skipped_documents_count": len(skipped_documents),
            "skipped_documents": skipped_documents,
            "failed_updates_count": len(failed_updates),
            "failed_updates": failed_updates
        }
        
    except Exception as e:
        logger.error(f"Error syncing documents with profiles: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync documents with profiles: {str(e)}"
        ) 