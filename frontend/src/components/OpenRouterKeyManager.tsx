import React, { useState, useEffect } from 'react';
import { openRouterService, APIKey, ActiveKeyInfo } from '../services/openrouter';

interface Props {
  onKeyChange?: (hasKey: boolean) => void;
}

export const OpenRouterKeyManager: React.FC<Props> = ({ onKeyChange }) => {
  const [newKey, setNewKey] = useState('');
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [activeKeyInfo, setActiveKeyInfo] = useState<ActiveKeyInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load keys and active key info on mount
  useEffect(() => {
    loadKeys();
    loadActiveKey();
  }, []);

  const loadKeys = async () => {
    try {
      const response = await openRouterService.listKeys();
      setKeys(response.keys);
    } catch (err) {
      setError('Failed to load API keys');
      console.error(err);
    }
  };

  const loadActiveKey = async () => {
    try {
      const info = await openRouterService.getActiveKey();
      setActiveKeyInfo(info);
      onKeyChange?.(info.active);
    } catch (err) {
      setError('Failed to load active key info');
      console.error(err);
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await openRouterService.addKey(newKey);
      await openRouterService.setActiveKey(newKey);
      setNewKey('');
      setSuccess('API key added and set as active');
      await loadKeys();
      await loadActiveKey();
    } catch (err) {
      setError('Failed to add API key');
      console.error(err);
    }
  };

  const handleDeleteKey = async (key: string) => {
    try {
      await openRouterService.deleteKey(key);
      setSuccess('API key deleted');
      await loadKeys();
      await loadActiveKey();
    } catch (err) {
      setError('Failed to delete API key');
      console.error(err);
    }
  };

  const handleSetActive = async (key: string) => {
    try {
      await openRouterService.setActiveKey(key);
      setSuccess('Active key updated');
      await loadActiveKey();
    } catch (err) {
      setError('Failed to set active key');
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">OpenRouter API Key Management</h2>
        
        {/* Active Key Status */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700">Active Key Status</h3>
          <p className="text-sm text-gray-600">
            {activeKeyInfo?.active 
              ? `Active Key: ${activeKeyInfo.key}`
              : 'No active key set'}
          </p>
        </div>

        {/* Add New Key Form */}
        <form onSubmit={handleAddKey} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
              Add New API Key
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                id="apiKey"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Enter your OpenRouter API key"
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <button
                type="submit"
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Key
              </button>
            </div>
          </div>
        </form>

        {/* Messages */}
        {error && (
          <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-2 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Stored Keys List */}
        {keys.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Stored Keys</h3>
            <ul className="divide-y divide-gray-200">
              {keys.map((key) => (
                <li key={key.key} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {`${key.key.substring(0, 4)}...${key.key.substring(key.key.length - 4)}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      Added: {new Date(key.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSetActive(key.key)}
                      className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      Set Active
                    </button>
                    <button
                      onClick={() => handleDeleteKey(key.key)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenRouterKeyManager; 