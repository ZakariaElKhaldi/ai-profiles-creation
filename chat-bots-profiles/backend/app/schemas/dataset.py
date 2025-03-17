from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID, uuid4

class DatasetBase(BaseModel):
    name: str = Field(..., description="Name of the dataset")
    description: Optional[str] = Field(None, description="Description of the dataset")

class DatasetCreate(DatasetBase):
    pass

class Dataset(DatasetBase):
    id: str = Field(default_factory=lambda: str(uuid4()), description="Unique identifier for the dataset")
    document_count: int = Field(default=0, description="Number of documents in the dataset")
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat(), description="Timestamp when the dataset was created")
    updated_at: Optional[str] = Field(None, description="Timestamp when the dataset was last updated")

    class Config:
        from_attributes = True  # Updated from orm_mode for Pydantic v2

class DatasetUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Updated name of the dataset")
    description: Optional[str] = Field(None, description="Updated description of the dataset")

class DatasetResponse(BaseModel):
    message: str
    dataset: Dataset

class DatasetListResponse(BaseModel):
    datasets: List[Dataset]
    total: int 