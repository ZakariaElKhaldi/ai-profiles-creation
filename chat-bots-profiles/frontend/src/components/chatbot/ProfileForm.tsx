import React, { useState, useEffect } from 'react';
import { CreateProfileRequest, ChatbotProfile } from '../../services/profileService';
import { getModelCategories, getModelsByCategory, Model } from '../../services/chatService';

interface ProfileFormProps {
  initialData?: ChatbotProfile;
  onSubmit: (data: CreateProfileRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  // Form state
  const [formData, setFormData] = useState<CreateProfileRequest>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    model: initialData?.model || 'openai/gpt-3.5-turbo',
    temperature: initialData?.temperature || 0.7,
  });
  
  // Models state
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [models, setModels] = useState<Record<string, Model>>({});
  const [loadingModels, setLoadingModels] = useState(false);

  // Load model categories and models on component mount
  useEffect(() => {
    const loadModels = async () => {
      setLoadingModels(true);
      try {
        const fetchedCategories = await getModelCategories();
        setCategories(fetchedCategories);
        
        // Set initial selected category
        if (fetchedCategories.length > 0) {
          const initialCategory = fetchedCategories[0];
          setSelectedCategory(initialCategory);
          
          // Load models for the selected category
          const categoryModels = await getModelsByCategory(initialCategory);
          setModels(categoryModels);
        }
      } catch (error) {
        console.error('Error loading models:', error);
      } finally {
        setLoadingModels(false);
      }
    };
    
    loadModels();
  }, []);

  // Update models when category changes
  useEffect(() => {
    if (!selectedCategory) return;
    
    const loadCategoryModels = async () => {
      setLoadingModels(true);
      try {
        const categoryModels = await getModelsByCategory(selectedCategory);
        setModels(categoryModels);
        
        // Set first model as selected if there's no match in the current category
        const modelIds = Object.keys(categoryModels);
        if (modelIds.length > 0 && !modelIds.includes(formData.model)) {
          setFormData(prev => ({ ...prev, model: modelIds[0] }));
        }
      } catch (error) {
        console.error('Error loading category models:', error);
      } finally {
        setLoadingModels(false);
      }
    };
    
    loadCategoryModels();
  }, [selectedCategory]);

  // Update form data when input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle temperature slider change
  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setFormData(prev => ({ ...prev, temperature: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  // Get model options for the selected category
  const getModelOptions = () => {
    return Object.entries(models).map(([id, model]) => ({
      value: id,
      label: `${model.name} (${model.provider})`,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1">
          Profile Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className="w-full rounded-md bg-zinc-800 border-zinc-700 text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="My Chatbot Profile"
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
          className="w-full rounded-md bg-zinc-800 border-zinc-700 text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe what this chatbot profile is for..."
        />
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-zinc-300 mb-1">
            Model Category
          </label>
          <select
            id="category"
            name="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={loadingModels || categories.length === 0}
            className="w-full rounded-md bg-zinc-800 border-zinc-700 text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-zinc-300 mb-1">
            Model
          </label>
          <select
            id="model"
            name="model"
            value={formData.model}
            onChange={handleInputChange}
            required
            disabled={loadingModels || Object.keys(models).length === 0}
            className="w-full rounded-md bg-zinc-800 border-zinc-700 text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {getModelOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Temperature: {formData.temperature.toFixed(1)}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={formData.temperature}
          onChange={handleTemperatureChange}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-zinc-500 mt-1">
          <span>Precise (0.0)</span>
          <span>Balanced (1.0)</span>
          <span>Creative (2.0)</span>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-zinc-600 rounded-md text-zinc-300 hover:bg-zinc-700"
        >
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : initialData ? 'Update Profile' : 'Create Profile'}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm; 