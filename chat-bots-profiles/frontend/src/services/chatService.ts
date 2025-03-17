import apiClient from './api';

// Types
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  messages: Message[];
  max_tokens?: number;
  temperature?: number;
  model?: string;
  use_document_context?: boolean;
  session_id?: string;
}

export interface ChatResponse {
  message: Message;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  response_time?: number;
  model_used?: string;
  token_count?: number;
}

export interface ModelCategory {
  id: string;
  name: string;
  description?: string;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  category: string;
  description?: string;
  context_window?: number;
  pricing?: string;
}

// API functions
export const sendChatRequest = async (request: ChatRequest): Promise<ChatResponse> => {
  const response = await apiClient.post('/chat', request);
  return response.data;
};

export const getModels = async (): Promise<Record<string, Model>> => {
  const response = await apiClient.get('/models');
  return response.data;
};

export const getModelCategories = async (): Promise<string[]> => {
  const response = await apiClient.get('/models/categories');
  return response.data;
};

export const getModelsByCategory = async (category: string): Promise<Record<string, Model>> => {
  const response = await apiClient.get(`/models/category/${category}`);
  return response.data;
};

export const getModelDetails = async (modelId: string): Promise<Model> => {
  const response = await apiClient.get(`/models/${modelId}`);
  return response.data;
};

export const refreshModels = async (): Promise<Record<string, Model>> => {
  const response = await apiClient.get('/models/refresh');
  return response.data;
};

// Document management for chat context
export interface DocumentInfo {
  id: string;
  filename: string;
  timestamp: number;
  chunk_count: number;
}

export const uploadDocument = async (file: File): Promise<DocumentInfo> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post('/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const getDocuments = async (): Promise<DocumentInfo[]> => {
  const response = await apiClient.get('/documents');
  return response.data;
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  await apiClient.delete(`/documents/${documentId}`);
}; 