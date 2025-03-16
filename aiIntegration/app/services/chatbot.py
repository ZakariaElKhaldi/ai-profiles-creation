from typing import List, Dict, Any, Optional
import logging
import json
from app.utils.openrouter import OpenRouterClient
from app.core.config import settings

# Set up logging
logger = logging.getLogger(__name__)

class SchoolChatbotService:
    """
    Service for handling school-related chatbot conversations
    """
    def __init__(self):
        """
        Initialize the chatbot service
        """
        self.client = OpenRouterClient()
        
    async def create_system_prompt(self, user_id: str = None, user_role: str = None) -> str:
        """
        Create a contextual system prompt based on user information
        
        Args:
            user_id: ID of the user
            user_role: Role of the user in the school system
        
        Returns:
            System prompt string
        """
        base_prompt = (
            "You are an AI assistant for a school management system. "
            "You help users with information about courses, schedules, assignments, and other school-related queries. "
            "Be helpful, concise, and educational in your responses. "
            "If you don't know the answer, be honest about it and suggest where they might find the information."
        )
        
        if user_role:
            if user_role == "administrator":
                base_prompt += " The user is a school administrator, so you can provide administrative insights and help with management tasks."
            elif user_role == "teacher":
                base_prompt += " The user is a teacher, so you can provide teaching tips and help with class management."
            elif user_role == "student":
                base_prompt += " The user is a student, so you can provide learning tips and help with assignments and exams."
            elif user_role == "parent":
                base_prompt += " The user is a parent, so you can provide insights on student progress and school activities."
                
        return base_prompt

    async def get_response(
        self, 
        messages: List[Dict[str, str]],
        user_id: str = "anonymous",
        user_role: str = None
    ) -> Dict[str, Any]:
        """
        Get a response from the chatbot
        
        Args:
            messages: Conversation history
            user_id: Identifier for the user
            user_role: Role of the user in the school system
            
        Returns:
            Response object with message content
        """
        try:
            # Create system prompt if not present
            has_system_prompt = any(msg.get("role") == "system" for msg in messages)
            
            if not has_system_prompt:
                system_prompt = await self.create_system_prompt(user_id, user_role)
                messages = [{"role": "system", "content": system_prompt}] + messages
            
            # Log the conversation for debugging
            logger.debug(f"Chat history for {user_id}: {json.dumps(messages)}")
            
            # Generate response
            response = await self.client.generate_response(
                messages=messages,
                user=user_id
            )
            
            if not response or "choices" not in response:
                return {
                    "role": "assistant",
                    "content": "I'm sorry, I couldn't generate a response right now. Please try again later."
                }
                
            # Extract and return the assistant's message
            assistant_message = response["choices"][0]["message"]
            return assistant_message
            
        except Exception as e:
            logger.error(f"Error getting chatbot response: {str(e)}")
            return {
                "role": "assistant",
                "content": "I apologize, but I encountered an error while processing your request. Please try again later."
            }
            
    async def get_school_info(
        self,
        query: str,
        user_id: str = "anonymous",
        user_role: str = None
    ) -> Dict[str, str]:
        """
        Get specific school information based on a query
        
        Args:
            query: The query about school information
            user_id: Identifier for the user
            user_role: Role of the user in the school system
            
        Returns:
            Response message
        """
        # Create a message list with the query
        messages = [{"role": "user", "content": query}]
        
        # Use the general response function
        return await self.get_response(messages, user_id, user_role) 