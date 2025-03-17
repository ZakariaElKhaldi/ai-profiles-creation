from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from typing import List, Dict, Any, Optional
import httpx
import time
import json
import os
from dotenv import load_dotenv

from app.schemas.chat import ChatRequest, ChatResponse, Message, ModelComparison
from app.models import get_model_details, DEFAULT_MODEL
from app.utils import DocumentStore

# Load environment variables - ensure this happens for each module
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

# Get API key and check if it exists
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY environment variable is not set. Please check your .env file.")

router = APIRouter(tags=["chat"])

# Initialize document store
document_store = DocumentStore()

# Session metrics storage
session_metrics = {}


def _prepare_document_context(chunks: List[str], max_chunks: int = 5) -> str:
    """
    Prepare document context from chunks
    
    Args:
        chunks: List of document chunks
        max_chunks: Maximum number of chunks to include
        
    Returns:
        Formatted document context string
    """
    # Limit the number of chunks to avoid token limits
    if len(chunks) > max_chunks:
        chunks = chunks[:max_chunks]
    
    context = "\n\n".join([
        f"Document chunk {i+1}:\n{chunk}" 
        for i, chunk in enumerate(chunks)
    ])
    
    return f"The following is relevant context from documents. Please use this information to inform your response:\n\n{context}\n\n"


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, background_tasks: BackgroundTasks):
    """
    Process a chat request
    
    Args:
        request: Chat request with messages and parameters
        background_tasks: FastAPI background tasks
        
    Returns:
        Chat response with AI-generated message
    """
    start_time = time.time()
    
    # Use provided model or default
    model_id = request.model or DEFAULT_MODEL
    
    try:
        model_info = get_model_details(model_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    
    # Prepare messages
    messages = [{"role": m.role, "content": m.content} for m in request.messages]
    
    # Add document context if requested
    if request.use_document_context:
        # Get document chunks
        chunks = document_store.get_all_chunks()
        
        if chunks:
            context = _prepare_document_context(chunks)
            # Insert context as a system message before the user's first message
            system_msg = {"role": "system", "content": context}
            first_user_msg_idx = next((i for i, m in enumerate(messages) if m["role"] == "user"), None)
            
            if first_user_msg_idx is not None:
                messages.insert(first_user_msg_idx, system_msg)
            else:
                messages.insert(0, system_msg)
    
    # Prepare API request
    api_url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv('OPENROUTER_REFERER', 'http://localhost:5174'),
        "X-Title": "AI Chatbot Profiles",
        "User-Agent": "AI Chatbot Profiles Application"
    }
    
    # Adjust data based on model
    is_gemini = "gemini" in model_id.lower()
    
    data = {
        "model": model_id,
        "messages": messages,
        "max_tokens": request.max_tokens,
        "temperature": request.temperature,
        "user": request.user_id or "anonymous_user"
    }
    
    # For Gemini models, simplify the request
    if not is_gemini:
        data.update({
            "transforms": ["middle-out"],
            "route": "fallback",
            "prompt_tactic": "plain"
        })
    
    print(f"Sending request to OpenRouter with API key: {OPENROUTER_API_KEY[:10]}...")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(api_url, headers=headers, json=data, timeout=60.0)
            print(f"Response status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"Error response body: {response.text}")
                
            response.raise_for_status()
            result = response.json()
    except httpx.HTTPStatusError as e:
        error_detail = f"Error from OpenRouter API: {e.response.status_code}"
        try:
            error_json = e.response.json()
            if "error" in error_json:
                error_detail = f"{error_detail} - {error_json['error']}"
            print(f"HTTPStatusError: {error_detail}")
        except:
            print(f"Failed to parse error response: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=error_detail)
    except httpx.RequestError as e:
        print(f"RequestError: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Request error: {str(e)}")
    
    # Extract response
    try:
        assistant_message = result["choices"][0]["message"]
        usage = result.get("usage", {})
        
        # Calculate response time
        response_time = time.time() - start_time
        
        # Store metrics if session_id is provided
        if request.session_id:
            if request.session_id not in session_metrics:
                session_metrics[request.session_id] = []
            
            session_metrics[request.session_id].append({
                "timestamp": time.time(),
                "request_length": len(request.messages),
                "response_time": response_time,
                "model": model_id,
                "token_count": usage.get("total_tokens", 0)
            })
        
        # Prepare the response
        chat_response = ChatResponse(
            message=Message(
                role=assistant_message["role"],
                content=assistant_message["content"]
            ),
            usage=usage,
            response_time=response_time,
            model_used=model_id,
            token_count=usage.get("total_tokens", 0)
        )
        
        return chat_response
    except (KeyError, IndexError) as e:
        raise HTTPException(status_code=500, detail=f"Error parsing API response: {str(e)}")


@router.post("/compare_models", response_model=ModelComparison)
async def compare_models(
    model_a: str = Query(..., description="First model to compare"),
    model_b: str = Query(..., description="Second model to compare"),
    messages: List[Dict[str, str]] = None,
):
    """
    Compare responses from two different models
    
    Args:
        model_a: ID of the first model
        model_b: ID of the second model
        messages: List of messages for the chat
        
    Returns:
        Comparison of responses from both models
    """
    if not messages or not isinstance(messages, list):
        raise HTTPException(status_code=400, detail="Messages must be provided as a list")
    
    # Convert the messages to the expected format
    chat_request = ChatRequest(
        messages=[Message(role=msg.get("role", "user"), content=msg.get("content", "")) for msg in messages],
        model=model_a
    )
    
    # Get response from model A
    response_a = await chat(chat_request, BackgroundTasks())
    
    # Update request for model B
    chat_request.model = model_b
    
    # Get response from model B
    response_b = await chat(chat_request, BackgroundTasks())
    
    # Compile results
    result = ModelComparison(
        model_a=model_a,
        model_b=model_b,
        query=messages[-1].get("content", "") if messages else "",
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
        metrics={
            "response_time_diff": response_a.response_time - response_b.response_time if response_a.response_time and response_b.response_time else None,
            "token_count_diff": response_a.token_count - response_b.token_count if response_a.token_count and response_b.token_count else None,
            "length_diff": len(response_a.message.content) - len(response_b.message.content)
        }
    )
    
    return result


@router.get("/metrics", response_model=Dict[str, Any])
async def get_metrics(session_id: Optional[str] = None):
    """
    Get chat metrics for a session
    
    Args:
        session_id: Optional session ID to filter metrics
        
    Returns:
        Dictionary of chat metrics
    """
    if session_id:
        if session_id not in session_metrics:
            return {"metrics": [], "summary": {}}
        metrics = session_metrics[session_id]
    else:
        # Flatten all metrics
        metrics = [m for session in session_metrics.values() for m in session]
    
    if not metrics:
        return {"metrics": [], "summary": {}}
    
    # Calculate summary statistics
    avg_response_time = sum(m["response_time"] for m in metrics) / len(metrics)
    max_response_time = max(m["response_time"] for m in metrics)
    total_tokens = sum(m.get("token_count", 0) for m in metrics)
    
    return {
        "metrics": metrics,
        "summary": {
            "count": len(metrics),
            "avg_response_time": avg_response_time,
            "max_response_time": max_response_time,
            "total_tokens": total_tokens
        }
    } 