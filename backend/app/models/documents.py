from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
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
    model_config = ConfigDict(extra='allow')
    
    title: str
    description: Optional[str] = Field(default=None)
    document_type: DocumentType
    profile_id: str


class DocumentCreate(DocumentBase):
    """Model for document creation requests"""
    model_config = ConfigDict(extra='allow')


class DocumentUpdate(BaseModel):
    """Model for document update requests"""
    model_config = ConfigDict(extra='allow')
    
    title: Optional[str] = Field(default=None)
    description: Optional[str] = Field(default=None)
    status: Optional[DocumentStatus] = Field(default=None)


class DocumentMetadata(BaseModel):
    """Model for document metadata"""
    model_config = ConfigDict(extra='allow')
    
    page_count: Optional[int] = Field(default=None)
    word_count: Optional[int] = Field(default=None)
    author: Optional[str] = Field(default=None)
    created_date: Optional[datetime] = Field(default=None)
    modified_date: Optional[datetime] = Field(default=None)
    size_bytes: Optional[int] = Field(default=None)
    extracted_entities: Optional[Dict[str, Any]] = Field(default=None)
    keywords: Optional[List[str]] = Field(default=None)


class DocumentInDB(DocumentBase):
    """Model for document in database"""
    model_config = ConfigDict(extra='allow', from_attributes=True)
    
    id: str
    status: DocumentStatus = Field(default=DocumentStatus.PENDING)
    file_path: str
    upload_date: datetime
    metadata: Optional[DocumentMetadata] = Field(default=None)
    processing_error: Optional[str] = Field(default=None)


class Document(DocumentInDB):
    """Full document model for API responses"""
    model_config = ConfigDict(extra='allow', from_attributes=True)


class DocumentList(BaseModel):
    """Model for a list of documents"""
    model_config = ConfigDict(extra='allow')
    
    total: int
    documents: List[Document]


class DocumentUploadResponse(BaseModel):
    """Response model for document upload endpoints"""
    model_config = ConfigDict(extra='allow')
    
    document_id: str
    message: str = Field(default="Document uploaded successfully")
    status: DocumentStatus 