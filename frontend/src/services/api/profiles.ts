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

class ProfileService {
  async listProfiles(): Promise<ProfileList> {
    const response = await api.get('/profiles');
    return response.data;
  }

  async getProfile(id: string): Promise<ProfileWithStats> {
    const response = await api.get(`/profiles/${id}`);
    return response.data;
  }

  async createProfile(data: ProfileCreate): Promise<Profile> {
    const response = await api.post('/profiles', data);
    return response.data;
  }

  async updateProfile(id: string, data: ProfileUpdate): Promise<Profile> {
    const response = await api.patch(`/profiles/${id}`, data);
    return response.data;
  }

  async deleteProfile(id: string): Promise<void> {
    await api.delete(`/profiles/${id}`);
  }

  async getProfileStats(id: string): Promise<ProfileStats> {
    const response = await api.get(`/profiles/${id}/stats`);
    return response.data;
  }
}

export const profileService = new ProfileService(); 