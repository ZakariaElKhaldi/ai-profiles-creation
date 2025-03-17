from datetime import datetime
from typing import List, Optional
from uuid import uuid4
from ..database import JsonDatabase
from ..schemas.dataset import DatasetCreate, Dataset, DatasetUpdate

async def create_dataset(db: JsonDatabase, dataset: DatasetCreate) -> Dataset:
    """
    Create a new dataset in the database
    
    Args:
        db: Database connection
        dataset: Dataset data
        
    Returns:
        The created dataset
    """
    now = datetime.now().isoformat()
    dataset_id = str(uuid4())
    
    dataset_data = {
        "id": dataset_id,
        "name": dataset.name,
        "description": dataset.description,
        "document_count": 0,
        "created_at": now,
        "updated_at": now
    }
    
    # Initialize datasets collection if it doesn't exist
    if "datasets" not in db.data:
        db.data["datasets"] = {}
    
    # Insert dataset into database
    db.data["datasets"][dataset_id] = dataset_data
    db.save()
    
    # Return the created dataset
    return Dataset(**dataset_data)

async def get_datasets(db: JsonDatabase, skip: int = 0, limit: int = 100) -> List[Dataset]:
    """
    Get all datasets from the database
    
    Args:
        db: Database connection
        skip: Number of items to skip
        limit: Maximum number of items to return
        
    Returns:
        List of datasets
    """
    # Initialize datasets collection if it doesn't exist
    if "datasets" not in db.data:
        db.data["datasets"] = {}
    
    datasets = []
    all_datasets = list(db.data["datasets"].values())
    
    # Apply pagination
    paginated_datasets = all_datasets[skip:skip + limit]
    
    for doc in paginated_datasets:
        datasets.append(Dataset(**doc))
    
    return datasets

async def get_dataset_by_id(db: JsonDatabase, dataset_id: str) -> Optional[Dataset]:
    """
    Get a dataset by ID
    
    Args:
        db: Database connection
        dataset_id: ID of the dataset to retrieve
        
    Returns:
        The dataset if found, None otherwise
    """
    # Initialize datasets collection if it doesn't exist
    if "datasets" not in db.data:
        return None
    
    dataset_data = db.data["datasets"].get(dataset_id)
    
    if dataset_data:
        return Dataset(**dataset_data)
    
    return None

async def update_dataset(db: JsonDatabase, dataset_id: str, dataset: DatasetCreate) -> Optional[Dataset]:
    """
    Update a dataset
    
    Args:
        db: Database connection
        dataset_id: ID of the dataset to update
        dataset: Updated dataset data
        
    Returns:
        The updated dataset if found, None otherwise
    """
    # Initialize datasets collection if it doesn't exist
    if "datasets" not in db.data:
        return None
    
    # Check if dataset exists
    dataset_data = db.data["datasets"].get(dataset_id)
    if not dataset_data:
        return None
    
    now = datetime.now().isoformat()
    
    # Update the dataset
    dataset_data["name"] = dataset.name
    dataset_data["description"] = dataset.description
    dataset_data["updated_at"] = now
    
    # Save changes
    db.data["datasets"][dataset_id] = dataset_data
    db.save()
    
    return Dataset(**dataset_data)

async def delete_dataset(db: JsonDatabase, dataset_id: str) -> bool:
    """
    Delete a dataset
    
    Args:
        db: Database connection
        dataset_id: ID of the dataset to delete
        
    Returns:
        True if the dataset was deleted, False otherwise
    """
    # Initialize datasets collection if it doesn't exist
    if "datasets" not in db.data:
        return False
    
    # Check if dataset exists
    if dataset_id not in db.data["datasets"]:
        return False
    
    # Delete the dataset
    del db.data["datasets"][dataset_id]
    db.save()
    
    return True

async def increment_document_count(db: JsonDatabase, dataset_id: str) -> bool:
    """
    Increment the document count for a dataset
    
    Args:
        db: Database connection
        dataset_id: ID of the dataset
        
    Returns:
        True if the document count was incremented, False otherwise
    """
    if not dataset_id:
        return False
    
    # Initialize datasets collection if it doesn't exist
    if "datasets" not in db.data:
        return False
    
    # Check if dataset exists
    dataset_data = db.data["datasets"].get(dataset_id)
    if not dataset_data:
        return False
    
    # Increment document count
    dataset_data["document_count"] += 1
    
    # Save changes
    db.data["datasets"][dataset_id] = dataset_data
    db.save()
    
    return True

async def decrement_document_count(db: JsonDatabase, dataset_id: str) -> bool:
    """
    Decrement the document count for a dataset
    
    Args:
        db: Database connection
        dataset_id: ID of the dataset
        
    Returns:
        True if the document count was decremented, False otherwise
    """
    if not dataset_id:
        return False
    
    # Initialize datasets collection if it doesn't exist
    if "datasets" not in db.data:
        return False
    
    # Check if dataset exists
    dataset_data = db.data["datasets"].get(dataset_id)
    if not dataset_data:
        return False
    
    # Ensure count doesn't go below 0
    if dataset_data["document_count"] > 0:
        dataset_data["document_count"] -= 1
    
    # Save changes
    db.data["datasets"][dataset_id] = dataset_data
    db.save()
    
    return True 