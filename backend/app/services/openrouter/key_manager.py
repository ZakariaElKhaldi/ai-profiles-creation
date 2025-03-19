import json
import os
from typing import List, Dict, Optional
from datetime import datetime
import logging
from pathlib import Path

from backend.app.models.openrouter import APIKeyResponse, APIKeyListResponse
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Define the path for storing API keys
KEYS_FILE = Path("backend/data/openrouter_keys.json")


class KeyManager:
    """Manager for OpenRouter API keys"""
    
    def __init__(self, keys_file: Optional[Path] = None):
        self.keys_file = keys_file or KEYS_FILE
        self._ensure_data_dir()
    
    def _ensure_data_dir(self):
        """Ensure the data directory exists"""
        self.keys_file.parent.mkdir(parents=True, exist_ok=True)
        
        if not self.keys_file.exists():
            with open(self.keys_file, "w") as f:
                json.dump({"keys": []}, f)
    
    def _read_keys(self) -> List[Dict]:
        """Read keys from the storage file"""
        try:
            with open(self.keys_file, "r") as f:
                data = json.load(f)
                return data.get("keys", [])
        except (FileNotFoundError, json.JSONDecodeError):
            logger.error(f"Error reading keys file {self.keys_file}")
            return []
    
    def _write_keys(self, keys: List[Dict]):
        """Write keys to the storage file"""
        try:
            with open(self.keys_file, "w") as f:
                json.dump({"keys": keys}, f, indent=2)
        except Exception as e:
            logger.error(f"Error writing keys file: {str(e)}")
            raise
    
    def get_keys(self) -> APIKeyListResponse:
        """Get all stored API keys"""
        keys = self._read_keys()
        return APIKeyListResponse(keys=[APIKeyResponse(**k) for k in keys])
    
    def add_key(self, key: str) -> APIKeyResponse:
        """Add a new API key"""
        keys = self._read_keys()
        
        # Check if key already exists
        if any(k["key"] == key for k in keys):
            raise ValueError("Key already exists")
        
        # Create new key entry
        key_data = {
            "key": key,
            "created_at": datetime.now().isoformat()
        }
        
        keys.append(key_data)
        self._write_keys(keys)
        
        # Update the active key in settings
        settings.OPENROUTER_API_KEY = key
        
        return APIKeyResponse(**key_data)
    
    def delete_key(self, key: str) -> bool:
        """Delete an API key"""
        keys = self._read_keys()
        
        # Find and remove the key
        initial_count = len(keys)
        keys = [k for k in keys if k["key"] != key]
        
        if len(keys) == initial_count:
            return False
        
        self._write_keys(keys)
        
        # If this was the active key, update settings
        if settings.OPENROUTER_API_KEY == key:
            settings.OPENROUTER_API_KEY = ""
        
        return True
    
    def get_active_key(self) -> Optional[str]:
        """Get the currently active API key"""
        return settings.OPENROUTER_API_KEY
    
    def set_active_key(self, key: str) -> bool:
        """Set the active API key to use for OpenRouter calls"""
        keys = self._read_keys()
        
        # Check if key exists
        if not any(k["key"] == key for k in keys):
            # Save key if it doesn't exist
            self.add_key(key)
        
        # Update active key
        settings.OPENROUTER_API_KEY = key
        return True


# Create a global key manager instance
key_manager = KeyManager() 