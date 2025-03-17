import { useState, useEffect, useCallback } from 'react';
import { getModels, Model } from '../services/chatService';

interface AppState {
  selectedModel: string;
  availableModels: Record<string, Model>;
  useDocumentContext: boolean;
  sessionId: string;
  currentTab: 'chat' | 'documents' | 'ab_testing' | 'metrics' | 'profiles' | 'todo';
  isLoading: boolean;
  error: string | null;
}

const generateSessionId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const useAppState = () => {
  const [state, setState] = useState<AppState>({
    selectedModel: 'google/gemini-2.0-pro-exp-02-05:free',
    availableModels: {},
    useDocumentContext: false,
    sessionId: generateSessionId(),
    currentTab: 'chat',
    isLoading: false,
    error: null,
  });

  // Load models on component mount
  useEffect(() => {
    const loadModels = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const models = await getModels();
        setState(prev => {
          // Ensure the selected model exists in the available models
          // If not, use the first available model
          const modelExists = prev.selectedModel in models;
          const firstModelId = Object.keys(models)[0] || prev.selectedModel;
          
          return { 
            ...prev, 
            selectedModel: modelExists ? prev.selectedModel : firstModelId,
            availableModels: models,
            isLoading: false 
          };
        });
      } catch (error) {
        console.error('Failed to load models:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to load available models',
          isLoading: false 
        }));
      }
    };

    loadModels();
  }, []);

  // Set selected model
  const setSelectedModel = useCallback((modelId: string) => {
    setState(prev => ({
      ...prev,
      selectedModel: modelId,
    }));
  }, []);

  // Toggle document context
  const toggleDocumentContext = useCallback(() => {
    setState(prev => ({
      ...prev,
      useDocumentContext: !prev.useDocumentContext,
    }));
  }, []);

  // Set current tab
  const setCurrentTab = useCallback((tab: AppState['currentTab']) => {
    setState(prev => ({
      ...prev,
      currentTab: tab,
    }));
  }, []);

  // Reset session
  const resetSession = useCallback(() => {
    setState(prev => ({
      ...prev,
      sessionId: generateSessionId(),
    }));
  }, []);

  // Refresh models
  const refreshModels = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const models = await getModels();
      setState(prev => {
        // Ensure the selected model exists in the available models
        const modelExists = prev.selectedModel in models;
        const firstModelId = Object.keys(models)[0] || prev.selectedModel;
        
        return { 
          ...prev, 
          selectedModel: modelExists ? prev.selectedModel : firstModelId,
          availableModels: models,
          isLoading: false 
        };
      });
    } catch (error) {
      console.error('Failed to refresh models:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to refresh models',
        isLoading: false 
      }));
    }
  }, []);

  return {
    selectedModel: state.selectedModel,
    availableModels: state.availableModels,
    useDocumentContext: state.useDocumentContext,
    sessionId: state.sessionId,
    currentTab: state.currentTab,
    isLoading: state.isLoading,
    error: state.error,
    setSelectedModel,
    toggleDocumentContext,
    setCurrentTab,
    resetSession,
    refreshModels,
  };
}; 