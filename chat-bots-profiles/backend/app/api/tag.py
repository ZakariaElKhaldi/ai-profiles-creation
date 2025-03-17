from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Optional
from ..database import get_db, JsonDatabase
from ..schemas.tag import TagCreate, Tag, TagResponse, TagListResponse, TagBase, TagUpdate
from ..services.tag_service import (
    create_tag, 
    get_tags, 
    get_tag_by_id, 
    update_tag, 
    delete_tag
)
import uuid
from datetime import datetime
import os
from app.database import get_document_db

router = APIRouter(tags=["tags"])

@router.post("/", response_model=TagResponse)
async def create_tag_endpoint(tag: TagCreate = Body(...), db: JsonDatabase = Depends(get_db)):
    """Create a new tag"""
    try:
        tag_id = str(uuid.uuid4())
        created_at = datetime.now().isoformat()
        
        # If no color is provided, generate a default one
        if not tag.color:
            # Simple color generation based on the tag name
            colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#6366F1"]
            color_index = sum(ord(c) for c in tag.name) % len(colors)
            tag_color = colors[color_index]
        else:
            tag_color = tag.color
        
        new_tag = {
            "id": tag_id,
            "name": tag.name,
            "color": tag_color,
            "created_at": created_at,
            "updated_at": created_at,
            "document_count": 0
        }
        
        # Initialize tags collection if it doesn't exist
        if "tags" not in db.data:
            db.data["tags"] = {}
        
        # Save to database
        db.data["tags"][tag_id] = new_tag
        db.save()
        
        return {"tag": Tag(**new_tag)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create tag: {str(e)}")

@router.get("/", response_model=TagListResponse)
async def get_tags_endpoint(db: JsonDatabase = Depends(get_db)):
    """Get a list of all tags"""
    try:
        # Initialize tags collection if it doesn't exist
        if "tags" not in db.data:
            db.data["tags"] = {}
            db.save()
        
        tags = list(db.data["tags"].values())
        
        # Count documents for each tag
        if "documents" in db.data:
            for tag in tags:
                count = sum(1 for doc in db.data["documents"].values() 
                           if "tag_ids" in doc and tag["id"] in doc["tag_ids"])
                tag["document_count"] = count
        
        return {"tags": [Tag(**tag) for tag in tags], "total": len(tags)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve tags: {str(e)}")

@router.get("/{tag_id}", response_model=TagResponse)
async def get_tag_endpoint(tag_id: str, db: JsonDatabase = Depends(get_db)):
    """Get a tag by ID"""
    try:
        # Initialize tags collection if it doesn't exist
        if "tags" not in db.data or tag_id not in db.data["tags"]:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        tag = db.data["tags"][tag_id]
        
        # Count documents with this tag
        if "documents" in db.data:
            count = sum(1 for doc in db.data["documents"].values() 
                       if "tag_ids" in doc and tag_id in doc["tag_ids"])
            tag["document_count"] = count
        
        return {"tag": Tag(**tag)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve tag: {str(e)}")

@router.patch("/{tag_id}", response_model=TagResponse)
async def update_tag_endpoint(tag_id: str, updates: TagUpdate = Body(...), db: JsonDatabase = Depends(get_db)):
    """Update a tag by ID"""
    try:
        # Verify the tag exists
        existing_tag = await get_tag_by_id(tag_id, db)
        if not existing_tag:
            raise HTTPException(status_code=404, detail=f"Tag with ID {tag_id} not found")
        
        # Update the tag
        updated_tag = await update_tag(tag_id, updates, db)
        return {"message": "Tag updated successfully", "tag": updated_tag}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{tag_id}")
async def delete_tag_endpoint(tag_id: str, db: JsonDatabase = Depends(get_db)):
    """Delete a tag"""
    try:
        # Initialize tags collection if it doesn't exist
        if "tags" not in db.data or tag_id not in db.data["tags"]:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        # Get tag name before removal
        tag_name = db.data["tags"][tag_id]["name"]
        
        # Remove tag
        del db.data["tags"][tag_id]
        
        # Remove tag from documents
        if "documents" in db.data:
            for doc_id, doc in db.data["documents"].items():
                if "tag_ids" in doc and tag_id in doc["tag_ids"]:
                    doc["tag_ids"].remove(tag_id)
        
        db.save()
        
        return {"success": True, "message": f"Tag '{tag_name}' deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete tag: {str(e)}")

@router.get("/{tag_id}/documents")
async def get_tag_documents(tag_id: str, db: JsonDatabase = Depends(get_db)):
    """Get all documents for a specific tag"""
    try:
        # Initialize tags collection if it doesn't exist
        if "tags" not in db.data or tag_id not in db.data["tags"]:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        # Get documents with this tag
        if "documents" not in db.data:
            return {"documents": [], "count": 0}
        
        documents = [doc for doc_id, doc in db.data["documents"].items() 
                     if "tag_ids" in doc and tag_id in doc["tag_ids"]]
        
        return {"documents": documents, "count": len(documents)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve tag documents: {str(e)}") 