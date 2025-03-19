import React, { useState } from 'react';
import KeyDisplay from './KeyDisplay';

interface KeyGeneratorProps {
  profileId: string;
  hasExistingKey: boolean;
  onKeyGenerated: (key: string) => void;
}

const KeyGenerator: React.FC<KeyGeneratorProps> = ({ 
  profileId, 
  hasExistingKey,
  onKeyGenerated 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateClick = () => {
    if (hasExistingKey) {
      setShowConfirm(true);
    } else {
      generateKey();
    }
  };

  const generateKey = async () => {
    setIsGenerating(true);
    setError(null);
    setShowConfirm(false);
    
    try {
      // Simulate API call to generate key
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a mock API key
      const key = 'api_' + Array(32)
        .fill(0)
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join('');
      
      setGeneratedKey(key);
      onKeyGenerated(key);
      setIsGenerating(false);
    } catch (err) {
      setError('Failed to generate API key. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">API Key</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {hasExistingKey 
            ? 'This profile has an active API key. Generating a new key will invalidate the existing one.'
            : 'Generate an API key to query this profile programmatically.'}
        </p>
      </div>
      
      {generatedKey ? (
        <KeyDisplay apiKey={generatedKey} />
      ) : (
        <>
          {showConfirm ? (
            <div className="border border-yellow-400 bg-yellow-50 rounded-md p-4 mb-4">
              <p className="text-sm text-yellow-800 mb-3">
                Warning: Generating a new key will revoke the existing key. Any applications using the old key will stop working.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={generateKey}
                  className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Proceed Anyway
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end mt-4">
              <button
                onClick={handleGenerateClick}
                disabled={isGenerating}
                className={`py-2 px-4 rounded transition duration-200 ${
                  hasExistingKey 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isGenerating 
                  ? 'Generating...' 
                  : hasExistingKey 
                    ? 'Regenerate API Key' 
                    : 'Generate API Key'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default KeyGenerator; 