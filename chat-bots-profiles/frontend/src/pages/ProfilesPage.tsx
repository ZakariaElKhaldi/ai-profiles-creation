import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { fetchDocuments, Document, fetchDocument, fetchUploadsDocuments } from '../services/documentService';
import DocumentSelector from '../components/chatbot/DocumentSelector';
import { useApp } from '../context/AppContext';

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
  modules?: Module[]; // New field for AI modules
  module_id?: string;
}

// New interfaces for AI modules
interface Module {
  id: string;
  name: string;
  description?: string;
  document_ids: string[];
  dataset_ids?: string[];
  type: ModuleType;
  config?: Record<string, any>;
}

enum ModuleType {
  RAG = "rag",
  QA = "qa",
  SUMMARIZATION = "summarization",
  RECOMMENDATION = "recommendation"
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
  const { availableModels } = useApp();
  
  // Get default model ID (first available model or empty string if none available)
  const defaultModelId = Object.keys(availableModels)[0] || '';
  
  const [newProfile, setNewProfile] = useState({
    name: '',
    description: '',
    model: defaultModelId,
    temperature: 0.7,
    max_tokens: 2048,
    system_prompt: '',
    module_id: '',
  });
  const [apiKeys, setApiKeys] = useState<Record<string, ApiKey[]>>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [newApiKeyName, setNewApiKeyName] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [profileDocuments, setProfileDocuments] = useState<Record<string, Document[]>>({});
  const [showDocumentBrowser, setShowDocumentBrowser] = useState<string | null>(null);
  const [showModuleDocumentSelector, setShowModuleDocumentSelector] = useState<string | null>(null);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [showModules, setShowModules] = useState<Record<string, boolean>>({});
  const [availableModules, setAvailableModules] = useState<{id: string, name: string}[]>([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    const loadProfileDocuments = async () => {
      const documentsMap: Record<string, Document[]> = {};

      for (const profile of profiles) {
        if (profile.document_ids && profile.document_ids.length > 0) {
          try {
            // Try to get all documents from any available source
            const allDocs = await loadAllDocuments();
            
            // Filter documents that belong to this profile
            const profileDocs = allDocs.filter(doc => 
              profile.document_ids.includes(doc.id)
            );
            
            // Fall back to individual document fetching for any IDs not found
            const missingIds = profile.document_ids.filter(
              id => !profileDocs.some(doc => doc.id === id)
            );
            
            if (missingIds.length > 0) {
              console.log(`Fetching ${missingIds.length} additional documents individually`);
              const additionalDocs = await Promise.all(
                missingIds.map(async (id) => {
                  try {
                    return await fetchDocument(id);
                  } catch (err) {
                    console.error(`Error fetching document ${id}:`, err);
                    return {
                      id,
                      name: 'Unknown Document',
                      content: '',
                      metadata: { type: 'unknown' }
                    } as Document;
                  }
                })
              );
              
              // Combine the documents
              documentsMap[profile.id] = [...profileDocs, ...additionalDocs];
            } else {
              documentsMap[profile.id] = profileDocs;
            }
            
            console.log(`Loaded ${documentsMap[profile.id].length} documents for profile ${profile.id}`);
          } catch (err) {
            console.error(`Error loading documents for profile ${profile.id}:`, err);
            documentsMap[profile.id] = [];
          }
        }
      }

      setProfileDocuments(documentsMap);
    };

    if (profiles.length > 0) {
      loadProfileDocuments();
    }
  }, [profiles]);

  useEffect(() => {
    fetchModules();
  }, [availableModels]);

  // Update the newProfile model when available models change
  useEffect(() => {
    if (Object.keys(availableModels).length > 0) {
      const firstModelId = Object.keys(availableModels)[0];
      setNewProfile(prev => ({
        ...prev,
        model: firstModelId
      }));
    }
  }, [availableModels]);

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
      // Prepare data for profile creation
      const profileData: any = {
        name: newProfile.name,
        description: newProfile.description,
        model: newProfile.model,
        temperature: newProfile.temperature,
        max_tokens: newProfile.max_tokens,
        system_prompt: newProfile.system_prompt,
        document_ids: []
      };
      
      // Only add module_id if it's not empty
      if (newProfile.module_id) {
        profileData.module_id = newProfile.module_id;
      }
      
      const response = await axios.post(`${API_BASE_URL}/api/profiles`, profileData);
      
      setProfiles([...profiles, response.data]);
      setShowCreateForm(false);
      setNewProfile({
        name: '',
        description: '',
        model: defaultModelId,
        temperature: 0.7,
        max_tokens: 2048,
        system_prompt: '',
        module_id: '',
      });
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Update the loadAllDocuments function
  const loadAllDocuments = async () => {
    setLoading(true);
    try {
      // Collect documents from multiple sources
      let allDocs: Document[] = [];
      const existingIds = new Set<string>();
      
      try {
        // 1. First try the standard documents API
        const apiDocs = await fetchDocuments();
        for (const doc of apiDocs) {
          if (!existingIds.has(doc.id)) {
            allDocs.push(doc);
            existingIds.add(doc.id);
          }
        }
        console.log(`Loaded ${apiDocs.length} documents from main API`);
      } catch (err) {
        console.error('Error loading documents from API:', err);
      }
      
      try {
        // 2. Then try the uploads-specific endpoint
        const uploadDocs = await fetchUploadsDocuments();
        let uploadCount = 0;
        for (const doc of uploadDocs) {
          if (!existingIds.has(doc.id)) {
            allDocs.push(doc);
            existingIds.add(doc.id);
            uploadCount++;
          }
        }
        console.log(`Added ${uploadCount} uploaded documents`);
      } catch (err) {
        console.error('Error loading uploaded documents:', err);
      }
      
      return allDocs;
    } catch (err) {
      console.error('Error loading all documents:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDocumentBrowser = (profileId: string) => {
    setShowDocumentBrowser(profileId);
  };

  const handleCloseDocumentBrowser = () => {
    setShowDocumentBrowser(null);
  };

  const handleOpenModuleDocumentSelector = (profileId: string, module: Module) => {
    setShowModuleDocumentSelector(profileId);
    setCurrentModule(module);
  };

  const handleCloseModuleDocumentSelector = () => {
    setShowModuleDocumentSelector(null);
    setCurrentModule(null);
  };

  const toggleModules = (profileId: string) => {
    setShowModules({
      ...showModules,
      [profileId]: !showModules[profileId]
    });
  };

  // Function to update a profile
  const updateProfile = async (updatedProfile: Profile) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/profiles/${updatedProfile.id}`, updatedProfile);
      // Refresh profiles to update UI
      await fetchProfiles();
      console.log(`Profile ${updatedProfile.id} updated successfully`);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    }
  };

  // Handle adding documents to a profile
  const handleAddDocumentToProfile = (profileId: string, document: Document) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      const updatedProfile = {
        ...profile,
        document_ids: [...(profile.document_ids || []), document.id]
      };
      updateProfile(updatedProfile);
      handleCloseDocumentBrowser();
    }
  };

  const handleAddDocumentsToProfile = (profileId: string, documents: Document[]) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      const updatedProfile = {
        ...profile,
        document_ids: [
          ...(profile.document_ids || []),
          ...documents.map(doc => doc.id)
        ]
      };
      updateProfile(updatedProfile);
      handleCloseDocumentBrowser();
    }
  };

  const handleUpdateModuleDocuments = (profileId: string, moduleId: string, documents: Document[]) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile && profile.modules) {
      const updatedModules = profile.modules.map(module => {
        if (module.id === moduleId) {
          return {
            ...module,
            document_ids: documents.map(doc => doc.id)
          };
        }
        return module;
      });
      
      const updatedProfile = {
        ...profile,
        modules: updatedModules
      };
      
      updateProfile(updatedProfile);
    }
  };

  const fetchModules = async () => {
    try {
      // Transform available models from AppContext to modules format
      const modules = Object.entries(availableModels).map(([id, model]) => ({
        id: id,
        name: `${model.name} (${model.provider})`,
        type: model.category
      }));
      
      setAvailableModules(modules);
    } catch (err) {
      console.error('Error processing models:', err);
      // Don't set error state to avoid blocking the UI
    }
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
                  {(() => {
                    // Get all categories
                    const categories = [...new Set(Object.values(availableModels).map(model => model.category))];
                    
                    // Group models by category
                    return categories.map(category => (
                      <optgroup key={category} label={category}>
                        {Object.entries(availableModels)
                          .filter(([, model]) => model.category === category)
                          .map(([id, model]) => (
                            <option key={id} value={id}>
                              {model.name} ({model.provider})
                            </option>
                          ))}
                      </optgroup>
                    ));
                  })()}
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-zinc-300 mb-1">OpenRouter Model</label>
              <select
                value={newProfile.module_id || ''}
                onChange={(e) => setNewProfile({ ...newProfile, module_id: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a model</option>
                {Array.isArray(availableModules) && availableModules.map(module => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
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
                    {profile.module_id && (
                      <p className="text-zinc-400 text-sm">
                        OpenRouter Model: <span className="text-white">
                          {availableModels[profile.module_id]?.name || profile.module_id}
                        </span>
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">Created: <span className="text-white">{formatDate(profile.created_at)}</span></p>
                    <p className="text-zinc-400 text-sm">Updated: <span className="text-white">{formatDate(profile.updated_at)}</span></p>
                    <p className="text-zinc-400 text-sm">Documents: <span className="text-white">{profile.document_ids.length}</span></p>
                  </div>
                </div>

                {/* Documents section */}
                <div className="mt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-zinc-400 text-sm">Associated Documents: {profile.document_ids.length}</p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleOpenDocumentBrowser(profile.id)}
                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                      >
                        <span>Add Individual Document</span>
                        <svg 
                          className="ml-1 w-4 h-4" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowDocumentBrowser(profile.id);
                          // Use multiple selection mode
                          const documentSelector = document.querySelector('.document-selector');
                          if (documentSelector) {
                            documentSelector.setAttribute('data-selection-mode', 'multiple');
                          }
                        }}
                        className="text-green-400 hover:text-green-300 text-sm flex items-center"
                      >
                        <span>Select Multiple Documents</span>
                        <svg 
                          className="ml-1 w-4 h-4" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {profile.document_ids.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {profileDocuments[profile.id] ? (
                        profileDocuments[profile.id].map((doc, index) => (
                          <div key={doc.id} className="flex items-center justify-between p-2 bg-zinc-900 rounded-md">
                            <div className="flex items-center flex-1 min-w-0">
                              <div className="text-zinc-300 text-sm truncate flex-1">
                                {doc.name || `Document ${index + 1}`}
                                {doc.metadata?.type && (
                                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-zinc-700 text-zinc-400">
                                    {doc.metadata.type}
                                  </span>
                                )}
                              </div>
                              {doc.metadata?.source === 'upload' && (
                                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-green-900/30 text-green-400">
                                  uploaded
                                </span>
                              )}
                            </div>
          <button
            onClick={() => {
                                if (window.confirm(`Remove "${doc.name}" from this profile?`)) {
                                  // Handle document removal
                                  const updatedProfile = { ...profile };
                                  updatedProfile.document_ids = updatedProfile.document_ids.filter(id => id !== doc.id);
                                  
                                  // Update the profile via API
                                  axios.patch(`${API_BASE_URL}/api/profiles/${profile.id}`, {
                                    document_ids: updatedProfile.document_ids
                                  }).then(() => {
                                    // Refresh profiles
                                    fetchProfiles();
                                  }).catch(err => {
                                    console.error('Error removing document from profile:', err);
                                    setError('Failed to remove document from profile');
                                  });
                                }
                              }}
                              className="ml-2 text-red-400 hover:text-red-300"
                              title="Remove document"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
          </button>
        </div>
                        ))
                      ) : (
                        profile.document_ids.map((docId, index) => (
                          <div key={docId} className="flex items-center p-2 bg-zinc-900 rounded-md">
                            <div className="text-zinc-300 text-sm font-mono truncate">
                              Document {index + 1}: {docId.substring(0, 8)}...
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* AI Modules Section */}
                <div className="mt-4">
                  <button
                    onClick={() => toggleModules(profile.id)}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                  >
                    <span>{showModules[profile.id] ? 'Hide AI Modules' : 'Manage AI Modules'}</span>
                    <svg
                      className={`ml-1 w-4 h-4 transition-transform ${showModules[profile.id] ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {showModules[profile.id] && (
                  <div className="mt-4 p-4 bg-zinc-900 rounded-md">
                    <h3 className="text-white font-medium mb-3">AI Modules</h3>
                    
                    {profile.modules && profile.modules.length > 0 ? (
                      <div className="space-y-4">
                        {profile.modules.map((module) => (
                          <div key={module.id} className="bg-zinc-800 rounded-md p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-white text-base font-medium">{module.name}</h4>
                                {module.description && (
                                  <p className="text-zinc-400 text-sm mt-1">{module.description}</p>
                                )}
                                <div className="mt-2 flex items-center">
                                  <span className="px-2 py-0.5 bg-indigo-900/30 text-indigo-300 text-xs rounded-full">
                                    {module.type}
                                  </span>
                                  <span className="ml-2 text-zinc-500 text-xs">
                                    {module.document_ids.length} document(s)
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleOpenModuleDocumentSelector(profile.id, module)}
                                className="text-blue-400 hover:text-blue-300 text-sm"
                              >
                                Select Documents
                              </button>
                            </div>
                            
                            {/* Show documents assigned to this module */}
                            {module.document_ids.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-zinc-700">
                                <p className="text-zinc-400 text-xs mb-2">Assigned Documents:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {module.document_ids.map(docId => {
                                    const doc = profileDocuments[profile.id]?.find(d => d.id === docId);
                                    return (
                                      <div key={docId} className="bg-zinc-900 rounded p-2 text-xs text-zinc-300 flex justify-between items-center">
                                        <span className="truncate">
                                          {doc ? doc.name : `Document ${docId.substring(0, 6)}...`}
                                        </span>
                                        <button
                                          onClick={() => {
                                            // Remove document from module
                                            const updatedModule = {
                                              ...module,
                                              document_ids: module.document_ids.filter(id => id !== docId)
                                            };
                                            handleUpdateModuleDocuments(
                                              profile.id, 
                                              module.id, 
                                              profileDocuments[profile.id]?.filter(d => 
                                                updatedModule.document_ids.includes(d.id)
                                              ) || []
                                            );
                                          }}
                                          className="text-red-400 hover:text-red-300 ml-2"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-500 text-sm">No AI modules configured yet.</p>
                    )}
                    
                    <button
                      onClick={() => {
                        // Create a new module
                        alert('This feature is coming soon!');
                      }}
                      className="mt-3 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md"
                    >
                      Create New Module
                    </button>
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
      
      {/* Document browser modal for single/multiple selection */}
      {showDocumentBrowser && (
        <DocumentSelector 
          onCancel={handleCloseDocumentBrowser}
          onDocumentSelected={(document) => handleAddDocumentToProfile(showDocumentBrowser, document)}
          onDocumentsSelected={(documents) => handleAddDocumentsToProfile(showDocumentBrowser, documents)}
          profileId={showDocumentBrowser}
          selectionMode="multiple"
        />
      )}
      
      {/* Document selector for modules */}
      {showModuleDocumentSelector && currentModule && (
        <DocumentSelector 
          onCancel={handleCloseModuleDocumentSelector}
          onDocumentsSelected={(documents) => {
            if (currentModule) {
              handleUpdateModuleDocuments(
                showModuleDocumentSelector, 
                currentModule.id, 
                documents
              );
            }
            handleCloseModuleDocumentSelector();
          }}
          selectedDocumentIds={currentModule.document_ids}
          profileId={showModuleDocumentSelector}
          selectionMode="multiple"
        />
      )}
    </div>
  );
};

export default ProfilesPage; 