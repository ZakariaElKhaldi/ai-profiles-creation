from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID, uuid4

class TagBase(BaseModel):
    name: str = Field(..., description="Name of the tag")
    color: Optional[str] = Field("#3b82f6", description="Color of the tag in hex format (e.g., #3b82f6)")

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: str = Field(default_factory=lambda: str(uuid4()), description="Unique identifier for the tag")
    document_count: int = Field(default=0, description="Number of documents with this tag")
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat(), description="Timestamp when the tag was created")
    updated_at: Optional[str] = Field(None, description="Timestamp when the tag was last updated")

    class Config:
        from_attributes = True  # Updated from orm_mode for Pydantic v2

class TagUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Updated name of the tag")
    color: Optional[str] = Field(None, description="Updated color of the tag")

class TagResponse(BaseModel):
    message: Optional[str] = None
    tag: Tag

class TagListResponse(BaseModel):
    tags: List[Tag]
    total: int 