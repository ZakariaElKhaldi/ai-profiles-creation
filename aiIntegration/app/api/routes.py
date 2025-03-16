from fastapi import APIRouter, Depends, HTTPException
from app.models.conversation import ChatRequest, ChatResponse, SchoolInfoRequest, Message
from app.services.chatbot import SchoolChatbotService

router = APIRouter()
chatbot_service = SchoolChatbotService()

@router.post("/chat", response_model=ChatResponse, tags=["chatbot"])
async def chat(request: ChatRequest):
    """
    Process a chat request and return a response
    """
    try:
        messages = [msg.dict() for msg in request.messages]
        
        response = await chatbot_service.get_response(
            messages=messages,
            user_id=request.user_id,
            user_role=request.user_role
        )
        
        return ChatResponse(message=Message(**response))
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat request: {str(e)}")

@router.post("/school-info", tags=["chatbot"])
async def get_school_info(request: SchoolInfoRequest):
    """
    Get specific school information based on a query
    """
    try:
        response = await chatbot_service.get_school_info(
            query=request.query,
            user_id=request.user_id,
            user_role=request.user_role
        )
        
        return {"message": Message(**response)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting school information: {str(e)}")

@router.get("/health", tags=["system"])
async def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy", "service": "school-chatbot"} 