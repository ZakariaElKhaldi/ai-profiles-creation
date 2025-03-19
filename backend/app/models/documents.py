from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class DocumentStatus(str, Enum):
    """Document processing status enum"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentType(str, Enum):
    """Supported document types enum"""
    PDF = "pdf"
    DOCX = "docx"
    TXT = "txt"
    CSV = "csv"
    XLSX = "xlsx"


class DocumentBase(BaseModel):
    """Base document model with common fields"""
    title: str
    description: Optional[str] = None
    document_type: DocumentType
    profile_id: str


class DocumentCreate(DocumentBase):
    """Model for document creation requests"""
    pass


class DocumentUpdate(BaseModel):
    """Model for document update requests"""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[DocumentStatus] = None


class DocumentMetadata(BaseModel):
    """Model for document metadata"""
    page_count: Optional[int] = None
    word_count: Optional[int] = None
    author: Optional[str] = None
    created_date: Optional[datetime] = None
    modified_date: Optional[datetime] = None
    size_bytes: Optional[int] = None
    extracted_entities: Optional[Dict[str, Any]] = None
    keywords: Optional[List[str]] = None


class DocumentInDB(DocumentBase):
    """Model for document in database"""
    id: str
    status: DocumentStatus = DocumentStatus.PENDING
    file_path: str
    upload_date: datetime
    metadata: Optional[DocumentMetadata] = None
    processing_error: Optional[str] = None
    
    class Config:
        orm_mode = True


class Document(DocumentInDB):
    """Full document model for API responses"""
    pass


class DocumentList(BaseModel):
    """Model for a list of documents"""
    total: int
    documents: List[Document]


class DocumentUploadResponse(BaseModel):
    """Response model for document upload endpoints"""
    document_id: str
    message: str = "Document uploaded successfully"
    status: DocumentStatus 