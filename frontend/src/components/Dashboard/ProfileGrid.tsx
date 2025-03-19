import React, { useState, useEffect } from 'react';
import ProfileCard from './ProfileCard';
import { useNavigate } from 'react-router-dom';

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
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const navigate = useNavigate();

  // Load profiles from localStorage on component mount
  useEffect(() => {
    const storedProfiles = localStorage.getItem('aiProfiles');
    
    if (storedProfiles) {
      try {
        const parsedProfiles = JSON.parse(storedProfiles);
        setProfiles(parsedProfiles);
      } catch (error) {
        console.error('Error parsing profiles from localStorage:', error);
        // If there's an error, initialize with sample data
        initializeWithSampleData();
      }
    } else {
      // If no profiles in localStorage, initialize with sample data
      initializeWithSampleData();
    }
  }, []);

  // Initialize with sample data if no profiles exist
  const initializeWithSampleData = () => {
    const sampleProfiles = [
      {
        id: '1',
        name: 'Customer Support Bot',
        createdAt: '2023-10-15',
        documentCount: 3,
        lastQueried: '2023-10-20',
        hasApiKey: true,
        aiModel: 'gpt-4',
        description: 'Handles customer support queries about our products and services'
      },
      {
        id: '2',
        name: 'Product Documentation',
        createdAt: '2023-09-22',
        documentCount: 5,
        lastQueried: '2023-10-19',
        hasApiKey: true,
        aiModel: 'claude-3-opus',
        description: 'Contains all product documentation and user guides'
      },
      {
        id: '3',
        name: 'Marketing Materials',
        createdAt: '2023-10-05',
        documentCount: 2,
        hasApiKey: false,
        aiModel: 'gpt-3.5-turbo',
        description: 'Repository of marketing content and brand guidelines'
      }
    ];
    
    setProfiles(sampleProfiles);
    localStorage.setItem('aiProfiles', JSON.stringify(sampleProfiles));
  };

  const handleDeleteProfile = (id: string) => {
    const updatedProfiles = profiles.filter(profile => profile.id !== id);
    setProfiles(updatedProfiles);
    localStorage.setItem('aiProfiles', JSON.stringify(updatedProfiles));
  };

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

      {profiles.length === 0 ? (
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
          {profiles.map(profile => (
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