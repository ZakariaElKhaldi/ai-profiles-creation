import React, { useState, useEffect } from 'react';
import ProfileCard from './ProfileCard';
import { useNavigate } from 'react-router-dom';
import { profileService, documentService } from '../../services/api';
import { useQuery } from '@tanstack/react-query';

export interface Profile {
  id: string;
  name: string;
  createdAt: string;
  documentCount: number;
  lastQueried?: string;
  hasApiKey: boolean;
  description?: string;
  aiModel?: string;
  contextLength?: string;
  temperature?: number;
  isPublic?: boolean;
}

const ProfileGrid: React.FC = () => {
  const navigate = useNavigate();

  // Fetch profiles from API
  const { data, isLoading, isError } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const response = await profileService.listProfiles();
      return response.profiles;
    },
  });

  // Fetch all documents once to count them
  const { data: documentsData } = useQuery({
    queryKey: ['all-documents'],
    queryFn: async () => {
      const response = await documentService.listDocuments();
      return response.documents;
    },
    enabled: !!data, // only fetch documents after profiles are loaded
  });

  // Transform API profiles to UI format
  const transformedProfiles: Profile[] = data?.map(profile => {
    // Count documents for this profile
    const profileDocuments = documentsData?.filter(doc => doc.profile_id === profile.id) || [];
    
    return {
      id: profile.id,
      name: profile.name,
      createdAt: profile.created_at,
      documentCount: profileDocuments.length,
      hasApiKey: false, // TODO: This should be updated with real API key status
      description: profile.description,
      aiModel: profile.model,
      contextLength: profile.max_tokens.toString(),
      temperature: profile.temperature,
    };
  }) || [];

  const handleDeleteProfile = async (id: string) => {
    try {
      await profileService.deleteProfile(id);
      // Refresh profiles
      window.location.reload();
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your AI Profiles</h2>
          <button 
            onClick={() => navigate('/profile/create')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            + Create New Profile
          </button>
        </div>
        <div className="text-center py-10 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex justify-center items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-100"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-200"></div>
          </div>
          <p className="text-gray-400 mt-2">Loading profiles...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your AI Profiles</h2>
          <button 
            onClick={() => navigate('/profile/create')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            + Create New Profile
          </button>
        </div>
        <div className="text-center py-10 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-lg font-medium text-red-400">Error loading profiles</h3>
          <p className="text-gray-400 mt-2">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your AI Profiles</h2>
        <button 
          onClick={() => navigate('/profile/create')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          + Create New Profile
        </button>
      </div>

      {transformedProfiles.length === 0 ? (
        <div className="text-center py-10 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-lg font-medium text-gray-300">No profiles yet</h3>
          <p className="text-gray-400 mt-2">Create your first AI profile to get started</p>
          <button 
            onClick={() => navigate('/profile/create')} 
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Create Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transformedProfiles.map(profile => (
            <ProfileCard 
              key={profile.id} 
              profile={profile} 
              onDelete={handleDeleteProfile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileGrid; 