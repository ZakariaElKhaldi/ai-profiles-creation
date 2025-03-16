from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class Message(BaseModel):
    """
    Model for a chat message
    """
    role: str = Field(..., description="Role of the message sender (system, user, assistant)")
    content: str = Field(..., description="Content of the message")

class ChatRequest(BaseModel):
    """
    Model for a chat request
    """
    messages: List[Message] = Field(..., description="List of messages in the conversation")
    user_id: str = Field("anonymous", description="ID of the user")
    user_role: Optional[str] = Field(None, description="Role of the user in the school system")
    
    class Config:
        schema_extra = {
            "example": {
                "messages": [
                    {"role": "user", "content": "What classes do I have today?"}
                ],
                "user_id": "user123",
                "user_role": "student"
            }
        }

class ChatResponse(BaseModel):
    """
    Model for a chat response
    """
    message: Message = Field(..., description="Generated assistant message")
    
    class Config:
        schema_extra = {
            "example": {
                "message": {
                    "role": "assistant",
                    "content": "You have Mathematics at 9:00 AM and Physics at 2:00 PM today."
                }
            }
        }

class SchoolInfoRequest(BaseModel):
    """
    Model for a school information request
    """
    query: str = Field(..., description="The query about school information")
    user_id: str = Field("anonymous", description="ID of the user")
    user_role: Optional[str] = Field(None, description="Role of the user in the school system")
    
    class Config:
        schema_extra = {
            "example": {
                "query": "When is the next school holiday?",
                "user_id": "user123",
                "user_role": "parent"
            }
        } 