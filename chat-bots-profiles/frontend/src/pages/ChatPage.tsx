import React from 'react';
import ChatInterface from '../components/chatbot/ChatInterface';

const ChatPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Chat</h1>
        <p className="text-zinc-400 mt-1">
          Test AI models and chat with the assistant
        </p>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
};

export default ChatPage; 