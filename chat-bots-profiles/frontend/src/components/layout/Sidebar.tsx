import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

// Navigation options
const navOptions = [
  { id: 'chat', label: '💬 Chat', description: 'Test and chat with AI models', path: '/' },
  { id: 'profiles', label: '🤖 Profiles', description: 'Manage chatbot profiles', path: '/profiles' },
  { id: 'todo', label: '✅ Todo', description: 'Manage your tasks', path: '/todo' },
  { id: 'documents', label: '📄 Documents', description: 'Manage document context', path: '/documents' },
  { id: 'ab_testing', label: '🔬 A/B Testing', description: 'Compare different models', path: '/ab-testing' },
  { id: 'metrics', label: '📈 Metrics', description: 'Performance metrics', path: '/metrics' },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    selectedModel, 
    availableModels, 
    setSelectedModel,
    refreshModels,
    useDocumentContext,
    toggleDocumentContext,
    resetSession
  } = useApp();

  // State for searchable dropdown
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current path for highlighting active tab
  const currentPath = location.pathname;

  // Get model categories for selection
  const categories = [...new Set(Object.values(availableModels).map(model => model.category))];

  // Get currently selected model details
  const currentModel = availableModels[selectedModel];

  // Filter models by category
  const getModelsByCategory = (category: string) => {
    return Object.entries(availableModels)
      .filter(([, model]) => model.category === category)
      .map(([id, model]) => ({
        id,
        name: model.name,
        provider: model.provider
      }));
  };

  // Get all models for searchable dropdown
  const getAllModels = () => {
    return Object.entries(availableModels)
      .map(([id, model]) => ({
        id,
        name: model.name,
        provider: model.provider,
        category: model.category
      }));
  };

  // Filter models based on search term
  const filteredModels = getAllModels().filter(model => 
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    model.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleResetChat = () => {
    if (confirm('Are you sure you want to clear the current conversation?')) {
      resetSession();
    }
  };

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 h-screen overflow-y-auto p-4 flex flex-col">
      <h1 className="text-xl font-bold text-white mb-6">
        AI Chatbot Profiles
      </h1>

      {/* Navigation */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-400 mb-3">NAVIGATION</h2>
        <nav>
          <ul className="space-y-1">
            {navOptions.map((option) => (
              <li key={option.id}>
                <button
                  onClick={() => navigate(option.path)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${
                    currentPath === option.path
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <span>{option.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Model Selection */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-zinc-400">MODEL</h2>
          <button 
            onClick={refreshModels}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Refresh
          </button>
        </div>

        {categories.length > 0 && (
          <div className="space-y-2">
            {/* Category selector */}
            <select 
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
              onChange={(e) => {
                // Select first model from category
                const categoryModels = getModelsByCategory(e.target.value);
                if (categoryModels.length > 0) {
                  setSelectedModel(categoryModels[0].id);
                }
              }}
              value={currentModel?.category || ''}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Searchable Model selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white text-left flex justify-between items-center"
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              >
                <span>
                  {currentModel ? `${currentModel.name} (${currentModel.provider})` : 'Select a model'}
                </span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 ml-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isModelDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg overflow-hidden">
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Search models..."
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredModels.length > 0 ? (
                      filteredModels.map((model) => (
                        <button
                          key={model.id}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-800 ${
                            selectedModel === model.id ? 'bg-blue-600 text-white' : 'text-white'
                          }`}
                          onClick={() => {
                            setSelectedModel(model.id);
                            setIsModelDropdownOpen(false);
                            setSearchTerm('');
                          }}
                        >
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs text-zinc-400">{model.provider}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-zinc-400">No models found</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Model details */}
            {currentModel && (
              <div className="mt-2 p-3 bg-zinc-900 rounded-lg text-xs text-zinc-400">
                <p><span className="text-zinc-500">Provider:</span> {currentModel.provider}</p>
                {currentModel.context_window && (
                  <p><span className="text-zinc-500">Context:</span> {currentModel.context_window} tokens</p>
                )}
                {currentModel.pricing && (
                  <p><span className="text-zinc-500">Pricing:</span> {currentModel.pricing}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-zinc-400 mb-3">SETTINGS</h2>
        <div className="space-y-2">
          <label className="flex items-center text-zinc-300 text-sm">
            <input
              type="checkbox"
              checked={useDocumentContext}
              onChange={toggleDocumentContext}
              className="mr-2 h-4 w-4 rounded border-zinc-700 text-blue-600 focus:ring-blue-600"
            />
            Use document context
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto">
        <button
          onClick={handleResetChat}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-sm"
        >
          Clear Conversation
        </button>
      </div>
    </aside>
  );
};

export default Sidebar; 