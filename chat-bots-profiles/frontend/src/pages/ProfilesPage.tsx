import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import DocumentSelector from '../components/chatbot/DocumentSelector';
import { fetchDocuments } from '../services/documentService';

interface Profile {
  id: string;
  name: string;
  description: string;
  model: string;
  temperature: number;
  document_ids: string[];
  max_tokens?: number;
  system_prompt?: string;
  created_at: string;
  updated_at: string;
}

interface Document {
  id: string;
  name: string;
  content?: string;
  metadata?: {
    source?: string;
    type?: string;
    size?: number;
  };
}

interface ApiKey {
  id: string;
  profile_id: string;
  key: string;
  name: string;
  created_at: string;
  expires_at?: string;
}

const ProfilesPage: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProfile, setNewProfile] = useState({
    name: '',
    description: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    max_tokens: 2048,
    system_prompt: '',
  });
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [apiKeys, setApiKeys] = useState<Record<string, ApiKey[]>>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [newApiKeyName, setNewApiKeyName] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/profiles`);
      setProfiles(response.data.profiles || []);
    } catch (err) {
      setError('Failed to load profiles');
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileApiKeys = async (profileId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/profiles/${profileId}/api-keys`);
      setApiKeys(prev => ({
        ...prev,
        [profileId]: response.data
      }));
    } catch (err) {
      console.error(`Error fetching API keys for profile ${profileId}:`, err);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const documentIds = selectedDocuments.map(doc => doc.id);
      
      const response = await axios.post(`${API_BASE_URL}/api/profiles`, {
        ...newProfile,
        document_ids: documentIds
      });
      
      setProfiles([...profiles, response.data]);
      setShowCreateForm(false);
      setNewProfile({
        name: '',
        description: '',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 2048,
        system_prompt: '',
      });
      setSelectedDocuments([]);
    } catch (err) {
      setError('Failed to create profile');
      console.error('Error creating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await axios.delete(`${API_BASE_URL}/api/profiles/${profileId}`);
      setProfiles(profiles.filter(profile => profile.id !== profileId));
    } catch (err) {
      setError('Failed to delete profile');
      console.error('Error deleting profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateApiKey = async (profileId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const keyName = newApiKeyName[profileId] || 'default';
      const response = await axios.post(`${API_BASE_URL}/api/profiles/${profileId}/api-key`, {
        name: keyName
      });
      
      // Refresh API keys
      await fetchProfileApiKeys(profileId);
      
      // Copy to clipboard
      navigator.clipboard.writeText(response.data.api_key);
      setCopiedKey(response.data.api_key);
      setTimeout(() => setCopiedKey(null), 3000);
      
      // Clear input
      setNewApiKeyName(prev => ({
        ...prev,
        [profileId]: ''
      }));
    } catch (err) {
      setError('Failed to generate API key');
      console.error('Error generating API key:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async (profileId: string, keyId: string) => {
    if (!window.confirm('Are you sure you want to delete this API key?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await axios.delete(`${API_BASE_URL}/api/profiles/${profileId}/api-keys/${keyId}`);
      
      // Refresh API keys
      await fetchProfileApiKeys(profileId);
    } catch (err) {
      setError('Failed to delete API key');
      console.error('Error deleting API key:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleApiKeys = async (profileId: string) => {
    const newState = !showApiKeys[profileId];
    setShowApiKeys({
      ...showApiKeys,
      [profileId]: newState
    });
    
    if (newState && (!apiKeys[profileId] || apiKeys[profileId].length === 0)) {
      await fetchProfileApiKeys(profileId);
    }
  };

  const handleDocumentSelect = (documents: Document[]) => {
    setSelectedDocuments(documents);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Chatbot Profiles</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          {showCreateForm ? 'Cancel' : 'Create New Profile'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500 text-white p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-zinc-800 p-6 rounded-lg mb-6 border border-zinc-700">
          <h2 className="text-xl font-semibold text-white mb-4">Create New Profile</h2>
          <form onSubmit={handleCreateProfile}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-zinc-300 mb-1">Name</label>
                <input
                  type="text"
                  value={newProfile.name}
                  onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-300 mb-1">Model</label>
                <select
                  value={newProfile.model}
                  onChange={(e) => setNewProfile({ ...newProfile, model: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="claude-3-opus">Claude 3 Opus</option>
                  <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                  <option value="claude-3-haiku">Claude 3 Haiku</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-zinc-300 mb-1">Description</label>
              <textarea
                value={newProfile.description}
                onChange={(e) => setNewProfile({ ...newProfile, description: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-zinc-300 mb-1">Temperature</label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={newProfile.temperature}
                  onChange={(e) => setNewProfile({ ...newProfile, temperature: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-zinc-300 mb-1">Max Tokens</label>
                <input
                  type="number"
                  min="1"
                  max="32000"
                  value={newProfile.max_tokens}
                  onChange={(e) => setNewProfile({ ...newProfile, max_tokens: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-zinc-300 mb-1">System Prompt (Optional)</label>
              <textarea
                value={newProfile.system_prompt || ''}
                onChange={(e) => setNewProfile({ ...newProfile, system_prompt: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="Enter a system prompt to guide the chatbot's behavior..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-zinc-300 mb-1">Documents</label>
              <DocumentSelector onDocumentsSelected={handleDocumentSelect} />
              <div className="mt-2 text-sm text-zinc-400">
                {selectedDocuments.length === 0 
                  ? 'No documents selected' 
                  : `${selectedDocuments.length} document(s) selected`}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && profiles.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-zinc-400">Loading profiles...</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12 bg-zinc-800 rounded-lg border border-zinc-700">
          <p className="text-zinc-400">No profiles found. Create your first profile to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {profiles.map((profile) => (
            <div key={profile.id} className="bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{profile.name}</h2>
                    <p className="text-zinc-400 mt-1">{profile.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/chat?profile=${profile.id}`)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm"
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => handleDeleteProfile(profile.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-zinc-400 text-sm">Model: <span className="text-white">{profile.model}</span></p>
                    <p className="text-zinc-400 text-sm">Temperature: <span className="text-white">{profile.temperature}</span></p>
                    <p className="text-zinc-400 text-sm">Max Tokens: <span className="text-white">{profile.max_tokens || 'Default'}</span></p>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">Created: <span className="text-white">{formatDate(profile.created_at)}</span></p>
                    <p className="text-zinc-400 text-sm">Updated: <span className="text-white">{formatDate(profile.updated_at)}</span></p>
                    <p className="text-zinc-400 text-sm">Documents: <span className="text-white">{profile.document_ids.length}</span></p>
                  </div>
                </div>

                {profile.system_prompt && (
                  <div className="mt-4">
                    <p className="text-zinc-400 text-sm">System Prompt:</p>
                    <div className="mt-1 p-3 bg-zinc-900 rounded-md text-zinc-300 text-sm">
                      {profile.system_prompt}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <button
                    onClick={() => toggleApiKeys(profile.id)}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                  >
                    <span>{showApiKeys[profile.id] ? 'Hide API Keys' : 'Manage API Keys'}</span>
                    <svg
                      className={`ml-1 w-4 h-4 transition-transform ${showApiKeys[profile.id] ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {showApiKeys[profile.id] && (
                  <div className="mt-4 p-4 bg-zinc-900 rounded-md">
                    <h3 className="text-white font-medium mb-3">API Keys</h3>
                    
                    <div className="mb-4 flex">
                      <input
                        type="text"
                        placeholder="Key name (optional)"
                        value={newApiKeyName[profile.id] || ''}
                        onChange={(e) => setNewApiKeyName({
                          ...newApiKeyName,
                          [profile.id]: e.target.value
                        })}
                        className="flex-grow px-3 py-2 bg-zinc-700 text-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleGenerateApiKey(profile.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md"
                      >
                        Generate Key
                      </button>
                    </div>
                    
                    {apiKeys[profile.id] && apiKeys[profile.id].length > 0 ? (
                      <div className="space-y-2">
                        {apiKeys[profile.id].map((key) => (
                          <div key={key.id} className="flex items-center justify-between p-2 bg-zinc-800 rounded-md">
                            <div>
                              <div className="text-zinc-300 text-sm font-medium">{key.name}</div>
                              <div className="text-zinc-500 text-xs">Created: {formatDate(key.created_at)}</div>
                            </div>
                            <div className="flex items-center">
                              <div className="text-zinc-400 text-sm mr-2 font-mono">
                                {key.key.substring(0, 8)}...
                              </div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(key.key);
                                  setCopiedKey(key.key);
                                  setTimeout(() => setCopiedKey(null), 3000);
                                }}
                                className="text-blue-400 hover:text-blue-300 mr-2"
                                title="Copy API key"
                              >
                                {copiedKey === key.key ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                  </svg>
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteApiKey(profile.id, key.id)}
                                className="text-red-400 hover:text-red-300"
                                title="Delete API key"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-500 text-sm">No API keys generated yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilesPage; 