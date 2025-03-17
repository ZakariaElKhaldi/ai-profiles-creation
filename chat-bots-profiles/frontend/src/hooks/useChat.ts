import { useState } from 'react';
import { Message, ChatRequest, sendChatRequest } from '../services/chatService';

interface UseChatOptions {
  initialMessages?: Message[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  useDocumentContext?: boolean;
  sessionId?: string;
}

export const useChat = (options: UseChatOptions = {}) => {
  const {
    initialMessages = [],
    model = 'openai/gpt-3.5-turbo',
    temperature = 0.7,
    maxTokens = 500,
    useDocumentContext = false,
    sessionId = '',
  } = options;

  const [messages, setMessages] = useState<Message[]>(
    initialMessages.length > 0 
      ? initialMessages 
      : [{ role: 'assistant', content: 'Hello! How can I help you today?' }]
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);

  const sendMessage = async (content: string) => {
    const userMessage: Message = { role: 'user', content };
    
    // Add user message to state
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // Reset error state
    setError(null);
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Prepare request
      const chatRequest: ChatRequest = {
        messages: [...messages, userMessage],
        model,
        temperature,
        max_tokens: maxTokens,
        use_document_context: useDocumentContext,
        session_id: sessionId,
      };
      
      // Send request to API
      const response = await sendChatRequest(chatRequest);
      
      // Store last response
      setLastResponse(response);
      
      // Add assistant response to messages
      setMessages(prevMessages => [...prevMessages, response.message]);
      
      return response;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([
      { role: 'assistant', content: 'Hello! How can I help you today?' }
    ]);
    setError(null);
  };

  // Allows setting custom system message
  const setSystemMessage = (content: string) => {
    const systemMessage: Message = { role: 'system', content };
    
    // Check if there's already a system message
    const hasSystemMessage = messages.some(msg => msg.role === 'system');
    
    if (hasSystemMessage) {
      // Replace existing system message
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.role === 'system' ? systemMessage : msg
        )
      );
    } else {
      // Add system message at the beginning
      setMessages(prevMessages => [systemMessage, ...prevMessages]);
    }
  };

  return {
    messages,
    isLoading,
    error,
    lastResponse,
    sendMessage,
    clearMessages,
    setSystemMessage,
  };
}; 