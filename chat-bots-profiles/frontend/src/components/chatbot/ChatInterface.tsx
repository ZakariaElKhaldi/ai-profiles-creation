import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import { useChat } from '../../hooks/useChat';
import { useApp } from '../../context/AppContext';

const ChatInterface: React.FC = () => {
  const { selectedModel, useDocumentContext, sessionId } = useApp();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const chatOptions = {
    model: selectedModel,
    useDocumentContext,
    sessionId,
  };
  
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  } = useChat(chatOptions);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Clear input field immediately for better UX
    const message = input;
    setInput('');
    
    // Send message to API
    await sendMessage(message);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-800 rounded-lg border border-zinc-800">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-900/50 border border-red-800 text-red-200 p-3 my-4 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Input form */}
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // Send on Enter (without Shift)
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Type your message..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white resize-none overflow-hidden"
              rows={1}
              style={{ 
                minHeight: '44px',
                maxHeight: '200px',
                height: 'auto'
              }}
              disabled={isLoading}
            />
            
            {isLoading && (
              <div className="absolute right-3 bottom-3 text-zinc-500 animate-pulse">
                <svg 
                  className="w-5 h-5" 
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white p-3 rounded-lg transition-colors"
          >
            Send
          </button>
        </div>
        
        <div className="mt-2 text-xs text-zinc-500 flex justify-between">
          <span>
            {useDocumentContext && (
              <span className="text-blue-400">Using document context • </span>
            )}
            Model: {selectedModel}
          </span>
          
          <button
            type="button"
            onClick={clearMessages}
            className="text-zinc-500 hover:text-white"
          >
            Clear chat
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface; 