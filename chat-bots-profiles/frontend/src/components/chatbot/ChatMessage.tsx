import React from 'react';
import { Message } from '../../services/chatService';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  // Simple renderer for standard messages
  // Could be enhanced with markdown, code highlighting, etc.
  const renderContent = (content: string) => {
    return (
      <div className="prose prose-invert max-w-none">
        {content.split('\n').map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < content.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`flex p-4 ${
        isUser ? 'bg-zinc-800' : 'bg-zinc-900'
      }`}
    >
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
          isUser ? 'bg-blue-600' : 'bg-purple-600'
        }`}
      >
        {isUser ? '👤' : '🤖'}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm mb-1">
          {isUser ? 'You' : message.role === 'system' ? 'System' : 'Assistant'}
        </div>
        <div className="text-zinc-300">{renderContent(message.content)}</div>
      </div>
      
      {/* Could add actions like copy, regenerate, etc. */}
      <div className="ml-2 opacity-0 hover:opacity-100 transition-opacity">
        <button
          className="text-zinc-500 hover:text-white p-1 rounded"
          onClick={() => navigator.clipboard.writeText(message.content)}
          title="Copy to clipboard"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatMessage; 