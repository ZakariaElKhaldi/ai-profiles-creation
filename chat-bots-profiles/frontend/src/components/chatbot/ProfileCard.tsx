import React from 'react';
import { ChatbotProfile } from '../../services/profileService';

interface ProfileCardProps {
  profile: ChatbotProfile;
  onEdit?: (profile: ChatbotProfile) => void;
  onDelete?: (profile: ChatbotProfile) => void;
  onGenerateKey?: (profile: ChatbotProfile) => void;
  onViewDetails?: (profile: ChatbotProfile) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onEdit,
  onDelete,
  onGenerateKey,
  onViewDetails,
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete the profile "${profile.name}"?`)) {
      onDelete?.(profile);
    }
  };

  return (
    <div 
      className="bg-zinc-800 rounded-lg overflow-hidden shadow-lg border border-zinc-700 hover:border-zinc-600 transition-all cursor-pointer"
      onClick={() => onViewDetails?.(profile)}
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-white mb-2">{profile.name}</h3>
          <div className="flex gap-1 ml-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(profile);
                }}
                className="p-1.5 rounded-full bg-zinc-700 hover:bg-zinc-600 text-zinc-300 hover:text-white"
                title="Edit profile"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-full bg-zinc-700 hover:bg-red-800 text-zinc-300 hover:text-white"
                title="Delete profile"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            )}
          </div>
        </div>
        
        <p className="text-zinc-400 text-sm mb-3 line-clamp-2">
          {profile.description || 'No description provided'}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-1 rounded">
            {profile.model}
          </span>
          
          <span className="bg-purple-900/50 text-purple-300 text-xs px-2 py-1 rounded">
            Temp: {profile.temperature}
          </span>
          
          {profile.training_data_count !== undefined && (
            <span className="bg-green-900/50 text-green-300 text-xs px-2 py-1 rounded">
              {profile.training_data_count} training files
            </span>
          )}
        </div>
        
        <div className="text-xs text-zinc-500">
          Created: {new Date(profile.created_at).toLocaleDateString()}
        </div>
      </div>
      
      {onGenerateKey && (
        <div className="border-t border-zinc-700 p-3 bg-zinc-800/50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGenerateKey(profile);
            }}
            className="w-full py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white font-medium rounded text-sm"
          >
            Generate API Key
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileCard; 