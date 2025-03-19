import React, { useState, useEffect } from 'react';
import { openRouterService } from '../../services/api/openrouter';

interface ApiKeySettingsProps {
  onSave: (key: string) => void;
}

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ onSave }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showKey, setShowKey] = useState<boolean>(false);

  // Load saved key from backend on component mount
  useEffect(() => {
    const loadActiveKey = async () => {
      try {
        const activeKeyInfo = await openRouterService.getActiveKey();
        if (activeKeyInfo.active && activeKeyInfo.key) {
          setSavedKey(activeKeyInfo.key);
          setApiKey(activeKeyInfo.key);
        }
      } catch (err) {
        console.error('Failed to load active key:', err);
      }
    };
    loadActiveKey();
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('API key cannot be empty');
      return;
    }

    // Validate API key format (basic validation for OpenRouter API key)
    if (!apiKey.startsWith('sk-') && !apiKey.startsWith('or-')) {
      setError('Invalid API key format. OpenRouter keys typically start with "sk-" or "or-"');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      // Add the key to the backend
      await openRouterService.addKey(apiKey);
      // Set it as the active key
      await openRouterService.setActiveKey(apiKey);
      
      // Update state
      setSavedKey(apiKey);
      setIsEditing(false);
      
      // Notify parent component
      onSave(apiKey);
    } catch (err: any) {
      setError(err.message || 'Failed to save API key. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    // Show first 4 and last 4 characters, mask the rest
    return `${key.substring(0, 4)}${'•'.repeat(Math.max(0, key.length - 8))}${key.substring(key.length - 4)}`;
  };

  const handleClear = async () => {
    try {
      if (savedKey) {
        await openRouterService.deleteKey(savedKey);
        setSavedKey(null);
        setApiKey('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove API key. Please try again.');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-100 mb-4">OpenRouter API Key</h2>
      
      <div className="mb-4">
        <p className="text-gray-300 mb-2">
          {savedKey 
            ? 'Your OpenRouter API key is saved securely.'
            : 'Enter your OpenRouter API key to access advanced AI features. Get your key from the OpenRouter dashboard.'}
        </p>
        
        {savedKey && !isEditing && (
          <div className="bg-gray-700 p-3 rounded-md flex items-center justify-between">
            <div className="font-mono text-gray-300">
              {showKey ? savedKey : maskApiKey(savedKey)}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowKey(!showKey)}
                className="text-gray-300 hover:text-gray-100"
                title={showKey ? "Hide API key" : "Show API key"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  {showKey ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  )}
                </svg>
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-400 hover:text-blue-300"
                title="Edit API key"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={handleClear}
                className="text-red-400 hover:text-red-300"
                title="Remove API key"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {(isEditing || !savedKey) && (
        <div>
          <div className="mb-4">
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-2">
              OpenRouter API Key
            </label>
            <input
              type={showKey ? "text" : "password"}
              id="apiKey"
              name="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value.trim())}
              placeholder="Enter your OpenRouter API key (sk-...)"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={isSaving || !apiKey.trim()}
              className={`px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors ${
                (isSaving || !apiKey.trim()) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSaving ? 'Saving...' : 'Save API Key'}
            </button>
            
            {isEditing && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  setApiKey(savedKey || '');
                  setError(null);
                }}
                className="px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            )}
            
            <button
              onClick={() => setShowKey(!showKey)}
              className="px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-300 mb-2">How to get your OpenRouter API key:</h3>
        <ol className="list-decimal list-inside text-sm text-gray-400 space-y-1">
          <li>Sign up or log in at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">OpenRouter.ai</a></li>
          <li>Navigate to the API Keys section</li>
          <li>Generate a new API key with appropriate permissions</li>
          <li>Copy and paste the key here</li>
        </ol>
        <p className="mt-3 text-xs text-gray-500">
          Your API key is stored securely on our servers and is never exposed to the client.
          For enhanced security, we recommend using an API key with appropriate rate limits and permissions.
        </p>
      </div>
    </div>
  );
};

export default ApiKeySettings; 