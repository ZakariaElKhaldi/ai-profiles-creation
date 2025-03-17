import React, { createContext, useContext, ReactNode } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Model } from '../services/chatService';

// Define context type
interface AppContextType {
  selectedModel: string;
  availableModels: Record<string, Model>;
  useDocumentContext: boolean;
  sessionId: string;
  currentTab: 'chat' | 'documents' | 'ab_testing' | 'metrics' | 'profiles' | 'todo';
  isLoading: boolean;
  error: string | null;
  setSelectedModel: (modelId: string) => void;
  toggleDocumentContext: () => void;
  setCurrentTab: (tab: 'chat' | 'documents' | 'ab_testing' | 'metrics' | 'profiles' | 'todo') => void;
  resetSession: () => void;
  refreshModels: () => Promise<void>;
}

// Create context with default values
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    selectedModel,
    availableModels,
    useDocumentContext,
    sessionId,
    currentTab,
    isLoading,
    error,
    setSelectedModel,
    toggleDocumentContext,
    setCurrentTab,
    resetSession,
    refreshModels,
  } = useAppState();

  const value = {
    selectedModel,
    availableModels,
    useDocumentContext,
    sessionId,
    currentTab,
    isLoading,
    error,
    setSelectedModel,
    toggleDocumentContext,
    setCurrentTab,
    resetSession,
    refreshModels,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the app context
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  
  return context;
}; 