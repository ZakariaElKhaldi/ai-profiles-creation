import apiClient from './api';

// Types
export interface ProfileSettings {
  document_limit?: number;
  token_limit?: number;
  response_time_limit?: number;
}

export interface ProfileUsageStats {
  document_count?: number;
  last_document_update?: string;
  token_usage?: number;
  avg_response_time?: number;
}

export interface ChatbotProfile {
  id: string;
  name: string;
  description: string;
  model: string;
  temperature: number;
  created_at: string;
  updated_at?: string;
  training_data_count?: number;
  document_ids: string[];
  settings: ProfileSettings;
  usage_stats: ProfileUsageStats;
  personality_traits: string[];
  example_messages: string[];
  avatar_url?: string;
}

export interface CreateProfileRequest {
  name: string;
  personality_traits: string[];
  description?: string;
  model: string;
  temperature: number;
  example_messages?: string[];
  avatar_url?: string;
  settings?: ProfileSettings;
  document_ids?: string[];
}

export interface ApiKeyResponse {
  profile_id: string;
  api_key: string;
}

export interface TrainingDataResponse {
  id: string;
  profile_id: string;
  filename: string;
  uploaded_at: string;
  size: number;
  status: 'processing' | 'processed' | 'failed';
}

export interface ProfileDocumentResponse {
  profile_id: string;
  document_ids: string[];
  message: string;
}

// API functions
export const fetchProfiles = async (): Promise<ChatbotProfile[]> => {
  const response = await apiClient.get('/profiles');
  return response.data;
};

export const fetchProfile = async (id: string): Promise<ChatbotProfile> => {
  const response = await apiClient.get(`/profiles/${id}`);
  return response.data;
};

export const createProfile = async (data: CreateProfileRequest): Promise<ChatbotProfile> => {
  const response = await apiClient.post('/profiles', data);
  return response.data;
};

export const updateProfile = async (id: string, data: Partial<CreateProfileRequest>): Promise<ChatbotProfile> => {
  const response = await apiClient.put(`/profiles/${id}`, data);
  return response.data;
};

export const deleteProfile = async (id: string): Promise<void> => {
  await apiClient.delete(`/profiles/${id}`);
};

// API key management
export const generateApiKey = async (profileId: string): Promise<ApiKeyResponse> => {
  const response = await apiClient.post(`/profiles/${profileId}/api-key`);
  return response.data;
};

export const revokeApiKey = async (profileId: string): Promise<void> => {
  await apiClient.delete(`/profiles/${profileId}/api-key`);
};

// Training data management
export const uploadTrainingData = async (profileId: string, file: File): Promise<TrainingDataResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post(`/profiles/${profileId}/training-data`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const fetchTrainingData = async (profileId: string): Promise<TrainingDataResponse[]> => {
  const response = await apiClient.get(`/profiles/${profileId}/training-data`);
  return response.data;
};

export const deleteTrainingData = async (profileId: string, dataId: string): Promise<void> => {
  await apiClient.delete(`/profiles/${profileId}/training-data/${dataId}`);
};

// Test chatbot
export const testChatbot = async (profileId: string, message: string): Promise<{ response: string }> => {
  const response = await apiClient.post(`/profiles/${profileId}/test`, { message });
  return response.data;
};

export const addDocumentsToProfile = async (profileId: string, documentIds: string[]): Promise<ProfileDocumentResponse> => {
  const response = await apiClient.post(`/profiles/${profileId}/documents`, { document_ids: documentIds });
  return response.data;
};

export const getProfileDocuments = async (profileId: string): Promise<ProfileDocumentResponse> => {
  const response = await apiClient.get(`/profiles/${profileId}/documents`);
  return response.data;
};

export const removeDocumentFromProfile = async (profileId: string, documentId: string): Promise<ProfileDocumentResponse> => {
  const response = await apiClient.delete(`/profiles/${profileId}/documents/${documentId}`);
  return response.data;
}; 