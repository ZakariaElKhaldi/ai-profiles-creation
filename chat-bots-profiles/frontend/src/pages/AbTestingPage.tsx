import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

interface ModelResponse {
  modelId: string;
  response: string;
  responseTime: number;
}

export default function AbTestingPage() {
  const { availableModels } = useApp();
  
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [results, setResults] = useState<ModelResponse[]>([]);
  
  // Get all available models for selection
  const allModels = Object.entries(availableModels).map(([id, model]) => ({
    id,
    name: model.name,
    provider: model.provider
  }));

  const handleModelSelection = (modelId: string) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      } else {
        return [...prev, modelId];
      }
    });
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || selectedModels.length === 0) return;
    
    setIsLoading(true);
    setResults([]);
    
    // Mock responses for demonstration purposes
    // In a real app, this would call the API for each selected model
    const mockResponses = await Promise.all(
      selectedModels.map(async (modelId) => {
        const startTime = Date.now();
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        return {
          modelId,
          response: `This is a sample response from ${availableModels[modelId]?.name} to the prompt: "${prompt}". In a real implementation, this would call the API endpoint for each model.`,
          responseTime: Date.now() - startTime
        };
      })
    );
    
    setResults(mockResponses);
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto py-4">
      <h1 className="text-3xl font-bold mb-6">A/B Testing</h1>
      <p className="text-gray-400 mb-8">
        Compare responses from different models to the same prompt.
      </p>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Select Models to Compare</h2>
        <div className="bg-zinc-900 p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {allModels.map(model => (
              <div 
                key={model.id}
                className={`p-3 rounded-lg cursor-pointer border ${
                  selectedModels.includes(model.id) 
                    ? 'bg-blue-600 border-blue-400' 
                    : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
                }`}
                onClick={() => handleModelSelection(model.id)}
              >
                <div className="font-medium">{model.name}</div>
                <div className="text-xs text-zinc-400">{model.provider}</div>
              </div>
            ))}
          </div>
          
          {selectedModels.length > 0 && (
            <div className="mt-4 text-sm text-zinc-400">
              Selected {selectedModels.length} model(s)
            </div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Enter Prompt</h2>
        <div className="bg-zinc-900 p-4 rounded-lg">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your prompt to test across models..."
          ></textarea>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isLoading || !prompt.trim() || selectedModels.length === 0}
              className={`px-4 py-2 rounded-lg ${
                isLoading || !prompt.trim() || selectedModels.length === 0
                  ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Generating...' : 'Compare Models'}
            </button>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          <div className="space-y-6">
            {results.map((result) => {
              const model = availableModels[result.modelId];
              return (
                <div key={result.modelId} className="bg-zinc-900 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium">
                      {model?.name} <span className="text-sm text-zinc-400">({model?.provider})</span>
                    </h3>
                    <span className="text-sm text-zinc-400">
                      Response time: {(result.responseTime / 1000).toFixed(2)}s
                    </span>
                  </div>
                  <div className="bg-zinc-800 p-4 rounded-lg whitespace-pre-wrap">
                    {result.response}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 