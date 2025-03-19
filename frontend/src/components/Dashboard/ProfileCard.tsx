import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Profile } from './ProfileGrid';

interface ProfileCardProps {
  profile: Profile;
  onDelete: (id: string) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(profile.id);
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold text-gray-100">{profile.name}</h3>
          <div className="relative">
            <button 
              onClick={handleDeleteClick} 
              className="text-gray-400 hover:text-red-400"
              aria-label="Delete profile"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            
            {showDeleteConfirm && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10 border border-gray-600">
                <div className="p-3">
                  <p className="text-sm text-gray-200 mb-2">Delete this profile?</p>
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={cancelDelete}
                      className="px-2 py-1 text-xs text-gray-300 hover:text-gray-100"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={confirmDelete}
                      className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Created</span>
            <span className="text-gray-300">{formatDate(profile.createdAt)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Documents</span>
            <span className="text-gray-300">{profile.documentCount}</span>
          </div>
          
          {profile.lastQueried && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Last Queried</span>
              <span className="text-gray-300">{formatDate(profile.lastQueried)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">API Key</span>
            <span className={`${profile.hasApiKey ? 'text-green-400' : 'text-yellow-400'}`}>
              {profile.hasApiKey ? 'Active' : 'Not Generated'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-700 px-5 py-3 flex justify-between border-t border-gray-600">
        <Link 
          to={`/profile/${profile.id}`}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium"
        >
          Manage
        </Link>
        
        <Link 
          to={`/profile/${profile.id}/query`}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium"
        >
          Query
        </Link>
      </div>
    </div>
  );
};

export default ProfileCard; 