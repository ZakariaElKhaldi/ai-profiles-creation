import React, { useState, useEffect } from 'react';
import { CreateProfileRequest, ChatbotProfile, ProfileSettings } from '../../services/profileService';
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
    personality_traits: initialData?.personality_traits || ['helpful', 'friendly'],
    example_messages: initialData?.example_messages || [],
    settings: initialData?.settings || {
      document_limit: 10,
      token_limit: 1000000,
      response_time_limit: 30000
    }
  });
  
  // Models state
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [models, setModels] = useState<Record<string, Model>>({});
  const [loadingModels, setLoadingModels] = useState(false);

  // Personality traits state
  const [traitInput, setTraitInput] = useState('');

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

  // Add a personality trait
  const handleAddTrait = () => {
    if (traitInput.trim() === '') return;
    
    setFormData(prev => ({
      ...prev,
      personality_traits: [...prev.personality_traits, traitInput.trim()]
    }));
    setTraitInput('');
  };

  // Remove a personality trait
  const handleRemoveTrait = (index: number) => {
    setFormData(prev => ({
      ...prev,
      personality_traits: prev.personality_traits.filter((_, i) => i !== index)
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
      
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Personality Traits
        </label>
        <div className="flex mb-2">
          <input
            type="text"
            value={traitInput}
            onChange={(e) => setTraitInput(e.target.value)}
            className="flex-1 rounded-l-md bg-zinc-800 border-zinc-700 text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add a personality trait..."
          />
          <button
            type="button"
            onClick={handleAddTrait}
            className="px-4 py-2 bg-zinc-700 text-white rounded-r-md hover:bg-zinc-600"
          >
            Add
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {formData.personality_traits.map((trait, index) => (
            <div key={index} className="bg-zinc-700 text-white px-3 py-1 rounded-full flex items-center">
              <span>{trait}</span>
              <button
                type="button"
                onClick={() => handleRemoveTrait(index)}
                className="ml-2 text-zinc-400 hover:text-white"
              >
                &times;
              </button>
            </div>
          ))}
          {formData.personality_traits.length === 0 && (
            <div className="text-zinc-500 text-sm">Add at least one personality trait</div>
          )}
        </div>
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
      
      <div>
        <label htmlFor="documentLimit" className="block text-sm font-medium text-zinc-300 mb-1">
          Document Limit
        </label>
        <input
          type="number"
          id="documentLimit"
          min="0"
          value={formData.settings?.document_limit || 10}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            settings: {
              ...prev.settings,
              document_limit: parseInt(e.target.value)
            }
          }))}
          className="w-full rounded-md bg-zinc-800 border-zinc-700 text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-zinc-500 mt-1">Maximum number of documents that can be attached (0 for unlimited)</p>
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