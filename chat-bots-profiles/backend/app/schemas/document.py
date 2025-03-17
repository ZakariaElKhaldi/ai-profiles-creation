from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Union, Set
from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4


class DocumentType(str, Enum):
    """Document type enum"""
    TEXT = "text"
    PDF = "pdf"
    DOCX = "docx"
    MARKDOWN = "markdown"
    CSV = "csv"
    JSON = "json"
    EXCEL = "excel"
    HTML = "html"
    OTHER = "other"


class EmbeddingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentTag(BaseModel):
    """Document tag model"""
    id: str
    name: str
    color: str = "#3b82f6"  # Default blue color


class DocumentTagCreate(BaseModel):
    """Document tag creation model"""
    name: str
    color: Optional[str] = "#3b82f6"  # Default blue color


class DocumentMetadata(BaseModel):
    """Document metadata"""
    author: Optional[str] = None
    created_date: Optional[str] = None
    modified_date: Optional[str] = None
    page_count: Optional[int] = None
    source: Optional[str] = None
    language: Optional[str] = None


class DatasetCreate(BaseModel):
    """Dataset creation model"""
    name: str
    description: Optional[str] = None


class Dataset(BaseModel):
    """Dataset model"""
    id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    document_count: int = 0


class DocumentBase(BaseModel):
    """Base document model"""
    title: str
    content: str
    dataset_id: Optional[str] = None
    tag_ids: Optional[List[str]] = None
    is_favorite: bool = False
    metadata: Optional[DocumentMetadata] = None


class DocumentCreate(DocumentBase):
    """Document creation model"""
    pass


class DocumentInfo(DocumentBase):
    """Document information model"""
    id: str
    dateAdded: str
    embedding: bool = False
    summary: Optional[str] = None
    tags: Optional[List[DocumentTag]] = None
    favorite: bool = False


class DocumentAnalysisResponse(BaseModel):
    """Document analysis response"""
    word_count: int
    reading_time: int
    key_phrases: List[str]
    summary: Optional[str] = None
    message: Optional[str] = None
    document_id: Optional[str] = None
    key_points: Optional[List[str]] = None
    entities: Optional[Dict[str, List[str]]] = None
    sentiment: Optional[str] = None
    topics: Optional[List[str]] = None


class DocumentListResponse(BaseModel):
    """Document list response"""
    documents: List[DocumentInfo]
    count: int


class DocumentSearchQuery(BaseModel):
    """Document search query"""
    query: str
    limit: int = 5
    dataset_id: Optional[str] = None
    tag_ids: Optional[List[str]] = None


class DatasetResponse(BaseModel):
    """Dataset response"""
    dataset: Dataset
    message: str


class DatasetListResponse(BaseModel):
    """Dataset list response"""
    datasets: List[Dataset]
    count: int


class TagResponse(BaseModel):
    """Tag response"""
    tag: DocumentTag
    message: str


class TagListResponse(BaseModel):
    """Tag list response"""
    tags: List[DocumentTag]
    count: int


class Document(DocumentBase):
    id: str = Field(default_factory=lambda: str(uuid4()))
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    dataset_name: Optional[str] = None
    tag_ids: Optional[List[str]] = []
    metadata: Optional[DocumentMetadata] = None
    is_favorite: bool = False
    embedding_status: Optional[str] = None  # "pending", "processing", "completed", "failed"
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    """Document upload response"""
    message: str
    document: Optional[Document] = None
    success: bool = True
    extracted_text: Optional[str] = None


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    dataset_id: Optional[str] = None
    tag_ids: Optional[List[str]] = None
    metadata: Optional[DocumentMetadata] = None
    is_favorite: Optional[bool] = None


class DocumentResponse(BaseModel):
    message: Optional[str] = None
    document: Document


class DocumentListResponse(BaseModel):
    documents: List[Document]
    total: int 