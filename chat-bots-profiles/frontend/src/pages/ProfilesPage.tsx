import React, { useState, useEffect } from 'react';
import ProfileCard from '../components/chatbot/ProfileCard';
import ProfileForm from '../components/chatbot/ProfileForm';
import { fetchProfiles, createProfile, deleteProfile, generateApiKey, ChatbotProfile, CreateProfileRequest, ApiKeyResponse } from '../services/profileService';

const ProfilesPage: React.FC = () => {
  const [profiles, setProfiles] = useState<ChatbotProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ChatbotProfile | null>(null);
  const [apiKey, setApiKey] = useState<ApiKeyResponse | null>(null);

  // Load profiles on component mount
  useEffect(() => {
    loadProfiles();
  }, []);

  // Load profiles from API
  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchProfiles();
      // Ensure profiles is an array
      setProfiles(Array.isArray(data) ? data : (data as any).profiles || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
      setError('Failed to load profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle profile creation
  const handleCreateProfile = async (data: CreateProfileRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      await createProfile(data);
      
      // Reload profiles after creating a new one
      await loadProfiles();
      
      // Close the form
      setShowForm(false);
    } catch (error) {
      console.error('Error creating profile:', error);
      setError('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle profile deletion
  const handleDeleteProfile = async (profile: ChatbotProfile) => {
    setLoading(true);
    setError(null);
    
    try {
      await deleteProfile(profile.id);
      
      // Remove profile from state
      setProfiles(profiles.filter(p => p.id !== profile.id));
    } catch (error) {
      console.error('Error deleting profile:', error);
      setError('Failed to delete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle API key generation
  const handleGenerateApiKey = async (profile: ChatbotProfile) => {
    setLoading(true);
    setError(null);
    
    try {
      const key = await generateApiKey(profile.id);
      setApiKey(key);
    } catch (error) {
      console.error('Error generating API key:', error);
      setError('Failed to generate API key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Chatbot Profiles</h1>
          <p className="text-zinc-400 mt-1">
            Create and manage your AI chatbot profiles
          </p>
        </div>
        
        <button
          onClick={() => {
            setEditingProfile(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Profile
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-900/50 border border-red-800 text-red-200 p-3 mb-6 rounded-lg">
          {error}
        </div>
      )}
      
      {/* API Key modal */}
      {apiKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-2">API Key Generated</h3>
            <p className="text-zinc-400 mb-4">
              Save this API key securely. For security reasons, you won't be able to see it again.
            </p>
            
            <div className="bg-zinc-900 p-3 rounded-md mb-4">
              <code className="text-green-400 font-mono text-sm break-all">
                {apiKey.api_key}
              </code>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => navigator.clipboard.writeText(apiKey.api_key)}
                className="px-4 py-2 bg-zinc-700 text-white rounded-md hover:bg-zinc-600"
              >
                Copy to Clipboard
              </button>
              
              <button
                onClick={() => setApiKey(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Profile form */}
      {showForm && (
        <div className="mb-8 bg-zinc-800 p-6 rounded-lg border border-zinc-700">
          <h2 className="text-xl font-semibold text-white mb-4">
            {editingProfile ? 'Edit Profile' : 'Create New Profile'}
          </h2>
          
          <ProfileForm
            initialData={editingProfile || undefined}
            onSubmit={handleCreateProfile}
            onCancel={() => setShowForm(false)}
            isLoading={loading}
          />
        </div>
      )}
      
      {/* Profiles grid */}
      {loading && profiles.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading profiles...</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12 bg-zinc-800/50 rounded-lg border border-zinc-700">
          <p className="text-zinc-400 mb-4">
            You haven't created any chatbot profiles yet.
          </p>
          <button
            onClick={() => {
              setEditingProfile(null);
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Your First Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map(profile => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onEdit={(profile) => {
                setEditingProfile(profile);
                setShowForm(true);
              }}
              onDelete={handleDeleteProfile}
              onGenerateKey={handleGenerateApiKey}
              onViewDetails={(profile) => {
                // Could navigate to a details page
                console.log('View details:', profile);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilesPage; 