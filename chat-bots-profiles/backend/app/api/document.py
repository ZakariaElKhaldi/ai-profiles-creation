from fastapi import APIRouter, HTTPException, File, Form, UploadFile, Body, Query, Depends
from typing import List, Dict, Any, Optional
import time
import uuid
import os
import io
import shutil
import logging
import json

from app.schemas.document import (
    DocumentInfo, 
    DocumentCreate, 
    DocumentUploadResponse, 
    DocumentListResponse,
    DocumentSearchQuery,
    Dataset,
    DatasetCreate,
    DatasetResponse,
    DatasetListResponse,
    DocumentTag,
    DocumentTagCreate,
    TagResponse,
    TagListResponse,
    DocumentAnalysisResponse
)
from app.utils import DocumentProcessor, DocumentStore
from app.services.document import document_service
from ..database import get_db, JsonDatabase
from ..schemas.document import Document, DocumentUpdate, DocumentResponse
from ..services.document_service import (
    create_document,
    get_documents,
    get_document_by_id,
    update_document,
    delete_document,
    search_documents,
    generate_embedding
)

router = APIRouter(tags=["documents"])
logger = logging.getLogger(__name__)

# Initialize document processor and store
document_processor = DocumentProcessor()
document_store = DocumentStore()


@router.post("/upload", response_model=Dict[str, str])
async def upload_file(file: bytes = File(...), filename: str = Form(...)):
    """
    Upload and process a document
    
    Args:
        file: File bytes
        filename: Name of the file
        
    Returns:
        Status of the upload operation
    """
    # Process the file
    doc_id = str(uuid.uuid4())
    timestamp = int(time.time())
    
    try:
        # Get file extension
        _, file_ext = os.path.splitext(filename.lower())
        
        # Check if the file type is supported
        if file_ext not in document_processor.supported_formats:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file format: {file_ext}. Supported formats: {', '.join(document_processor.supported_formats.keys())}"
            )
        
        # Process the file
        text_chunks = document_processor.process_document(file, file_ext[1:])
        
        # Store chunks
        document_store.store_document(doc_id, filename, timestamp, text_chunks)
        
        return {"id": doc_id, "message": f"Document '{filename}' uploaded and processed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")


@router.post("/documents/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    dataset_id: Optional[str] = Form(None),
    tags: Optional[str] = Form(None)
):
    """
    Upload and process a document file
    
    Args:
        file: File to upload
        session_id: Optional session ID
        dataset_id: Optional dataset ID
        tags: Comma-separated list of tags
        
    Returns:
        Processed document information
    """
    try:
        # Parse tags if provided (comma-separated list)
        tags_list = tags.split(",") if tags else None
        
        # Process uploaded file
        document = document_service.upload_document(
            file.file, 
            file.filename, 
            session_id,
            dataset_id,
            tags_list
        )
        
        return DocumentUploadResponse(
            success=True,
            document=document,
            message="Document uploaded successfully"
        )
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        return DocumentUploadResponse(
            success=False,
            document=None,
            message=f"Error uploading document: {str(e)}"
        )


@router.post("/documents/batch-upload", response_model=List[DocumentUploadResponse])
async def batch_upload_documents(
    files: List[UploadFile] = File(...),
    session_id: Optional[str] = Form(None),
    dataset_id: Optional[str] = Form(None),
    tags: Optional[str] = Form(None)
):
    """
    Upload and process multiple document files in batch
    
    Args:
        files: List of files to upload
        session_id: Optional session ID
        dataset_id: Optional dataset ID
        tags: Comma-separated list of tags
        
    Returns:
        List of processed document information
    """
    results = []
    
    # Parse tags if provided (comma-separated list)
    tags_list = tags.split(",") if tags else None
    
    for file in files:
        try:
            # Process uploaded file
            document = document_service.upload_document(
                file.file, 
                file.filename, 
                session_id,
                dataset_id,
                tags_list
            )
            
            results.append(DocumentUploadResponse(
                success=True,
                document=document,
                message="Document uploaded successfully"
            ))
        except Exception as e:
            logger.error(f"Error uploading document {file.filename}: {e}")
            results.append(DocumentUploadResponse(
                success=False,
                document=None,
                message=f"Error uploading document {file.filename}: {str(e)}"
            ))
    
    return results


@router.get("/documents/search", response_model=DocumentListResponse)
async def search_documents(
    query: str,
    limit: int = 5,
    dataset_id: Optional[str] = None,
    tag_ids: Optional[str] = None
):
    """
    Search documents by query
    
    Args:
        query: Search query
        limit: Maximum number of results
        dataset_id: Dataset ID
        tag_ids: Comma-separated list of tag IDs
        
    Returns:
        Search results
    """
    try:
        # Parse tag_ids if provided (comma-separated list)
        tags_list = tag_ids.split(",") if tag_ids else None
        
        documents = document_service.search_documents(query, limit, dataset_id, tags_list)
        return DocumentListResponse(documents=documents, count=len(documents))
    except Exception as e:
        logger.error(f"Error searching documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=DocumentResponse)
async def create_document_endpoint(document: DocumentCreate = Body(...), db: JsonDatabase = Depends(get_db)):
    """Create a new document"""
    try:
        created_doc = await create_document(document, db)
        return {"message": "Document created successfully", "document": created_doc}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=DocumentListResponse)
async def get_documents_endpoint(
    dataset_id: Optional[str] = Query(None, description="Filter by dataset ID"),
    tag_ids: Optional[str] = Query(None, description="Filter by tag IDs (comma-separated)"),
    favorite: Optional[bool] = Query(None, description="Filter by favorite status"),
    limit: int = Query(100, description="Maximum number of documents to return"),
    offset: int = Query(0, description="Number of documents to skip"),
    db: JsonDatabase = Depends(get_db)
):
    """Get a list of documents with optional filtering"""
    try:
        # Parse tag_ids
        tag_id_list = tag_ids.split(",") if tag_ids else None
        
        documents, total = await get_documents(
            db=db,
            dataset_id=dataset_id,
            tag_ids=tag_id_list,
            favorite=favorite,
            limit=limit,
            offset=offset
        )
        
        return {"documents": documents, "total": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search", response_model=DocumentListResponse)
async def search_documents_endpoint(
    query: str = Query(..., description="Search query"),
    dataset_id: Optional[str] = Query(None, description="Filter by dataset ID"),
    tag_ids: Optional[str] = Query(None, description="Filter by tag IDs (comma-separated)"),
    limit: int = Query(10, description="Maximum number of documents to return"),
    db: JsonDatabase = Depends(get_db)
):
    """Search documents"""
    try:
        # Parse tag_ids
        tag_id_list = tag_ids.split(",") if tag_ids else None
        
        documents = await search_documents(
            query=query,
            db=db,
            dataset_id=dataset_id,
            tag_ids=tag_id_list,
            limit=limit
        )
        
        return {"documents": documents, "total": len(documents)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document_endpoint(document_id: str, db: JsonDatabase = Depends(get_db)):
    """Get a document by ID"""
    document = await get_document_by_id(document_id, db)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"document": document}


@router.patch("/{document_id}", response_model=DocumentResponse)
async def update_document_endpoint(
    document_id: str, 
    updates: DocumentUpdate = Body(...), 
    db: JsonDatabase = Depends(get_db)
):
    """Update a document"""
    updated_doc = await update_document(document_id, updates, db)
    if not updated_doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"message": "Document updated successfully", "document": updated_doc}


@router.delete("/{document_id}", response_model=dict)
async def delete_document_endpoint(document_id: str, db: JsonDatabase = Depends(get_db)):
    """Delete a document"""
    success = await delete_document(document_id, db)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"message": "Document deleted successfully"}


@router.post("/{document_id}/embed", response_model=dict)
async def generate_embedding_endpoint(document_id: str, db: JsonDatabase = Depends(get_db)):
    """Generate embeddings for a document"""
    success = await generate_embedding(document_id, db)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"message": "Embeddings generation started successfully"}


@router.post("/{document_id}/analyze", response_model=DocumentAnalysisResponse)
async def analyze_document_endpoint(document_id: str, db: JsonDatabase = Depends(get_db)):
    """Analyze a document and return statistics"""
    # Check if document exists
    document = await get_document_by_id(document_id, db)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get document content
    content = document.content
    
    # Check if content is binary (indicated by the content string)
    is_binary = False
    if content and content.startswith("Binary file content"):
        is_binary = True
        # For binary files, provide limited analysis
        word_count = 0
        reading_time = 0
        key_phrases = ["binary", "file", "document", document.file_type or "unknown"]
        summary = f"This is a binary file of type {document.file_type or 'unknown'}"
        key_points = ["This is a binary file and cannot be analyzed for text content."]
        entities = {"file_type": [document.file_type or "unknown"]}
        sentiment = "neutral"
        topics = ["binary", "file", document.file_type or "unknown"]
    else:
        # Text content analysis
        try:
            # Word count analysis
            word_count = len(content.split()) if content else 0
            
            # Estimate reading time (average reading speed: 200 words per minute)
            reading_time = max(1, round(word_count / 200))
            
            # Extract key phrases (improved implementation)
            words = content.lower().split() if content else []
            word_freq = {}
            for word in words:
                # Clean the word
                word = ''.join(c for c in word if c.isalnum())
                if len(word) > 3:  # Only consider words longer than 3 characters
                    word_freq[word] = word_freq.get(word, 0) + 1
            
            # Get top 5 words as key phrases
            key_phrases = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:5]
            key_phrases = [word for word, _ in key_phrases]
            
            # Generate a better summary (first 200 characters)
            summary = content[:200] + "..." if content and len(content) > 200 else content
            
            # Extract key points (first 3 sentences)
            sentences = content.split('.') if content else []
            key_points = [s.strip() + '.' for s in sentences[:3] if s.strip()]
            
            # Simple entity extraction (look for capitalized words that might be names)
            entity_candidates = []
            for word in content.split():
                word = word.strip()
                if word and word[0].isupper() and len(word) > 1:
                    entity_candidates.append(word)
            
            # Group entities by first letter (simple categorization)
            entities = {}
            if entity_candidates:
                entities["names"] = entity_candidates[:10]  # Limit to first 10
            
            # Very simple sentiment analysis
            positive_words = ["good", "great", "excellent", "positive", "happy", "best"]
            negative_words = ["bad", "poor", "negative", "worst", "terrible", "sad"]
            
            content_lower = content.lower() if content else ""
            positive_count = sum(1 for word in positive_words if word in content_lower)
            negative_count = sum(1 for word in negative_words if word in content_lower)
            
            if positive_count > negative_count:
                sentiment = "positive"
            elif negative_count > positive_count:
                sentiment = "negative"
            else:
                sentiment = "neutral"
            
            # Topics are just the key phrases for now
            topics = key_phrases[:3] if key_phrases else []
        
        except Exception as e:
            logger.error(f"Error analyzing document: {str(e)}")
            # Provide default values in case of analysis failure
            word_count = 0
            reading_time = 0
            key_phrases = []
            summary = "Error analyzing document content"
            key_points = []
            entities = {}
            sentiment = "neutral"
            topics = []
    
    # Return the analysis results
    return DocumentAnalysisResponse(
        word_count=word_count,
        reading_time=reading_time,
        key_phrases=key_phrases,
        summary=summary,
        document_id=document_id,
        message="Document analysis completed successfully",
        key_points=key_points,
        entities=entities,
        sentiment=sentiment,
        topics=topics
    )


@router.post("/batch-upload", response_model=List[dict])
async def batch_upload_endpoint(
    files: List[UploadFile] = File(...),
    dataset_id: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    db: JsonDatabase = Depends(get_db)
):
    """Upload multiple documents"""
    try:
        # Parse tags
        tag_ids = tags.split(",") if tags and tags.strip() else []
        
        logger.info(f"Batch upload request received: {len(files)} files, dataset_id={dataset_id}, tags={tag_ids}")
        
        results = []
        for file in files:
            try:
                logger.info(f"Processing file: {file.filename}, content_type: {file.content_type}")
                
                # Read file content
                content = await file.read()
                logger.info(f"File {file.filename} read successfully, size: {len(content)} bytes")
                
                # Determine if this is a binary file or text file
                is_binary = False
                content_type = file.content_type or ""
                
                # Extended list of binary content types
                binary_content_types = [
                    'application/pdf', 
                    'application/msword', 
                    'application/vnd.openxmlformats',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/zip',
                    'application/x-zip-compressed',
                    'application/octet-stream'
                ]
                
                # Get file extension
                file_extension = ""
                if "." in file.filename:
                    file_extension = file.filename.split(".")[-1].lower()
                    logger.info(f"File extension detected: {file_extension}")
                
                # Check if content type is in binary list
                if any(content_type.startswith(binary_type) for binary_type in binary_content_types):
                    is_binary = True
                    logger.info(f"File {file.filename} identified as binary based on content type")
                
                # Special handling for CSV files
                if file_extension == "csv":
                    logger.info(f"CSV file detected: {file.filename}")
                    # For CSV files, we'll use our specialized CSV processor
                    from ..services.documents.processors import _extract_from_csv
                    from ..schemas.document import DocumentMetadata
                    
                    # Create a basic metadata object
                    metadata = DocumentMetadata(
                        file_size=len(content),
                        title=os.path.splitext(file.filename)[0],
                        file_type=f".{file_extension}"
                    )
                    
                    # Use BytesIO to create a file-like object
                    file_like = io.BytesIO(content)
                    file_like.seek(0)
                    
                    # Extract text using our CSV processor
                    content_str, metadata = _extract_from_csv(file_like, metadata)
                    logger.info(f"CSV processing complete for {file.filename}")
                    
                # For text files, try to decode content
                elif not is_binary:
                    try:
                        content_str = content.decode("utf-8")
                        logger.info(f"File {file.filename} decoded as UTF-8")
                    except UnicodeDecodeError:
                        try:
                            content_str = content.decode("latin-1")
                            logger.info(f"File {file.filename} decoded as Latin-1")
                        except:
                            # If decoding fails, treat as binary
                            content_str = f"Binary file content ({len(content)} bytes)"
                            is_binary = True
                            logger.info(f"File {file.filename} decoding failed, treating as binary")
                else:
                    # For binary files, just note the size
                    content_str = f"Binary file content ({len(content)} bytes)"
                
                # Create document
                doc = DocumentCreate(
                    title=file.filename,
                    content=content_str,
                    dataset_id=dataset_id,
                    tag_ids=tag_ids,
                    metadata={
                        "file_name": file.filename,
                        "file_type": file.content_type or f".{file_extension}",
                        "file_size": len(content),
                        "is_binary": is_binary,
                        "file_extension": file_extension
                    }
                )
                
                logger.info(f"Creating document for {file.filename}")
                created_doc = await create_document(doc, db)
                logger.info(f"Document created successfully with ID: {created_doc.id}")
                
                # Update dataset document count if dataset_id is provided
                if dataset_id:
                    from ..services.dataset_service import increment_document_count
                    await increment_document_count(dataset_id, db)
                
                # Update tag document counts
                if tag_ids:
                    from ..services.tag_service import increment_document_count
                    for tag_id in tag_ids:
                        await increment_document_count(tag_id, db)
                
                results.append({
                    "filename": file.filename,
                    "document_id": created_doc.id,
                    "success": True
                })
            except Exception as e:
                logger.error(f"Error uploading file {file.filename}: {str(e)}")
                # Include traceback for better debugging
                import traceback
                logger.error(traceback.format_exc())
                results.append({
                    "filename": file.filename,
                    "error": str(e),
                    "success": False
                })
        
        logger.info(f"Batch upload complete. Results: {len(results)} files processed")
        return results
    except Exception as e:
        logger.error(f"Batch upload error: {str(e)}")
        # Include traceback for better debugging
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# Dataset endpoints

@router.post("/datasets", response_model=Dataset)
async def create_dataset(dataset: DatasetCreate):
    """
    Create a new dataset
    
    Args:
        dataset: Dataset creation data
        
    Returns:
        Created dataset information
    """
    try:
        return document_service.create_dataset(dataset)
    except Exception as e:
        logger.error(f"Error creating dataset: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/datasets", response_model=DatasetListResponse)
async def get_datasets():
    """
    Get all datasets
    
    Returns:
        List of dataset information
    """
    try:
        datasets = document_service.get_all_datasets()
        return DatasetListResponse(datasets=datasets, count=len(datasets))
    except Exception as e:
        logger.error(f"Error retrieving datasets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/datasets/{dataset_id}", response_model=Dataset)
async def get_dataset(dataset_id: str):
    """
    Get a dataset by ID
    
    Args:
        dataset_id: Dataset ID
        
    Returns:
        Dataset information
    """
    dataset = document_service.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    return dataset


@router.patch("/datasets/{dataset_id}", response_model=Dataset)
async def update_dataset(dataset_id: str, updates: Dict[str, Any]):
    """
    Update a dataset
    
    Args:
        dataset_id: Dataset ID
        updates: Dictionary of updates
        
    Returns:
        Updated dataset information
    """
    updated_dataset = document_service.update_dataset(dataset_id, updates)
    if not updated_dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    return updated_dataset


@router.delete("/datasets/{dataset_id}", response_model=bool)
async def delete_dataset(dataset_id: str):
    """
    Delete a dataset by ID
    
    Args:
        dataset_id: Dataset ID
        
    Returns:
        Status of the delete operation
    """
    success = document_service.delete_dataset(dataset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    return success


# Tag endpoints

@router.post("/tags", response_model=DocumentTag)
async def create_tag(tag: DocumentTagCreate):
    """
    Create a new tag
    
    Args:
        tag: Tag creation data
        
    Returns:
        Created tag information
    """
    try:
        return document_service.create_tag(tag)
    except Exception as e:
        logger.error(f"Error creating tag: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tags", response_model=TagListResponse)
async def get_tags():
    """
    Get all tags
    
    Returns:
        List of tag information
    """
    try:
        tags = document_service.get_all_tags()
        return TagListResponse(tags=tags, count=len(tags))
    except Exception as e:
        logger.error(f"Error retrieving tags: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tags/{tag_id}", response_model=DocumentTag)
async def get_tag(tag_id: str):
    """
    Get a tag by ID
    
    Args:
        tag_id: Tag ID
        
    Returns:
        Tag information
    """
    tag = document_service.get_tag(tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    return tag


@router.patch("/tags/{tag_id}", response_model=DocumentTag)
async def update_tag(tag_id: str, updates: Dict[str, Any]):
    """
    Update a tag
    
    Args:
        tag_id: Tag ID
        updates: Dictionary of updates
        
    Returns:
        Updated tag information
    """
    updated_tag = document_service.update_tag(tag_id, updates)
    if not updated_tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    return updated_tag


@router.delete("/tags/{tag_id}", response_model=bool)
async def delete_tag(tag_id: str):
    """
    Delete a tag by ID
    
    Args:
        tag_id: Tag ID
        
    Returns:
        Status of the delete operation
    """
    success = document_service.delete_tag(tag_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    return success


@router.get("/uploads/", response_model=Dict[str, Any])
async def get_uploads_documents():
    """
    Get documents from the uploads directory
    
    Returns:
        Dictionary of document information
    """
    try:
        # Path to uploads index file
        uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
        index_file = os.path.join(uploads_dir, "index.json")
        
        # Log the path for debugging
        logger.info(f"Looking for uploads index at: {index_file}")
        
        # Check if the file exists
        if not os.path.exists(index_file):
            logger.warning(f"Uploads index file not found at: {index_file}")
            return {"documents": {}}
        
        # Read the index file
        with open(index_file, 'r') as f:
            uploads_index = json.load(f)
            logger.info(f"Found {len(uploads_index.get('documents', {}))} documents in uploads index")
        
        return uploads_index
    except Exception as e:
        logger.error(f"Error getting uploads documents: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting uploads documents: {str(e)}") 