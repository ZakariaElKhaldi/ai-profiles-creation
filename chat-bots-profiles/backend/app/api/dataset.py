from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Optional
from ..database import get_db
from ..schemas.dataset import DatasetCreate, Dataset, DatasetResponse, DatasetListResponse
from ..services.dataset_service import (
    create_dataset, 
    get_datasets, 
    get_dataset_by_id, 
    update_dataset, 
    delete_dataset
)

router = APIRouter(tags=["datasets"])

@router.post("/", response_model=DatasetResponse)
async def create_dataset_endpoint(dataset: DatasetCreate = Body(...), db=Depends(get_db)):
    """Create a new dataset"""
    try:
        result = await create_dataset(db, dataset)
        return {"message": "Dataset created successfully", "dataset": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create dataset: {str(e)}")

@router.get("/", response_model=DatasetListResponse)
async def get_datasets_endpoint(
    skip: int = Query(0, ge=0), 
    limit: int = Query(100, ge=1, le=1000),
    db=Depends(get_db)
):
    """Get a list of all datasets"""
    try:
        datasets = await get_datasets(db, skip, limit)
        return {"datasets": datasets, "total": len(datasets)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve datasets: {str(e)}")

@router.get("/{dataset_id}", response_model=DatasetResponse)
async def get_dataset_endpoint(dataset_id: str, db=Depends(get_db)):
    """Get a dataset by ID"""
    try:
        dataset = await get_dataset_by_id(db, dataset_id)
        if not dataset:
            raise HTTPException(status_code=404, detail=f"Dataset with ID {dataset_id} not found")
        return {"message": "Dataset retrieved successfully", "dataset": dataset}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve dataset: {str(e)}")

@router.put("/{dataset_id}", response_model=DatasetResponse)
async def update_dataset_endpoint(
    dataset_id: str, 
    dataset_data: DatasetCreate = Body(...), 
    db=Depends(get_db)
):
    """Update a dataset"""
    try:
        # Check if dataset exists
        existing_dataset = await get_dataset_by_id(db, dataset_id)
        if not existing_dataset:
            raise HTTPException(status_code=404, detail=f"Dataset with ID {dataset_id} not found")
        
        # Update dataset
        updated_dataset = await update_dataset(db, dataset_id, dataset_data)
        return {"message": "Dataset updated successfully", "dataset": updated_dataset}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update dataset: {str(e)}")

@router.delete("/{dataset_id}", response_model=dict)
async def delete_dataset_endpoint(dataset_id: str, db=Depends(get_db)):
    """Delete a dataset"""
    try:
        # Check if dataset exists
        existing_dataset = await get_dataset_by_id(db, dataset_id)
        if not existing_dataset:
            raise HTTPException(status_code=404, detail=f"Dataset with ID {dataset_id} not found")
        
        # Delete dataset
        result = await delete_dataset(db, dataset_id)
        if result:
            return {"message": "Dataset deleted successfully", "success": True}
        else:
            return {"message": "Failed to delete dataset", "success": False}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete dataset: {str(e)}") 