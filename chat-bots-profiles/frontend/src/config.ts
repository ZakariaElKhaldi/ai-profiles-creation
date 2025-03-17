// API configuration
export const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000' 
  : `${window.location.protocol}//${window.location.hostname}:8000`;

// Default settings
export const DEFAULT_MODEL = 'gpt-3.5-turbo';
export const DEFAULT_TEMPERATURE = 0.7;

// UI configuration
export const MAX_CHAT_HISTORY = 100;
export const MAX_TOKEN_COUNT = 4096;

// Feature flags
export const ENABLE_STREAMING = true;
export const ENABLE_DOCUMENT_UPLOAD = true;
export const ENABLE_PROFILE_API_KEYS = true; 