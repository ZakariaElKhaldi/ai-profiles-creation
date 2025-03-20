import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface APIKey {
  key: string;
  created_at: string;
}

export interface APIKeyList {
  keys: APIKey[];
}

export interface ActiveKeyInfo {
  active: boolean;
  key?: string;
  message?: string;
}

export class OpenRouterService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/openrouter`;
  }

  async listKeys(): Promise<APIKeyList> {
    const response = await axios.get<APIKeyList>(`${this.baseUrl}/keys`);
    return response.data;
  }

  async addKey(key: string): Promise<APIKey> {
    const response = await axios.post<APIKey>(`${this.baseUrl}/keys`, { key });
    return response.data;
  }

  async deleteKey(key: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/keys/${key}`);
  }

  async setActiveKey(key: string): Promise<{ message: string }> {
    const response = await axios.post<{ message: string }>(`${this.baseUrl}/keys/active`, { key });
    return response.data;
  }

  async getActiveKey(): Promise<ActiveKeyInfo> {
    const response = await axios.get<ActiveKeyInfo>(`${this.baseUrl}/keys/active`);
    return response.data;
  }

  async getModels(): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/models`);
    return response.data;
  }

  async createCompletion(request: any): Promise<any> {
    const response = await axios.post(`${this.baseUrl}/chat/completions`, request);
    return response.data;
  }
}

// Create a singleton instance
export const openRouterService = new OpenRouterService(); 