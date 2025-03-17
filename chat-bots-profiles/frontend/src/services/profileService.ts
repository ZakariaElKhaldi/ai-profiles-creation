import apiClient from './api';

// Types
export interface ChatbotProfile {
  id: string;
  name: string;
  description: string;
  model: string;
  temperature: number;
  created_at: string;
  updated_at?: string;
  training_data_count?: number;
}

export interface CreateProfileRequest {
  name: string;
  description: string;
  model: string;
  temperature: number;
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