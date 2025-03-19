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
  private isRefreshingKey = false;
  private lastActiveKey: string | null = null;

  async getModels(): Promise<ModelsResponse> {
    try {
      const response = await api.get('/openrouter/models');
      return response.data;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  async createCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    try {
      // Check if we have an active key
      const activeKey = await this.getActiveKeyInternal();
      if (!activeKey) {
        throw new Error('No active API key. Please add an API key first.');
      }
      
      console.log(`Using model: ${request.model}`);
      
      const response = await api.post('/openrouter/chat/completions', request);
      return response.data;
    } catch (error: any) {
      // Check if this is an authentication error
      if (error.message && error.message.includes('No auth credentials found')) {
        console.warn('Authentication failed. Attempting to refresh API key...');
        
        // If we're not already refreshing, try to refresh the key
        if (!this.isRefreshingKey) {
          this.isRefreshingKey = true;
          try {
            // Get the active key again (force refresh)
            await this.refreshActiveKey();
            this.isRefreshingKey = false;
            
            // Retry the request
            console.log('Retrying request after key refresh...');
            const retryResponse = await api.post('/openrouter/chat/completions', request);
            return retryResponse.data;
          } catch (refreshError) {
            this.isRefreshingKey = false;
            console.error('Failed to refresh key:', refreshError);
            throw refreshError;
          }
        }
      }
      
      console.error('Error creating completion:', error);
      throw error;
    }
  }

  async listKeys(): Promise<APIKeyListResponse> {
    try {
      const response = await api.get('/openrouter/keys');
      return response.data;
    } catch (error) {
      console.error('Error listing keys:', error);
      throw error;
    }
  }

  async addKey(key: string): Promise<APIKey> {
    try {
      const response = await api.post('/openrouter/keys', { key });
      return response.data;
    } catch (error) {
      console.error('Error adding key:', error);
      throw error;
    }
  }

  async deleteKey(key: string): Promise<void> {
    try {
      await api.delete(`/openrouter/keys/${key}`);
    } catch (error) {
      console.error('Error deleting key:', error);
      throw error;
    }
  }

  async setActiveKey(key: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/openrouter/keys/active', { key });
      // Update our cached key
      this.lastActiveKey = key;
      return response.data;
    } catch (error) {
      console.error('Error setting active key:', error);
      throw error;
    }
  }

  async getActiveKey(): Promise<ActiveKeyInfo> {
    try {
      const response = await api.get('/openrouter/keys/active');
      // Cache the active status
      if (response.data.active && response.data.key) {
        const keyParts = response.data.key.split('...');
        if (keyParts.length === 2) {
          this.lastActiveKey = response.data.key;
        }
      }
      return response.data;
    } catch (error) {
      console.error('Error getting active key:', error);
      throw error;
    }
  }

  private async getActiveKeyInternal(): Promise<string | null> {
    try {
      const activeKeyInfo = await this.getActiveKey();
      return activeKeyInfo.active ? this.lastActiveKey : null;
    } catch (error) {
      console.error('Error getting active key internal:', error);
      return null;
    }
  }

  private async refreshActiveKey(): Promise<void> {
    try {
      // Reset the cached key
      this.lastActiveKey = null;
      // Force get the latest key
      await this.getActiveKey();
    } catch (error) {
      console.error('Error refreshing active key:', error);
      throw error;
    }
  }

  async getDiagnostic(): Promise<any> {
    try {
      const response = await api.get('/openrouter/diagnostic');
      return response.data;
    } catch (error) {
      console.error('Error getting diagnostic info:', error);
      throw error;
    }
  }
}

export const openRouterService = new OpenRouterService(); 