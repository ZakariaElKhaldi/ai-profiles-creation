import { api } from './config';

export interface Message {
  role: string;
  content: string;
}

export interface CompletionRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  stop?: string | string[];
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface Choice {
  index: number;
  message: Message;
  finish_reason?: string;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface CompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage: Usage;
}

export interface AvailableModel {
  id: string;
  name: string;
  description?: string;
  pricing?: Record<string, any>;
  context_length?: number;
  top_provider?: string;
}

export interface ModelsResponse {
  data: AvailableModel[];
}

export interface APIKey {
  key: string;
  created_at: string;
}

export interface APIKeyListResponse {
  keys: APIKey[];
}

export interface ActiveKeyInfo {
  active: boolean;
  key?: string;
  message?: string;
}

class OpenRouterService {
  async getModels(): Promise<ModelsResponse> {
    const response = await api.get('/openrouter/models');
    return response.data;
  }

  async createCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const response = await api.post('/openrouter/chat/completions', request);
    return response.data;
  }

  async listKeys(): Promise<APIKeyListResponse> {
    const response = await api.get('/openrouter/keys');
    return response.data;
  }

  async addKey(key: string): Promise<APIKey> {
    const response = await api.post('/openrouter/keys', { key });
    return response.data;
  }

  async deleteKey(key: string): Promise<void> {
    await api.delete(`/openrouter/keys/${key}`);
  }

  async setActiveKey(key: string): Promise<{ message: string }> {
    const response = await api.post('/openrouter/keys/active', { key });
    return response.data;
  }

  async getActiveKey(): Promise<ActiveKeyInfo> {
    const response = await api.get('/openrouter/keys/active');
    return response.data;
  }
}

export const openRouterService = new OpenRouterService(); 