import os
import json
import uuid
from datetime import datetime
from typing import List, Dict, Optional, Any
import logging

from ..schemas.profile import (
    ChatbotProfile,
    ProfileUpdate,
    ProfileApiKey,
    ProfileApiKeyResponse
)

logger = logging.getLogger(__name__)

class ProfileService:
    """Service for managing chatbot profiles"""
    
    def __init__(self):
        """Initialize the profile service"""
        self.profiles_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "profiles")
        self.api_keys_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "api_keys")
        
        # Create directories if they don't exist
        os.makedirs(self.profiles_dir, exist_ok=True)
        os.makedirs(self.api_keys_dir, exist_ok=True)
        
        # Load profiles and API keys
        self._profiles = self._load_profiles()
        self._api_keys = self._load_api_keys()
    
    def _load_profiles(self) -> Dict[str, ChatbotProfile]:
        """Load profiles from disk"""
        profiles = {}
        
        try:
            # List all profile files
            for filename in os.listdir(self.profiles_dir):
                if filename.endswith(".json"):
                    profile_id = filename.replace(".json", "")
                    profile_path = os.path.join(self.profiles_dir, filename)
                    
                    try:
                        with open(profile_path, "r") as f:
                            profile_data = json.load(f)
                            
                            # Convert dates from strings to datetime objects
                            if "created_at" in profile_data and isinstance(profile_data["created_at"], str):
                                profile_data["created_at"] = datetime.fromisoformat(profile_data["created_at"])
                            if "updated_at" in profile_data and isinstance(profile_data["updated_at"], str):
                                profile_data["updated_at"] = datetime.fromisoformat(profile_data["updated_at"])
                            
                            profiles[profile_id] = ChatbotProfile(**profile_data)
                    except Exception as e:
                        logger.error(f"Error loading profile {profile_id}: {str(e)}")
        except Exception as e:
            logger.error(f"Error loading profiles: {str(e)}")
        
        return profiles
    
    def _save_profile(self, profile: ChatbotProfile) -> None:
        """Save a profile to disk"""
        try:
            profile_path = os.path.join(self.profiles_dir, f"{profile.id}.json")
            
            # Convert to dict and handle datetime serialization
            profile_dict = profile.dict()
            if isinstance(profile_dict["created_at"], datetime):
                profile_dict["created_at"] = profile_dict["created_at"].isoformat()
            if isinstance(profile_dict["updated_at"], datetime):
                profile_dict["updated_at"] = profile_dict["updated_at"].isoformat()
            
            with open(profile_path, "w") as f:
                json.dump(profile_dict, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving profile {profile.id}: {str(e)}")
            raise
    
    def _load_api_keys(self) -> Dict[str, Dict[str, Any]]:
        """Load API keys from disk"""
        api_keys = {}
        
        try:
            # Load API keys file if it exists
            api_keys_path = os.path.join(self.api_keys_dir, "api_keys.json")
            if os.path.exists(api_keys_path):
                with open(api_keys_path, "r") as f:
                    api_keys = json.load(f)
                    
                    # Convert dates from strings to datetime objects
                    for key, data in api_keys.items():
                        if "created_at" in data and isinstance(data["created_at"], str):
                            data["created_at"] = datetime.fromisoformat(data["created_at"])
                        if "expires_at" in data and data["expires_at"] and isinstance(data["expires_at"], str):
                            data["expires_at"] = datetime.fromisoformat(data["expires_at"])
                        if "last_used" in data and data["last_used"] and isinstance(data["last_used"], str):
                            data["last_used"] = datetime.fromisoformat(data["last_used"])
        except Exception as e:
            logger.error(f"Error loading API keys: {str(e)}")
        
        return api_keys
    
    def _save_api_keys(self) -> None:
        """Save API keys to disk"""
        try:
            api_keys_path = os.path.join(self.api_keys_dir, "api_keys.json")
            
            # Convert to dict and handle datetime serialization
            api_keys_dict = {}
            for key, data in self._api_keys.items():
                api_keys_dict[key] = data.copy()
                if "created_at" in api_keys_dict[key] and isinstance(api_keys_dict[key]["created_at"], datetime):
                    api_keys_dict[key]["created_at"] = api_keys_dict[key]["created_at"].isoformat()
                if "expires_at" in api_keys_dict[key] and api_keys_dict[key]["expires_at"] and isinstance(api_keys_dict[key]["expires_at"], datetime):
                    api_keys_dict[key]["expires_at"] = api_keys_dict[key]["expires_at"].isoformat()
                if "last_used" in api_keys_dict[key] and api_keys_dict[key]["last_used"] and isinstance(api_keys_dict[key]["last_used"], datetime):
                    api_keys_dict[key]["last_used"] = api_keys_dict[key]["last_used"].isoformat()
            
            with open(api_keys_path, "w") as f:
                json.dump(api_keys_dict, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving API keys: {str(e)}")
            raise
    
    def get_all_profiles(self) -> List[ChatbotProfile]:
        """Get all profiles"""
        return list(self._profiles.values())
    
    def get_profile(self, profile_id: str) -> Optional[ChatbotProfile]:
        """Get a profile by ID"""
        return self._profiles.get(profile_id)
    
    def create_profile(
        self, 
        name: str, 
        description: str, 
        model: str, 
        temperature: float,
        document_ids: List[str] = None,
        max_tokens: Optional[int] = None,
        system_prompt: Optional[str] = None
    ) -> ChatbotProfile:
        """Create a new profile"""
        profile_id = str(uuid.uuid4())
        now = datetime.now()
        
        profile = ChatbotProfile(
            id=profile_id,
            name=name,
            description=description,
            model=model,
            temperature=temperature,
            document_ids=document_ids or [],
            max_tokens=max_tokens,
            system_prompt=system_prompt,
            created_at=now,
            updated_at=now
        )
        
        # Add to collection
        self._profiles[profile_id] = profile
        
        # Save to disk
        self._save_profile(profile)
        
        return profile
    
    def update_profile(self, profile_id: str, profile_update: ProfileUpdate) -> ChatbotProfile:
        """Update a profile"""
        if profile_id not in self._profiles:
            raise ValueError(f"Profile with ID {profile_id} not found")
        
        # Get existing profile
        profile = self._profiles[profile_id]
        
        # Update fields
        update_data = profile_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)
        
        # Update timestamp
        profile.updated_at = datetime.now()
        
        # Save to disk
        self._save_profile(profile)
        
        return profile
    
    def delete_profile(self, profile_id: str) -> None:
        """Delete a profile"""
        if profile_id not in self._profiles:
            raise ValueError(f"Profile with ID {profile_id} not found")
        
        # Remove from collection
        del self._profiles[profile_id]
        
        # Remove from disk
        profile_path = os.path.join(self.profiles_dir, f"{profile_id}.json")
        if os.path.exists(profile_path):
            os.remove(profile_path)
        
        # Remove associated API keys
        keys_to_remove = []
        for key, data in self._api_keys.items():
            if data.get("profile_id") == profile_id:
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del self._api_keys[key]
        
        # Save API keys
        self._save_api_keys()
    
    def add_document_to_profile(self, profile_id: str, document_id: str) -> ChatbotProfile:
        """Add a document to a profile"""
        if profile_id not in self._profiles:
            raise ValueError(f"Profile with ID {profile_id} not found")
        
        # Get existing profile
        profile = self._profiles[profile_id]
        
        # Add document ID if not already present
        if document_id not in profile.document_ids:
            profile.document_ids.append(document_id)
            profile.updated_at = datetime.now()
            
            # Save to disk
            self._save_profile(profile)
        
        return profile
    
    def remove_document_from_profile(self, profile_id: str, document_id: str) -> ChatbotProfile:
        """Remove a document from a profile"""
        if profile_id not in self._profiles:
            raise ValueError(f"Profile with ID {profile_id} not found")
        
        # Get existing profile
        profile = self._profiles[profile_id]
        
        # Remove document ID if present
        if document_id in profile.document_ids:
            profile.document_ids.remove(document_id)
            profile.updated_at = datetime.now()
            
            # Save to disk
            self._save_profile(profile)
        
        return profile
    
    def add_api_key(
        self, 
        profile_id: str, 
        key_id: str,
        api_key: str, 
        name: str = "default",
        expires_at: Optional[datetime] = None
    ) -> None:
        """Add an API key for a profile"""
        if profile_id not in self._profiles:
            raise ValueError(f"Profile with ID {profile_id} not found")
        
        # Add API key
        self._api_keys[api_key] = {
            "id": key_id,
            "profile_id": profile_id,
            "name": name,
            "created_at": datetime.now(),
            "expires_at": expires_at,
            "last_used": None
        }
        
        # Save API keys
        self._save_api_keys()
    
    def get_api_keys(self, profile_id: str) -> List[ProfileApiKeyResponse]:
        """Get all API keys for a profile"""
        if profile_id not in self._profiles:
            raise ValueError(f"Profile with ID {profile_id} not found")
        
        # Get API keys for profile
        api_keys = []
        for key, data in self._api_keys.items():
            if data.get("profile_id") == profile_id:
                api_keys.append(
                    ProfileApiKeyResponse(
                        id=data.get("id"),
                        profile_id=profile_id,
                        key=key,
                        name=data.get("name", "default"),
                        created_at=data.get("created_at"),
                        expires_at=data.get("expires_at")
                    )
                )
        
        return api_keys
    
    def delete_api_key(self, profile_id: str, key_id: str) -> None:
        """Delete an API key"""
        if profile_id not in self._profiles:
            raise ValueError(f"Profile with ID {profile_id} not found")
        
        # Find API key by ID
        key_to_remove = None
        for key, data in self._api_keys.items():
            if data.get("id") == key_id and data.get("profile_id") == profile_id:
                key_to_remove = key
                break
        
        if key_to_remove:
            del self._api_keys[key_to_remove]
            
            # Save API keys
            self._save_api_keys()
        else:
            raise ValueError(f"API key with ID {key_id} not found for profile {profile_id}")
    
    def get_profile_id_by_api_key(self, api_key: str) -> Optional[str]:
        """Get a profile ID by API key"""
        if api_key in self._api_keys:
            return self._api_keys[api_key].get("profile_id")
        return None
    
    def update_api_key_last_used(self, api_key: str) -> None:
        """Update the last used timestamp for an API key"""
        if api_key in self._api_keys:
            self._api_keys[api_key]["last_used"] = datetime.now()
            self._save_api_keys() 