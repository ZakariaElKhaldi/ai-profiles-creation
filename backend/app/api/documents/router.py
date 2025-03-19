from fastapi import APIRouter, HTTPException, Depends, Body, File, UploadFile, Form, status, Query
from typing import List, Optional
import logging

from backend.app.models.documents import (
    DocumentCreate,
    DocumentUpdate,
    Document,
    DocumentStatus,
    DocumentList,
    DocumentUploadResponse,
    DocumentType
)
from backend.app.services.documents.document_service import document_service

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