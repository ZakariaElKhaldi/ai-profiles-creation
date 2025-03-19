import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';

const profileSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name must be less than 50 characters'),
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
  aiModel: z.enum(['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet', 'llama-3']),
  contextLength: z.enum(['4k', '8k', '16k', '32k', '128k']),
  temperature: z.number().min(0).max(1),
  isPublic: z.boolean().default(false),
  allowedDomains: z.string().optional()
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const CreateProfileForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      description: '',
      aiModel: 'gpt-4',
      contextLength: '16k',
      temperature: 0.7,
      isPublic: false,
      allowedDomains: ''
    }
  });

  const temperature = watch('temperature');
  const isPublic = watch('isPublic');

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // This would be replaced with actual API call
      console.log('Creating profile:', data);
      
      // Mock successful creation
      setTimeout(() => {
        setSuccess('Profile created successfully!');
        setIsLoading(false);
        
        // Store the created profile in localStorage for demo purposes
        const existingProfiles = JSON.parse(localStorage.getItem('aiProfiles') || '[]');
        const newProfile = {
          id: Date.now().toString(),
          ...data,
          createdAt: new Date().toISOString(),
          documentCount: 0,
          hasApiKey: false
        };
        localStorage.setItem('aiProfiles', JSON.stringify([...existingProfiles, newProfile]));
        
        // Redirect to dashboard after 1 second
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }, 1000);
    } catch (err) {
      setError('Failed to create profile. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Create New AI Profile</h2>
      
      {error && (
        <div className="bg-red-900 border border-red-600 text-red-100 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-900 border border-green-600 text-green-100 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-gray-800 shadow-md rounded-lg p-6 border border-gray-700">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
            Profile Name*
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Customer Support Bot"
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
            rows={3}
            {...register('description')}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What is this AI profile for?"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="aiModel" className="block text-sm font-medium text-gray-300 mb-1">
              AI Model*
            </label>
            <select
              id="aiModel"
              {...register('aiModel')}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-3-opus">Claude 3 Opus</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              <option value="llama-3">Llama 3</option>
            </select>
            {errors.aiModel && (
              <p className="mt-1 text-sm text-red-400">{errors.aiModel.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="contextLength" className="block text-sm font-medium text-gray-300 mb-1">
              Context Length*
            </label>
            <select
              id="contextLength"
              {...register('contextLength')}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="4k">4K tokens</option>
              <option value="8k">8K tokens</option>
              <option value="16k">16K tokens</option>
              <option value="32k">32K tokens</option>
              <option value="128k">128K tokens</option>
            </select>
            {errors.contextLength && (
              <p className="mt-1 text-sm text-red-400">{errors.contextLength.message}</p>
            )}
          </div>
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
            <span>Precise (0.0)</span>
            <span>Balanced (0.5)</span>
            <span>Creative (1.0)</span>
          </div>
        </div>
        
        <div className="flex items-center">
          <input
            id="isPublic"
            type="checkbox"
            {...register('isPublic')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 bg-gray-700 border-gray-600 rounded"
          />
          <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-300">
            Make this profile publicly accessible
          </label>
        </div>
        
        {isPublic && (
          <div>
            <label htmlFor="allowedDomains" className="block text-sm font-medium text-gray-300 mb-1">
              Restrict Access to Domains (optional)
            </label>
            <input
              id="allowedDomains"
              type="text"
              {...register('allowedDomains')}
              placeholder="example.com, company.org (leave empty for no restrictions)"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Comma-separated list of domains that can access this profile. Leave empty to allow access from anywhere.
            </p>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mr-4 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 px-6 rounded-md transition duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition duration-200 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProfileForm; 