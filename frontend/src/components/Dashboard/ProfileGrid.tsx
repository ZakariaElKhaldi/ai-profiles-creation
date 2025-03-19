import React, { useState } from 'react';
import ProfileCard from './ProfileCard';

export interface Profile {
  id: string;
  name: string;
  createdAt: string;
  documentCount: number;
  lastQueried?: string;
  hasApiKey: boolean;
}

const ProfileGrid: React.FC = () => {
  // Mock profiles data - would be replaced with actual data fetch
  const [profiles, setProfiles] = useState<Profile[]>([
    {
      id: '1',
      name: 'Customer Support Bot',
      createdAt: '2023-10-15',
      documentCount: 3,
      lastQueried: '2023-10-20',
      hasApiKey: true
    },
    {
      id: '2',
      name: 'Product Documentation',
      createdAt: '2023-09-22',
      documentCount: 5,
      lastQueried: '2023-10-19',
      hasApiKey: true
    },
    {
      id: '3',
      name: 'Marketing Materials',
      createdAt: '2023-10-05',
      documentCount: 2,
      hasApiKey: false
    }
  ]);

  const handleDeleteProfile = (id: string) => {
    setProfiles(profiles.filter(profile => profile.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your AI Profiles</h2>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          + Create New Profile
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-600">No profiles yet</h3>
          <p className="text-gray-500 mt-2">Create your first AI profile to get started</p>
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