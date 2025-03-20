import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService, ProfileUpdate } from '../../services/api/profiles';
import { openRouterService } from '../../services/openrouter';

const profileSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name must be less than 50 characters'),
  description: z.string().max(200, 'Description must be less than 200 characters').optional().nullable(),
  system_prompt: z.string().max(4000, 'System prompt must be less than 4000 characters').optional().nullable(),
  model: z.string().min(1, 'Please select an AI model'),
  temperature: z.number().min(0).max(1),
  max_tokens: z.number().min(1).max(128000),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileDetailsProps {
  profileId: string;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ profileId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch profile data
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile', profileId],
    queryFn: () => profileService.getProfile(profileId),
    enabled: !!profileId,
  });

  // Fetch available models
  const { data: modelsData, isLoading: isLoadingModels } = useQuery({
    queryKey: ['openrouter-models'],
    queryFn: () => openRouterService.getModels(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileUpdate) => profileService.updateProfile(profileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', profileId] });
      setSuccess('Profile saved successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to save profile. Please try again.');
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      description: '',
      system_prompt: '',
      model: '',
      temperature: 0.7,
      max_tokens: 16000,
    }
  });

  // Update form when profile data loads
  React.useEffect(() => {
    if (profile) {
      setValue('name', profile.name);
      setValue('description', profile.description || '');
      setValue('system_prompt', profile.system_prompt);
      setValue('model', profile.model);
      setValue('temperature', profile.temperature);
      setValue('max_tokens', profile.max_tokens);
    }
  }, [profile, setValue]);

  const temperature = watch('temperature');

  const onSubmit = (data: ProfileFormValues) => {
    // Convert null values to undefined for the API
    const updateData: ProfileUpdate = {
      name: data.name,
      description: data.description === null ? undefined : data.description,
      system_prompt: data.system_prompt === null ? undefined : data.system_prompt,
      model: data.model,
      temperature: data.temperature,
      max_tokens: data.max_tokens
    };
    
    updateMutation.mutate(updateData);
  };

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000) {
      return `${tokens / 1000}k`;
    }
    return tokens.toString();
  };

  // Show loading state
  if (isLoadingProfile) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-100">Profile Details</h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900 bg-opacity-30 text-red-300 p-4 rounded-md border border-red-800 text-sm mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-900 bg-opacity-30 text-green-300 p-4 rounded-md border border-green-800 text-sm mb-4">
          {success}
        </div>
      )}

      {!isEditing && profile ? (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-400">Name</h4>
            <p className="text-gray-200">{profile.name}</p>
          </div>
          
          {profile.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-400">Description</h4>
              <p className="text-gray-200">{profile.description}</p>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium text-gray-400">System Prompt</h4>
            <div className="bg-gray-750 p-3 rounded border border-gray-600 mt-1">
              <p className="text-gray-300 whitespace-pre-wrap">{profile.system_prompt || 'No system prompt set'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-400">AI Model</h4>
              <p className="text-gray-200">{profile.model}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-400">Temperature</h4>
              <p className="text-gray-200">{profile.temperature}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-400">Max Tokens</h4>
              <p className="text-gray-200">{formatTokens(profile.max_tokens)}</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-400">Created</h4>
            <p className="text-gray-200">{new Date(profile.created_at).toLocaleString()}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-400">Status</h4>
            <p className="text-gray-200 capitalize">{profile.status}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-400">Query Count</h4>
            <p className="text-gray-200">{profile.query_count} queries</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-400">Document Count</h4>
            <p className="text-gray-200">{profile.document_ids?.length || 0} documents</p>
          </div>
        </div>
      ) : (
        <form className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Profile Name*
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              rows={2}
              {...register('description')}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="system_prompt" className="block text-sm font-medium text-gray-300 mb-1">
              System Prompt
            </label>
            <textarea
              id="system_prompt"
              rows={4}
              {...register('system_prompt')}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Instructions that define how the AI should behave"
            />
            {errors.system_prompt && (
              <p className="mt-1 text-sm text-red-400">{errors.system_prompt.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-1">
                AI Model*
              </label>
              <select
                id="model"
                {...register('model')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoadingModels}
              >
                <option value="">Select a model</option>
                {modelsData?.data.map((model: {id: string, name: string, top_provider?: string}) => (
                  <option key={model.id} value={model.id}>
                    {model.name} {model.top_provider ? `(${model.top_provider})` : ''}
                  </option>
                ))}
              </select>
              {errors.model && (
                <p className="mt-1 text-sm text-red-400">{errors.model.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="temperature" className="block text-sm font-medium text-gray-300 mb-1">
                Temperature: {temperature}
              </label>
              <input
                id="temperature"
                type="range"
                min="0"
                max="1"
                step="0.1"
                {...register('temperature', { valueAsNumber: true })}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>
            
            <div>
              <label htmlFor="max_tokens" className="block text-sm font-medium text-gray-300 mb-1">
                Max Tokens*
              </label>
              <select
                id="max_tokens"
                {...register('max_tokens', { valueAsNumber: true })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="4000">4K tokens</option>
                <option value="8000">8K tokens</option>
                <option value="16000">16K tokens</option>
                <option value="32000">32K tokens</option>
                <option value="128000">128K tokens</option>
              </select>
              {errors.max_tokens && (
                <p className="mt-1 text-sm text-red-400">{errors.max_tokens.message}</p>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProfileDetails; 