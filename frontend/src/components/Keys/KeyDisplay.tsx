import React, { useState } from 'react';

interface KeyDisplayProps {
  apiKey: string;
}

const KeyDisplay: React.FC<KeyDisplayProps> = ({ apiKey }) => {
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(apiKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const maskKey = (key: string): string => {
    const firstPart = key.substring(0, 5);
    const lastPart = key.substring(key.length - 5);
    return `${firstPart}...${lastPart}`;
  };

  return (
    <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
      <p className="text-sm text-gray-700 mb-3">
        Your API key has been generated. Store it securely - it will only be shown once.
      </p>
      
      <div className="flex items-center mb-4">
        <div className="bg-gray-100 border border-gray-300 py-2 px-3 rounded-l-md font-mono text-sm flex-grow overflow-x-auto">
          {showKey ? apiKey : maskKey(apiKey)}
        </div>
        <button
          onClick={() => setShowKey(!showKey)}
          className="py-2 px-3 border border-l-0 border-gray-300 bg-white hover:bg-gray-50"
          aria-label={showKey ? 'Hide API key' : 'Show API key'}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor" 
            className="w-5 h-5"
          >
            {showKey ? (
              <>
                <path 
                  fillRule="evenodd" 
                  d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" 
                  clipRule="evenodd" 
                />
                <path 
                  d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" 
                />
              </>
            ) : (
              <>
                <path 
                  d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" 
                />
                <path 
                  fillRule="evenodd" 
                  d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.392.147.798 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" 
                  clipRule="evenodd" 
                />
              </>
            )}
          </svg>
        </button>
        <button
          onClick={handleCopyClick}
          className="py-2 px-3 border border-l-0 border-gray-300 rounded-r-md bg-white hover:bg-gray-50"
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor" 
              className="w-5 h-5 text-green-600"
            >
              <path 
                fillRule="evenodd" 
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" 
                clipRule="evenodd" 
              />
            </svg>
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor" 
              className="w-5 h-5"
            >
              <path 
                d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" 
              />
              <path 
                d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" 
              />
            </svg>
          )}
        </button>
      </div>
      
      <div className="text-xs text-gray-500">
        <p className="mb-1">
          <strong>Usage:</strong> Include this key in your API requests:
        </p>
        <code className="block bg-gray-100 p-2 rounded font-mono overflow-x-auto">
          Authorization: Bearer {showKey ? apiKey : maskKey(apiKey)}
        </code>
      </div>
    </div>
  );
};

export default KeyDisplay; 