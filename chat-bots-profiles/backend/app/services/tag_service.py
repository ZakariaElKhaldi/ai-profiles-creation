from datetime import datetime
from typing import List, Optional
from uuid import uuid4
from ..database import JsonDatabase
from ..schemas.tag import TagCreate, Tag, TagUpdate

async def create_tag(db: JsonDatabase, tag: TagCreate) -> Tag:
    """
    Create a new tag in the database
    
    Args:
        db: Database connection
        tag: Tag data
        
    Returns:
        The created tag
    """
    now = datetime.now().isoformat()
    tag_id = str(uuid4())
    
    tag_data = {
        "id": tag_id,
        "name": tag.name,
        "color": tag.color or "#3b82f6",  # Default blue color
        "document_count": 0,
        "created_at": now,
        "updated_at": now
    }
    
    # Initialize tags collection if it doesn't exist
    if "tags" not in db.data:
        db.data["tags"] = {}
    
    # Insert tag into database
    db.data["tags"][tag_id] = tag_data
    db.save()
    
    # Return the created tag
    return Tag(**tag_data)

async def get_tags(db: JsonDatabase, skip: int = 0, limit: int = 100) -> List[Tag]:
    """
    Get all tags from the database
    
    Args:
        db: Database connection
        skip: Number of items to skip
        limit: Maximum number of items to return
        
    Returns:
        List of tags
    """
    # Initialize tags collection if it doesn't exist
    if "tags" not in db.data:
        db.data["tags"] = {}
    
    # Get all tags
    all_tags = list(db.data["tags"].values())
    
    # Apply pagination
    paginated_tags = all_tags[skip:skip + limit]
    
    return [Tag(**tag) for tag in paginated_tags]

async def get_tag_by_id(db: JsonDatabase, tag_id: str) -> Optional[Tag]:
    """
    Get a tag by ID
    
    Args:
        db: Database connection
        tag_id: ID of the tag to retrieve
        
    Returns:
        The tag if found, None otherwise
    """
    # Initialize tags collection if it doesn't exist
    if "tags" not in db.data:
        return None
    
    # Get tag by ID
    tag_data = db.data["tags"].get(tag_id)
    
    if tag_data:
        return Tag(**tag_data)
    
    return None

async def update_tag(db: JsonDatabase, tag_id: str, tag: TagCreate) -> Optional[Tag]:
    """
    Update a tag
    
    Args:
        db: Database connection
        tag_id: ID of the tag to update
        tag: Updated tag data
        
    Returns:
        The updated tag if found, None otherwise
    """
    # Initialize tags collection if it doesn't exist
    if "tags" not in db.data:
        return None
    
    # Check if tag exists
    tag_data = db.data["tags"].get(tag_id)
    if not tag_data:
        return None
    
    now = datetime.now().isoformat()
    
    # Update tag data
    tag_data["name"] = tag.name
    tag_data["color"] = tag.color
    tag_data["updated_at"] = now
    
    # Save changes
    db.data["tags"][tag_id] = tag_data
    db.save()
    
    return Tag(**tag_data)

async def delete_tag(db: JsonDatabase, tag_id: str) -> bool:
    """
    Delete a tag
    
    Args:
        db: Database connection
        tag_id: ID of the tag to delete
        
    Returns:
        True if the tag was deleted, False otherwise
    """
    # Initialize tags collection if it doesn't exist
    if "tags" not in db.data:
        return False
    
    # Check if tag exists
    if tag_id not in db.data["tags"]:
        return False
    
    # Delete tag
    del db.data["tags"][tag_id]
    db.save()
    
    return True

async def increment_document_count(db: JsonDatabase, tag_id: str) -> bool:
    """
    Increment the document count for a tag
    
    Args:
        db: Database connection
        tag_id: ID of the tag
        
    Returns:
        True if the document count was incremented, False otherwise
    """
    if not tag_id:
        return False
    
    # Initialize tags collection if it doesn't exist
    if "tags" not in db.data:
        return False
    
    # Check if tag exists
    tag_data = db.data["tags"].get(tag_id)
    if not tag_data:
        return False
    
    # Increment document count
    tag_data["document_count"] += 1
    
    # Save changes
    db.data["tags"][tag_id] = tag_data
    db.save()
    
    return True

async def decrement_document_count(db: JsonDatabase, tag_id: str) -> bool:
    """
    Decrement the document count for a tag
    
    Args:
        db: Database connection
        tag_id: ID of the tag
        
    Returns:
        True if the document count was decremented, False otherwise
    """
    if not tag_id:
        return False
    
    # Initialize tags collection if it doesn't exist
    if "tags" not in db.data:
        return False
    
    # Check if tag exists
    tag_data = db.data["tags"].get(tag_id)
    if not tag_data:
        return False
    
    # Decrement document count, but don't go below 0
    if tag_data["document_count"] > 0:
        tag_data["document_count"] -= 1
    
    # Save changes
    db.data["tags"][tag_id] = tag_data
    db.save()
    
    return True

async def get_tags_for_document(db: JsonDatabase, doc_id: str) -> List[Tag]:
    """
    Get all tags for a specific document
    
    Args:
        db: Database connection
        doc_id: ID of the document
        
    Returns:
        List of tags associated with the document
    """
    # Initialize collections if they don't exist
    if "documents" not in db.data or "tags" not in db.data:
        return []
    
    # First get the document to find its tag IDs
    document = db.data["documents"].get(doc_id)
    
    if not document or "tag_ids" not in document or not document["tag_ids"]:
        return []
    
    # Get all tags with IDs in the document's tag_ids
    tag_ids = document["tag_ids"]
    tags = []
    
    for tag_id in tag_ids:
        tag_data = db.data["tags"].get(tag_id)
        if tag_data:
            tags.append(Tag(**tag_data))
    
    return tags 