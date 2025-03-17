from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class Message(BaseModel):
    """Chat message model with role and content"""
    role: str
    content: str


class ChatRequest(BaseModel):
    """Request model for chat API"""
    messages: List[Message]
    max_tokens: Optional[int] = 500
    temperature: Optional[float] = 0.7
    user_id: Optional[str] = "anonymous"
    model: Optional[str] = None
    use_document_context: Optional[bool] = False
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Response model for chat API"""
    message: Message
    usage: Optional[dict] = None
    response_time: Optional[float] = None
    model_used: Optional[str] = None
    token_count: Optional[int] = None


class ModelComparison(BaseModel):
    """Model for comparing responses from two different AI models"""
    model_a: str
    model_b: str
    query: str
    result_a: Dict[str, Any]
    result_b: Dict[str, Any]
    metrics: Dict[str, Any] 