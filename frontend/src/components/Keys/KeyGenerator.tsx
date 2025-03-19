import React, { useState } from 'react';

interface KeyGeneratorProps {
  profileId: string;
  hasExistingKey: boolean;
  onKeyGenerated?: (key: string) => void;
}

const KeyGenerator: React.FC<KeyGeneratorProps> = ({ 
  profileId, 
  hasExistingKey, 
  onKeyGenerated 
}) => {
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const generateNewKey = async () => {
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call to generate a key
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock API key
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let key = 'apk_';
      for (let i = 0; i < 32; i++) {
        key += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      setGeneratedKey(key);
      if (onKeyGenerated) {
        onKeyGenerated(key);
      }
    } catch (err) {
      console.error('Error generating key:', err);
    } finally {
      setIsLoading(false);
      setShowConfirmReset(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setIsCopied(true);
      
      // Reset copied status after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
      <h3 className="text-xl font-semibold mb-4 text-gray-100">API Key</h3>
      
      <p className="text-sm text-gray-300 mb-4">
        Generate an API key to integrate this AI profile with your applications.
      </p>

      {generatedKey ? (
        <div className="space-y-4">
          <div className="flex items-center">
            <p className="text-sm text-gray-300 mr-2">Your API key:</p>
            <div className="bg-gray-900 py-2 px-3 rounded-md border border-gray-700 flex-grow flex justify-between items-center">
              <code className="font-mono text-xs text-gray-300 truncate">
                {generatedKey}
              </code>
              <button 
                onClick={copyToClipboard}
                className="ml-2 text-blue-400 hover:text-blue-300"
              >
                {isCopied ? (
                  <span className="text-green-400 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </span>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <div className="bg-blue-900 bg-opacity-30 text-blue-300 p-4 rounded-md border border-blue-800 text-sm">
            <p className="font-medium mb-1">Important:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Save this key as it won't be shown again</li>
              <li>This key grants full access to this AI profile</li>
              <li>If compromised, reset the key immediately</li>
            </ul>
          </div>
          
          <div className="flex justify-end">
            {showConfirmReset ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-red-400">Are you sure?</span>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={generateNewKey}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Reset Key
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Reset Key
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-400">
            {hasExistingKey 
              ? 'Your existing API key is active' 
              : 'No API key has been generated yet'}
          </p>
          <button
            onClick={generateNewKey}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              hasExistingKey ? 'Regenerate Key' : 'Generate API Key'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default KeyGenerator; 