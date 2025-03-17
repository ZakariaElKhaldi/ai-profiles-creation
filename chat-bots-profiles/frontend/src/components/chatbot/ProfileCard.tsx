import React, { useState } from 'react';
import { ChatbotProfile } from '../../services/profileService';
import ProfileDocuments from './ProfileDocuments';

interface ProfileCardProps {
  profile: ChatbotProfile;
  onEdit: (profile: ChatbotProfile) => void;
  onDelete: (profile: ChatbotProfile) => void;
  onGenerateKey: (profile: ChatbotProfile) => void;
  onViewDetails: (profile: ChatbotProfile) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onEdit,
  onDelete,
  onGenerateKey,
  onViewDetails,
}) => {
  const [showDocuments, setShowDocuments] = useState(false);

  return (
    <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white">{profile.name}</h3>
          <p className="text-zinc-400 text-sm mt-1">{profile.description}</p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(profile)}
            className="p-2 text-zinc-400 hover:text-white"
            title="Edit profile"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          
          <button
            onClick={() => onDelete(profile)}
            className="p-2 text-zinc-400 hover:text-red-400"
            title="Delete profile"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Model:</span>
          <span className="text-zinc-300">{profile.model}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Temperature:</span>
          <span className="text-zinc-300">{profile.temperature}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Created:</span>
          <span className="text-zinc-300">
            {new Date(profile.created_at).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Documents:</span>
          <div className="flex items-center">
            <span className="text-zinc-300 mr-2">
              {profile.document_ids?.length || 0} / {profile.settings.document_limit || '∞'}
            </span>
            <button
              onClick={() => setShowDocuments(!showDocuments)}
              className="text-blue-400 hover:text-blue-300"
            >
              {showDocuments ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {profile.usage_stats && (
          <div className="text-sm space-y-1 mt-2 p-2 bg-zinc-900 rounded">
            <div className="text-zinc-400 font-medium mb-1">Usage Stats</div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Document Count:</span>
              <span className="text-zinc-300">{profile.usage_stats.document_count || 0}</span>
            </div>
            {profile.usage_stats.last_document_update && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Last Update:</span>
                <span className="text-zinc-300">
                  {new Date(profile.usage_stats.last_document_update).toLocaleDateString()}
                </span>
              </div>
            )}
            {profile.usage_stats.token_usage && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Token Usage:</span>
                <span className="text-zinc-300">
                  {profile.usage_stats.token_usage.toLocaleString()} / {profile.settings.token_limit?.toLocaleString() || '∞'}
                </span>
              </div>
            )}
            {profile.usage_stats.avg_response_time && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Avg Response:</span>
                <span className="text-zinc-300">
                  {profile.usage_stats.avg_response_time}ms
                </span>
              </div>
            )}
          </div>
        )}

        {showDocuments && (
          <ProfileDocuments
            profile={profile}
            onUpdate={() => onViewDetails(profile)}
          />
        )}
      </div>
      
      <div className="mt-6 flex space-x-3">
        <button
          onClick={() => onGenerateKey(profile)}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Generate API Key
        </button>
        
        <button
          onClick={() => onViewDetails(profile)}
          className="flex-1 px-4 py-2 bg-zinc-700 text-white rounded-md hover:bg-zinc-600"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default ProfileCard; 