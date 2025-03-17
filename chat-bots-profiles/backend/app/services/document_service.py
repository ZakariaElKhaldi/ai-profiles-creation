from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import uuid4
from ..database import JsonDatabase
from ..schemas.document import DocumentCreate, Document, DocumentMetadata, DocumentType
from .dataset_service import increment_document_count, decrement_document_count as decrement_dataset_doc_count
from .tag_service import increment_document_count as increment_tag_doc_count, decrement_document_count as decrement_tag_doc_count
from fastapi import HTTPException
from ..schemas.document import DocumentUpdate

# ... existing code ...

async def create_document(document: DocumentCreate, db: JsonDatabase) -> Document:
    """Create a new document"""
    try:
        # Initialize documents collection if it doesn't exist
        if "documents" not in db.data:
            db.data["documents"] = {}
        
        # Create new document
        doc_id = f"doc_{len(db.data['documents']) + 1}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Get dataset name if dataset_id is provided
        dataset_name = None
        if document.dataset_id and "datasets" in db.data and document.dataset_id in db.data["datasets"]:
            dataset_name = db.data["datasets"][document.dataset_id]["name"]
        
        new_doc = {
            "id": doc_id,
            "title": document.title,
            "content": document.content,
            "dataset_id": document.dataset_id,
            "dataset_name": dataset_name,
            "tag_ids": document.tag_ids or [],
            "metadata": document.metadata.dict() if document.metadata else {},
            "is_favorite": False,
            "embedding_status": "pending",
            "created_at": datetime.now().isoformat(),
            "updated_at": None
        }
        
        # Save document
        db.data["documents"][doc_id] = new_doc
        db.save()
        
        return Document(**new_doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create document: {str(e)}")

async def get_documents(
    db: JsonDatabase,
    dataset_id: Optional[str] = None,
    tag_ids: Optional[List[str]] = None,
    favorite: Optional[bool] = None,
    limit: int = 100,
    offset: int = 0
) -> tuple[List[Document], int]:
    """Get a list of documents with optional filtering"""
    try:
        # Initialize documents collection if it doesn't exist
        if "documents" not in db.data:
            db.data["documents"] = {}
            db.save()
            return [], 0
        
        # Get all documents
        documents = list(db.data["documents"].values())
        
        # Apply filters
        if dataset_id:
            documents = [doc for doc in documents if doc.get("dataset_id") == dataset_id]
        
        if tag_ids:
            documents = [
                doc for doc in documents 
                if any(tag_id in doc.get("tag_ids", []) for tag_id in tag_ids)
            ]
        
        if favorite is not None:
            documents = [doc for doc in documents if doc.get("is_favorite", False) == favorite]
        
        # Sort by created_at (newest first)
        documents.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        # Apply pagination
        total = len(documents)
        documents = documents[offset:offset + limit]
        
        return [Document(**doc) for doc in documents], total
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve documents: {str(e)}")

async def get_document_by_id(document_id: str, db: JsonDatabase) -> Optional[Document]:
    """Get a document by ID"""
    try:
        # Initialize documents collection if it doesn't exist
        if "documents" not in db.data or document_id not in db.data["documents"]:
            return None
        
        document = db.data["documents"][document_id]
        return Document(**document)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve document: {str(e)}")

async def update_document(document_id: str, updates: DocumentUpdate, db: JsonDatabase) -> Optional[Document]:
    """Update a document"""
    try:
        # Check if document exists
        if "documents" not in db.data or document_id not in db.data["documents"]:
            return None
        
        # Get existing document
        document = db.data["documents"][document_id]
        
        # Update fields
        if updates.title is not None:
            document["title"] = updates.title
        
        if updates.content is not None:
            document["content"] = updates.content
            
        if updates.dataset_id is not None:
            document["dataset_id"] = updates.dataset_id
            
            # Update dataset name
            if updates.dataset_id and "datasets" in db.data and updates.dataset_id in db.data["datasets"]:
                document["dataset_name"] = db.data["datasets"][updates.dataset_id]["name"]
            else:
                document["dataset_name"] = None
        
        if updates.tag_ids is not None:
            document["tag_ids"] = updates.tag_ids
        
        if updates.metadata is not None:
            document["metadata"] = updates.metadata.dict()
        
        if updates.is_favorite is not None:
            document["is_favorite"] = updates.is_favorite
        
        # Update timestamp
        document["updated_at"] = datetime.now().isoformat()
        
        # Save changes
        db.data["documents"][document_id] = document
        db.save()
        
        return Document(**document)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update document: {str(e)}")

async def delete_document(document_id: str, db: JsonDatabase) -> bool:
    """Delete a document"""
    try:
        # Check if document exists
        if "documents" not in db.data or document_id not in db.data["documents"]:
            return False
        
        # Delete document
        del db.data["documents"][document_id]
        db.save()
        
        return True
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")

async def search_documents(
    query: str,
    db: JsonDatabase,
    dataset_id: Optional[str] = None,
    tag_ids: Optional[List[str]] = None,
    limit: int = 10
) -> List[Document]:
    """Search documents (basic implementation - no embeddings)"""
    try:
        # Initialize documents collection if it doesn't exist
        if "documents" not in db.data:
            return []
        
        # Get all documents
        documents = list(db.data["documents"].values())
        
        # Apply filters
        if dataset_id:
            documents = [doc for doc in documents if doc.get("dataset_id") == dataset_id]
        
        if tag_ids:
            documents = [
                doc for doc in documents 
                if any(tag_id in doc.get("tag_ids", []) for tag_id in tag_ids)
            ]
        
        # Simple text search
        query = query.lower()
        results = []
        
        for doc in documents:
            title = doc.get("title", "").lower()
            content = doc.get("content", "").lower()
            
            if query in title or query in content:
                score = 0
                if query in title:
                    score += 10  # Higher score for title matches
                if query in content:
                    score += 5   # Lower score for content matches
                
                results.append((doc, score))
        
        # Sort by score (highest first)
        results.sort(key=lambda x: x[1], reverse=True)
        
        # Return top results
        return [Document(**doc) for doc, _ in results[:limit]]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search documents: {str(e)}")

async def generate_embedding(document_id: str, db: JsonDatabase) -> bool:
    """Simulate embedding generation (in a real app, this would call an embedding service)"""
    try:
        # Check if document exists
        if "documents" not in db.data or document_id not in db.data["documents"]:
            return False
        
        # Update embedding status
        db.data["documents"][document_id]["embedding_status"] = "processing"
        db.save()
        
        # In a real app, you would call an embedding service here
        # For this example, we'll just update the status to "completed"
        db.data["documents"][document_id]["embedding_status"] = "completed"
        db.save()
        
        return True
    except Exception as e:
        # If there's an error, mark as failed
        if "documents" in db.data and document_id in db.data["documents"]:
            db.data["documents"][document_id]["embedding_status"] = "failed"
            db.save()
        
        raise HTTPException(status_code=500, detail=f"Failed to generate embeddings: {str(e)}")

# ... existing code ... 