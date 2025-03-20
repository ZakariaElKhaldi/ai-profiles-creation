import React, { useState, useEffect } from 'react';
import { profileService, APIKey, APIKeyCreate } from '../../services/api/profiles';

interface KeyGeneratorProps {
  profileId: string;
  onKeyGenerated?: (key: string) => void;
}

const KeyGenerator: React.FC<KeyGeneratorProps> = ({ 
  profileId, 
  onKeyGenerated 
}) => {
  const [generatedKey, setGeneratedKey] = useState<APIKey | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load existing keys on component mount
  useEffect(() => {
    const loadKeys = async () => {
      try {
        setIsLoading(true);
        const response = await profileService.getAPIKeys(profileId);
        setKeys(response.keys);
      } catch (err) {
        console.error('Error loading API keys:', err);
        setError('Failed to load API keys');
      } finally {
        setIsLoading(false);
      }
    };

    loadKeys();
  }, [profileId]);

  const generateNewKey = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const keyName = `Key for profile ${profileId}`;
      const keyData: APIKeyCreate = {
        name: keyName,
        description: `API access key for external integration (generated ${new Date().toLocaleString()})`,
        profile_id: profileId
      };
      
      const newKey = await profileService.createAPIKey(profileId, keyData);
      setGeneratedKey(newKey);
      setKeys([...keys, newKey]);
      
      if (onKeyGenerated) {
        onKeyGenerated(newKey.key);
      }
    } catch (err) {
      console.error('Error generating key:', err);
      setError('Failed to generate API key');
    } finally {
      setIsLoading(false);
      setShowConfirmReset(false);
    }
  };

  const deleteKey = async (keyId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await profileService.deleteAPIKey(profileId, keyId);
      setKeys(keys.filter(k => k.id !== keyId));
      
      if (generatedKey && generatedKey.id === keyId) {
        setGeneratedKey(null);
      }
    } catch (err) {
      console.error('Error deleting key:', err);
      setError('Failed to delete API key');
    } finally {
      setIsLoading(false);
      setShowConfirmReset(false);
    }
  };

  const copyToClipboard = (keyValue: string) => {
    navigator.clipboard.writeText(keyValue);
    setIsCopied(true);
    
    // Reset copied status after 2 seconds
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
      <h3 className="text-xl font-semibold mb-4 text-gray-100">API Key Management</h3>
      
      <p className="text-sm text-gray-300 mb-4">
        Generate an API key to integrate this AI profile with your applications.
      </p>

      {error && (
        <div className="bg-red-900 bg-opacity-30 text-red-300 p-4 rounded-md border border-red-800 text-sm mb-4">
          {error}
        </div>
      )}

      {generatedKey ? (
        <div className="space-y-4">
          <div className="flex items-center">
            <p className="text-sm text-gray-300 mr-2">Your API key:</p>
            <div className="bg-gray-900 py-2 px-3 rounded-md border border-gray-700 flex-grow flex justify-between items-center">
              <code className="font-mono text-xs text-gray-300 truncate">
                {generatedKey.key}
              </code>
              <button 
                onClick={() => copyToClipboard(generatedKey.key)}
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
              <li>Save this key as it won't be shown again in this format</li>
              <li>This key grants full access to this AI profile</li>
              <li>If compromised, delete the key immediately</li>
            </ul>
          </div>
        </div>
      ) : null}

      {/* Existing Keys List */}
      {keys.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium mb-2 text-gray-200">Existing Keys</h4>
          <div className="divide-y divide-gray-700">
            {keys.map(key => (
              <div key={key.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-300">{key.name}</p>
                  <p className="text-xs text-gray-400">
                    Created: {new Date(key.created_at).toLocaleString()}
                  </p>
                  {key.last_used && (
                    <p className="text-xs text-gray-400">
                      Last used: {new Date(key.last_used).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => deleteKey(key.id)}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-6 flex justify-end">
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
              Processing...
            </span>
          ) : (
            'Generate New API Key'
          )}
        </button>
      </div>
    </div>
  );
};

export default KeyGenerator; 