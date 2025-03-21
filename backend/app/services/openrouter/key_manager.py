from typing import Dict, List, Optional
import json
from datetime import datetime
import logging
from pathlib import Path

from app.models.openrouter import APIKeyResponse, APIKeyListResponse
from app.core.config import settings
from app.services.openrouter.client import openrouter_client

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
    
    def _validate_key_format(self, key: str) -> bool:
        """Validate the API key format"""
        return key.startswith('sk-or-') or key.startswith('sk-')
    
    def get_keys(self) -> APIKeyListResponse:
        """Get all stored API keys"""
        keys = self._read_keys()
        return APIKeyListResponse(keys=[APIKeyResponse(**k) for k in keys])
    
    def add_key(self, key: str) -> APIKeyResponse:
        """Add a new API key"""
        if not key or not isinstance(key, str):
            raise ValueError("Invalid API key")
            
        if not self._validate_key_format(key):
            raise ValueError("Invalid API key format. OpenRouter keys should start with 'sk-or-' or 'sk-'")
            
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
        
        # Update the active key in settings and client
        settings.OPENROUTER_API_KEY = key
        openrouter_client.api_key = key
        
        return APIKeyResponse(**key_data)
    
    def delete_key(self, key: str) -> bool:
        """Delete an API key"""
        if not key:
            return False
            
        keys = self._read_keys()
        
        # Find and remove the key
        initial_count = len(keys)
        keys = [k for k in keys if k["key"] != key]
        
        if len(keys) == initial_count:
            return False
        
        self._write_keys(keys)
        
        # If this was the active key, update settings and client
        if settings.OPENROUTER_API_KEY == key:
            settings.OPENROUTER_API_KEY = ""
            openrouter_client.api_key = None
        
        return True
    
    def get_active_key(self) -> Optional[str]:
        """Get the currently active API key"""
        active_key = settings.OPENROUTER_API_KEY
        
        if not active_key:
            # Try to get a key from storage if one exists
            keys = self._read_keys()
            if keys:
                logger.info(f"No active key in settings, using first key from storage")
                active_key = keys[0]["key"]
                # Update settings with this key
                settings.OPENROUTER_API_KEY = active_key
                
        if not active_key:
            logger.warning("No active OpenRouter API key found in settings or storage")
            return None
        
        # Log the key being used (safely)
        logger.info(f"Using active OpenRouter key: {active_key[:4]}...{active_key[-4:]}")
        return active_key
    
    def set_active_key(self, key: str) -> bool:
        """Set the active API key to use for OpenRouter calls"""
        if not key or not isinstance(key, str):
            logger.error("Invalid key provided to set_active_key")
            return False
        
        if not self._validate_key_format(key):
            logger.error(f"Invalid key format: {key[:4]}...")
            raise ValueError("Invalid API key format. OpenRouter keys should start with 'sk-or-' or 'sk-'")
        
        keys = self._read_keys()
        
        # Check if key exists
        if not any(k["key"] == key for k in keys):
            # Save key if it doesn't exist
            logger.info(f"Adding new key to storage: {key[:4]}...")
            self.add_key(key)
        else:
            logger.info(f"Using existing key: {key[:4]}...")
        
        # Update active key in settings and client
        logger.info(f"Setting active key: {key[:4]}...{key[-4:]}")
        settings.OPENROUTER_API_KEY = key
        openrouter_client.api_key = key
        
        return True


# Create a global key manager instance
key_manager = KeyManager() 