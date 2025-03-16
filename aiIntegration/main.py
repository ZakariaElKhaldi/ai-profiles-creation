from fastapi import FastAPI, HTTPException, File, Form, Depends, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
import os
import httpx
import time
import json
from dotenv import load_dotenv
from app.models import (
    get_model_categories, 
    get_models_by_category, 
    get_model_details,
    fetch_openrouter_models,
    get_available_model_ids,
    refresh_models,
    DEFAULT_MODEL
)
from app.utils import DocumentProcessor, DocumentStore

# Load environment variables
load_dotenv()

app = FastAPI(title="School Management AI Assistant")

# Add CORS middleware to allow requests from the Streamlit frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Models
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    max_tokens: Optional[int] = 500
    temperature: Optional[float] = 0.7
    user_id: Optional[str] = "anonymous"
    model: Optional[str] = None
    use_document_context: Optional[bool] = False
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    message: Message
    usage: Optional[dict] = None
    response_time: Optional[float] = None
    model_used: Optional[str] = None
    token_count: Optional[int] = None

class DocumentInfo(BaseModel):
    id: str
    filename: str
    timestamp: int
    chunk_count: int

class ModelComparison(BaseModel):
    model_a: str
    model_b: str
    query: str
    result_a: Dict[str, Any]
    result_b: Dict[str, Any]
    metrics: Dict[str, Any]

# Initialize document processor and store
document_processor = DocumentProcessor()
document_store = DocumentStore()

# OpenRouter API configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Session metrics storage
session_metrics = {}

@app.get("/")
def read_root():
    return {"message": "Welcome to the School Management AI Assistant API"}

# Add model selection endpoints
@app.get("/api/models", response_model=Dict[str, Dict[str, Any]])
async def get_models():
    """Get all available models"""
    return fetch_openrouter_models()

@app.get("/api/models/categories", response_model=List[str])
async def get_categories():
    """Get all model categories"""
    return get_model_categories()

@app.get("/api/models/category/{category}", response_model=Dict[str, Dict[str, Any]])
async def get_models_in_category(category: str):
    """Get models in a specific category"""
    return get_models_by_category(category)

@app.get("/api/models/{model_id}", response_model=Dict[str, Any])
async def get_model(model_id: str):
    """Get details for a specific model"""
    model_data = get_model_details(model_id)
    if not model_data:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    return model_data

@app.get("/api/models/refresh", response_model=Dict[str, Dict[str, Any]])
async def refresh_model_data():
    """Force refresh model data from API"""
    return refresh_models()

def _prepare_document_context(chunks: List[str], max_chunks: int = 5) -> str:
    """Prepare document context from chunks
    
    Args:
        chunks: List of document chunks
        max_chunks: Maximum number of chunks to include
        
    Returns:
        Formatted document context string
    """
    if not chunks:
        return ""
    
    # If we have fewer chunks than max_chunks, use all of them
    if len(chunks) <= max_chunks:
        formatted_chunks = chunks
    else:
        # Otherwise, take a selection of chunks
        # We take the first chunk to provide an introduction
        # and then a sampling of the remaining chunks
        step = (len(chunks) - 1) // (max_chunks - 1)
        indices = [0] + [i for i in range(1, len(chunks), step)][:max_chunks-1]
        formatted_chunks = [chunks[i] for i in indices]
    
    # Format chunks with numbering and delimiter
    formatted_text = ""
    for i, chunk in enumerate(formatted_chunks):
        formatted_text += f"Document Section {i+1}:\n{chunk}\n\n---\n\n"
    
    return formatted_text

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, background_tasks: BackgroundTasks):
    """
    Send a chat request to the OpenRouter API and return the response.
    """
    start_time = time.time()
    
    # Check if API key is set
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured")
    
    # Use the specified model or fall back to the default
    model = request.model if hasattr(request, 'model') and request.model else DEFAULT_MODEL
    
    # Get document context if requested
    system_message = None
    if request.use_document_context:
        chunks = document_store.get_all_document_chunks()
        if chunks:
            context = _prepare_document_context(chunks)
            system_message = {
                "role": "system", 
                "content": (
                    "You are an assistant with access to the following document sections. "
                    "Answer the user's questions based only on the information provided in these documents. "
                    "If the information needed to answer is not in the documents, state clearly that you "
                    "don't have that information in the provided documents rather than making up an answer.\n\n"
                    "When referencing information, mention which document section it came from.\n\n"
                    f"Here are the document sections:\n\n{context}"
                )
            }
        else:
            # Even if use_document_context is true but no documents are available,
            # add a system message to inform the user
            system_message = {
                "role": "system",
                "content": (
                    "You are a helpful assistant. Note that the system is configured to use document "
                    "context, but no documents have been uploaded yet. You can only answer based on "
                    "your general knowledge until documents are provided."
                )
            }
    
    # Prepare messages with system message if available
    messages = []
    if system_message:
        messages.append(system_message)
    messages.extend([{"role": msg.role, "content": msg.content} for msg in request.messages])
    
    # Prepare the request payload
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": request.max_tokens,
        "temperature": request.temperature,
        "user": request.user_id
    }
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://school-management-assistant.com"  # Replace with your actual domain
    }
    
    try:
        # Make the request to OpenRouter
        async with httpx.AsyncClient() as client:
            response = await client.post(
                OPENROUTER_URL,
                json=payload,
                headers=headers,
                timeout=30.0
            )
            
            # Check if the request was successful
            response.raise_for_status()
            response_data = response.json()
            
            # Extract the response message
            if "choices" in response_data and len(response_data["choices"]) > 0:
                message_data = response_data["choices"][0]["message"]
                message = Message(role=message_data["role"], content=message_data["content"])
                
                # Calculate response time
                response_time = time.time() - start_time
                
                # Get token usage
                token_count = response_data.get("usage", {}).get("total_tokens", 0)
                
                # Store metrics for this session if session_id is provided
                if request.session_id:
                    if request.session_id not in session_metrics:
                        session_metrics[request.session_id] = []
                    
                    session_metrics[request.session_id].append({
                        "timestamp": time.time(),
                        "model": model,
                        "response_time": response_time,
                        "tokens": token_count,
                        "request_size": len(str(request.messages)),
                        "response_size": len(message.content)
                    })
                
                # Return the response
                return ChatResponse(
                    message=message,
                    usage=response_data.get("usage"),
                    response_time=response_time,
                    model_used=model,
                    token_count=token_count
                )
            else:
                raise HTTPException(status_code=500, detail="Invalid response from language model")
                
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

# A/B Testing endpoint
@app.post("/api/compare_models", response_model=ModelComparison)
async def compare_models(
    model_a: str = Query(..., description="First model to compare"),
    model_b: str = Query(..., description="Second model to compare"),
    messages: List[Dict[str, str]] = None,
):
    """
    Compare responses from two different models for the same input
    """
    # Validate models exist
    models = fetch_openrouter_models()
    if model_a not in models:
        raise HTTPException(status_code=404, detail=f"Model {model_a} not found")
    if model_b not in models:
        raise HTTPException(status_code=404, detail=f"Model {model_b} not found")
    
    # Convert messages to Chat format
    chat_messages = [Message(**msg) for msg in messages]
    
    # Create requests for both models
    request_a = ChatRequest(
        messages=chat_messages,
        model=model_a,
        session_id="model_comparison"
    )
    
    request_b = ChatRequest(
        messages=chat_messages,
        model=model_b,
        session_id="model_comparison"
    )
    
    try:
        # Get responses from both models
        response_a = await chat(request_a, BackgroundTasks())
        response_b = await chat(request_b, BackgroundTasks())
        
        # Check if responses have content
        if not response_a.message.content.strip():
            print(f"Warning: Empty response from model {model_a}")
        if not response_b.message.content.strip():
            print(f"Warning: Empty response from model {model_b}")
        
        # Calculate comparison metrics
        # - Response time difference
        # - Token count difference
        # - Response length difference
        metrics = {
            "response_time_diff": response_b.response_time - response_a.response_time,
            "token_count_diff": response_b.token_count - response_a.token_count,
            "response_length_diff": len(response_b.message.content) - len(response_a.message.content),
        }
        
        # Return comparison results
        return ModelComparison(
            model_a=model_a,
            model_b=model_b,
            query=chat_messages[-1].content if chat_messages else "",
            result_a={
                "content": response_a.message.content,
                "response_time": response_a.response_time,
                "token_count": response_a.token_count
            },
            result_b={
                "content": response_b.message.content,
                "response_time": response_b.response_time,
                "token_count": response_b.token_count
            },
            metrics=metrics
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error comparing models: {str(e)}"
        )

# Document management endpoints
@app.post("/api/upload", response_model=Dict[str, str])
async def upload_file(file: bytes = File(...), filename: str = Form(...)):
    """
    Handle file uploads for knowledge augmentation
    """
    try:
        # Process the document
        chunks = document_processor.process_document(file, filename)
        
        # Store document chunks
        doc_id = document_store.add_document(filename, chunks)
            
        return {
            "message": f"File {filename} uploaded and processed successfully",
            "document_id": doc_id,
            "chunk_count": str(len(chunks))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")

@app.get("/api/documents", response_model=List[DocumentInfo])
async def get_documents():
    """Get all uploaded documents"""
    return document_store.get_document_metadata()

@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document"""
    success = document_store.remove_document(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")
    return {"message": f"Document {doc_id} deleted successfully"}

@app.get("/api/documents/{doc_id}", response_model=Dict[str, Any])
async def get_document_details(doc_id: str):
    """Get details for a specific document including chunks"""
    # Get metadata for the document
    metadata_list = document_store.get_document_metadata()
    
    # Find the document in the metadata
    doc_metadata = None
    for doc in metadata_list:
        if doc["id"] == doc_id:
            doc_metadata = doc
            break
    
    if not doc_metadata:
        raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")
    
    # Get chunks for the document
    chunks = document_store.get_document_chunks(doc_id)
    
    # Calculate document size (approximate)
    total_size = sum(len(chunk) for chunk in chunks)
    
    # Return document details
    return {
        "id": doc_metadata["id"],
        "filename": doc_metadata["filename"],
        "timestamp": doc_metadata["timestamp"],
        "chunk_count": doc_metadata["chunk_count"],
        "size": total_size,
        "chunks": chunks
    }

# Performance metrics endpoint
@app.get("/api/metrics", response_model=Dict[str, Any])
async def get_metrics(session_id: Optional[str] = None):
    """Get performance metrics"""
    if session_id and session_id in session_metrics:
        return {"metrics": session_metrics[session_id]}
    elif not session_id:
        # Return all metrics
        return {"metrics": session_metrics}
    else:
        return {"metrics": []}

# Add a health check endpoint
@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Handle favicon.ico requests to prevent 404 errors."""
    return Response(content="", media_type="image/x-icon") 