import { api } from './config';

export interface Profile {
  id: string;
  name: string;
  description?: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  updated_at: string;
  query_count: number;
  document_ids: string[];
}

export interface ProfileCreate {
  name: string;
  description?: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
}

export interface ProfileUpdate {
  name?: string;
  description?: string;
  system_prompt?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  status?: 'draft' | 'active' | 'archived';
}

export interface ProfileStats {
  total_queries: number;
  total_tokens: number;
  average_response_time: number;
  documents_count: number;
  last_used?: string;
}

export interface ProfileWithStats extends Profile {
  stats: ProfileStats;
}

export interface ProfileList {
  total: number;
  profiles: Profile[];
}

export interface APIKey {
  id: string;
  name: string;
  description?: string;
  key: string;
  profile_id: string;
  created_at: string;
  last_used?: string;
  usage_count: number;
}

export interface APIKeyCreate {
  name: string;
  description?: string;
  profile_id: string;
}

export interface APIKeyList {
  total: number;
  keys: APIKey[];
}

export interface TrainingData {
  input: string;
  output: string;
}

class ProfileService {
  async listProfiles(): Promise<ProfileList> {
    const response = await api.get('/profiles');
    return response.data;
  }

  async getProfile(id: string): Promise<Profile> {
    const response = await api.get(`/profiles/${id}`);
    return response.data;
  }

  async getProfileWithStats(id: string): Promise<ProfileWithStats> {
    const response = await api.get(`/profiles/${id}/stats`);
    return response.data;
  }

  async createProfile(data: ProfileCreate): Promise<Profile> {
    const response = await api.post('/profiles', data);
    return response.data;
  }

  async updateProfile(id: string, data: ProfileUpdate): Promise<Profile> {
    const response = await api.put(`/profiles/${id}`, data);
    return response.data;
  }

  async deleteProfile(id: string): Promise<void> {
    await api.delete(`/profiles/${id}`);
  }

  async activateProfile(id: string): Promise<void> {
    await api.post(`/profiles/${id}/activate`);
  }

  async archiveProfile(id: string): Promise<void> {
    await api.post(`/profiles/${id}/archive`);
  }

  // API Key methods
  async getAPIKeys(profileId: string): Promise<APIKeyList> {
    const response = await api.get(`/profiles/${profileId}/keys`);
    return response.data;
  }

  async createAPIKey(profileId: string, data: APIKeyCreate): Promise<APIKey> {
    const response = await api.post(`/profiles/${profileId}/keys`, data);
    return response.data;
  }

  async deleteAPIKey(profileId: string, keyId: string): Promise<void> {
    await api.delete(`/profiles/${profileId}/keys/${keyId}`);
  }

  async verifyAPIKey(key: string): Promise<{ profile_id: string }> {
    const response = await api.post('/profiles/verify-key', { api_key: key });
    return response.data;
  }

  // Training methods
  async trainProfile(profileId: string, trainingData: TrainingData[]): Promise<void> {
    await api.post(`/profiles/${profileId}/train`, trainingData);
  }

  // External query
  async queryProfileExternal(query: string, apiKey: string, context?: string): Promise<any> {
    const response = await api.post('/profiles/external/query', 
      { query, context }, 
      { headers: { 'api-key': apiKey } }
    );
    return response.data;
  }
}

export const profileService = new ProfileService(); 