import json
import uuid
from typing import List, Dict, Optional, Any
from datetime import datetime
import logging
from pathlib import Path
import os

from app.models.profiles import (
    ProfileCreate,
    ProfileUpdate,
    Profile,
    ProfileInDB,
    ProfileStatus,
    ProfileList,
    ProfileStats,
    ProfileWithStats,
    APIKeyList,
    APIKey,
    APIKeyCreate
)
from app.core.config import settings

logger = logging.getLogger(__name__)

# Custom JSON encoder to handle datetime objects
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# Define the path for storing profile data
BASE_DIR = Path(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
PROFILES_DIR = BASE_DIR / "data" / "profiles"
PROFILES_DB = PROFILES_DIR / "profiles.json"
PROFILE_STATS_DB = PROFILES_DIR / "profile_stats.json"

# Log the resolved paths
logger.info(f"BASE_DIR: {BASE_DIR}")
logger.info(f"PROFILES_DIR: {PROFILES_DIR}")
logger.info(f"PROFILES_DB: {PROFILES_DB}")

class ProfileService:
    """Service for AI profile management operations"""
    
    def __init__(
        self,
        profiles_dir: Optional[Path] = None,
        profiles_db: Optional[Path] = None,
        profile_stats_db: Optional[Path] = None
    ):
        self.profiles_dir = profiles_dir or PROFILES_DIR
        self.profiles_db = profiles_db or PROFILES_DB
        self.profile_stats_db = profile_stats_db or PROFILE_STATS_DB
        self._ensure_dirs()
    
    def _ensure_dirs(self):
        """Ensure the profile directories exist"""
        try:
            # Create profiles directory
            self.profiles_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"Ensured profiles directory exists: {self.profiles_dir}")
            
            if not self.profiles_db.exists():
                with open(self.profiles_db, "w") as f:
                    json.dump({"profiles": []}, f)
                logger.info(f"Created profiles database file: {self.profiles_db}")
            
            if not self.profile_stats_db.exists():
                with open(self.profile_stats_db, "w") as f:
                    json.dump({"profile_stats": {}}, f)
                logger.info(f"Created profile stats database file: {self.profile_stats_db}")
        except Exception as e:
            logger.error(f"Error ensuring directories and files exist: {str(e)}")
            # Re-raise to ensure application can detect the startup issue
            raise
    
    def _read_profiles(self) -> List[Dict]:
        """Read profiles from the storage file"""
        try:
            with open(self.profiles_db, "r") as f:
                data = json.load(f)
                return data.get("profiles", [])
        except (FileNotFoundError, json.JSONDecodeError):
            logger.error(f"Error reading profiles file {self.profiles_db}")
            return []
    
    def _write_profiles(self, profiles: List[Dict]):
        """Write profiles to the storage file"""
        try:
            with open(self.profiles_db, "w") as f:
                json.dump({"profiles": profiles}, f, indent=2, cls=DateTimeEncoder)
        except Exception as e:
            logger.error(f"Error writing profiles file: {str(e)}")
            raise
    
    def _read_profile_stats(self) -> Dict[str, Dict]:
        """Read profile stats from the storage file"""
        try:
            with open(self.profile_stats_db, "r") as f:
                data = json.load(f)
                return data.get("profile_stats", {})
        except (FileNotFoundError, json.JSONDecodeError):
            logger.error(f"Error reading profile stats file {self.profile_stats_db}")
            return {}
    
    def _write_profile_stats(self, profile_stats: Dict[str, Dict]):
        """Write profile stats to the storage file"""
        try:
            with open(self.profile_stats_db, "w") as f:
                json.dump({"profile_stats": profile_stats}, f, indent=2, cls=DateTimeEncoder)
        except Exception as e:
            logger.error(f"Error writing profile stats file: {str(e)}")
            raise
    
    def get_profile(self, profile_id: str) -> Optional[Profile]:
        """Get a profile by ID"""
        profiles = self._read_profiles()
        for profile in profiles:
            if profile["id"] == profile_id:
                return Profile(**profile)
        return None
    
    def get_profiles(
        self,
        user_id: Optional[str] = None,
        status: Optional[ProfileStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> ProfileList:
        """Get a list of profiles, optionally filtered"""
        profiles = self._read_profiles()
        
        # Apply filters
        if user_id:
            profiles = [p for p in profiles if p.get("user_id") == user_id]
        
        if status:
            profiles = [p for p in profiles if p.get("status") == status]
        
        total = len(profiles)
        profiles = profiles[skip:skip + limit]
        
        return ProfileList(
            total=total,
            profiles=[Profile(**profile) for profile in profiles]
        )
    
    def create_profile(self, profile_create: ProfileCreate, user_id: Optional[str] = None) -> Profile:
        """Create a new AI profile"""
        try:
            # Check profile limit per user
            if user_id:
                user_profiles = [p for p in self._read_profiles() if p.get("user_id") == user_id]
                if len(user_profiles) >= settings.MAX_PROFILES_PER_USER:
                    raise ValueError(
                        f"Maximum number of profiles ({settings.MAX_PROFILES_PER_USER}) reached for this user"
                    )
            
            # Create profile record
            profile_data = profile_create.dict()
            profile_id = str(uuid.uuid4())
            
            # Create timestamps as strings directly to avoid serialization issues
            current_time = datetime.now().isoformat()
            
            profile = ProfileInDB(
                id=profile_id,
                user_id=user_id,
                **profile_data,
                created_at=current_time,
                updated_at=current_time,
                status=ProfileStatus.DRAFT
            )
            
            logger.info(f"Creating new profile with ID: {profile_id}")
            
            # Save to database
            profiles = self._read_profiles()
            profile_dict = profile.dict()
            profiles.append(profile_dict)
            
            logger.debug(f"Writing profile to database: {profile_dict}")
            self._write_profiles(profiles)
            
            # Initialize profile stats
            profile_stats = self._read_profile_stats()
            profile_stats[profile.id] = ProfileStats().dict()
            self._write_profile_stats(profile_stats)
            
            logger.info(f"Successfully created profile: {profile_id}")
            return Profile(**profile.dict())
        except Exception as e:
            logger.error(f"Error creating profile: {str(e)}")
            raise
    
    def update_profile(self, profile_id: str, profile_update: ProfileUpdate) -> Optional[Profile]:
        """Update profile information"""
        profiles = self._read_profiles()
        
        for i, profile in enumerate(profiles):
            if profile["id"] == profile_id:
                # Update profile fields
                update_data = {k: v for k, v in profile_update.dict().items() 
                              if v is not None}
                
                if update_data:
                    for field, value in update_data.items():
                        profile[field] = value
                    
                    # Update the updated_at timestamp as isoformat string
                    profile["updated_at"] = datetime.now().isoformat()
                    
                    # Update the profiles list
                    profiles[i] = profile
                    self._write_profiles(profiles)
                
                return Profile(**profile)
        
        return None
    
    def delete_profile(self, profile_id: str) -> bool:
        """Delete a profile"""
        profiles = self._read_profiles()
        
        for i, profile in enumerate(profiles):
            if profile["id"] == profile_id:
                # Remove from the list
                profiles.pop(i)
                self._write_profiles(profiles)
                
                # Remove profile stats
                profile_stats = self._read_profile_stats()
                if profile_id in profile_stats:
                    del profile_stats[profile_id]
                    self._write_profile_stats(profile_stats)
                
                return True
        
        return False
    
    def get_profile_with_stats(self, profile_id: str) -> Optional[ProfileWithStats]:
        """Get a profile with its usage statistics"""
        profile = self.get_profile(profile_id)
        
        if not profile:
            return None
        
        profile_stats = self._read_profile_stats()
        stats = profile_stats.get(profile_id, {})
        
        return ProfileWithStats(
            **profile.dict(),
            stats=ProfileStats(**stats) if stats else ProfileStats()
        )
    
    def update_profile_stats(
        self, 
        profile_id: str, 
        add_query: bool = False,
        add_tokens: int = 0,
        response_time: Optional[float] = None
    ) -> Optional[ProfileWithStats]:
        """Update profile usage statistics"""
        profile = self.get_profile_with_stats(profile_id)
        if not profile:
            return None
        
        # Create new stats object
        stats = profile.stats
        
        # Update stats
        if add_query:
            profile.query_count += 1
            stats.total_queries += 1
            stats.last_used = datetime.now()
        
        if add_tokens > 0:
            stats.total_tokens += add_tokens
        
        if response_time is not None:
            # Update average response time
            current_avg = stats.average_response_time
            current_queries = stats.total_queries
            
            if current_queries > 1:
                # Weighted average
                stats.average_response_time = ((current_avg * (current_queries - 1)) + response_time) / current_queries
            else:
                stats.average_response_time = response_time
        
        # Update document count
        stats.documents_count = len(profile.document_ids)
        
        # Save updated profile
        return self._update_profile_with_stats(profile)
    
    def _update_profile_with_stats(self, profile: ProfileWithStats) -> ProfileWithStats:
        """Update a profile with its statistics in storage"""
        # Update profile record
        profiles = self._read_profiles()
        profile_updated = False
        
        for i, p in enumerate(profiles):
            if p["id"] == profile.id:
                # Update query count
                p["query_count"] = profile.query_count
                p["updated_at"] = datetime.now().isoformat()
                profiles[i] = p
                profile_updated = True
                break
        
        if profile_updated:
            self._write_profiles(profiles)
        
        # Update profile stats
        profile_stats = self._read_profile_stats()
        profile_stats[profile.id] = profile.stats.dict()
        self._write_profile_stats(profile_stats)
        
        return profile
    
    def get_api_keys(self, profile_id: Optional[str] = None) -> APIKeyList:
        """Get a list of API keys, optionally filtered by profile"""
        api_keys = self._read_api_keys()
        
        # Filter by profile if requested
        if profile_id:
            api_keys = [k for k in api_keys if k.get("profile_id") == profile_id]
        
        # Return list
        return APIKeyList(
            total=len(api_keys),
            keys=[APIKey(**k) for k in api_keys]
        )
    
    def get_api_key(self, key_id: str) -> Optional[APIKey]:
        """Get an API key by ID"""
        api_keys = self._read_api_keys()
        for key in api_keys:
            if key.get("id") == key_id:
                return APIKey(**key)
        return None
    
    def get_api_key_by_value(self, key_value: str) -> Optional[APIKey]:
        """Get an API key by its value"""
        api_keys = self._read_api_keys()
        for key in api_keys:
            if key.get("key") == key_value:
                return APIKey(**key)
        return None
    
    def create_api_key(self, api_key_create: APIKeyCreate) -> APIKey:
        """Create a new API key for a profile"""
        # Validate profile exists
        profile = self.get_profile(api_key_create.profile_id)
        if not profile:
            raise ValueError(f"Profile with ID {api_key_create.profile_id} not found")
        
        # Create API key
        api_key = APIKey(
            name=api_key_create.name,
            description=api_key_create.description,
            profile_id=api_key_create.profile_id,
        )
        
        # Add to database
        api_keys = self._read_api_keys()
        api_keys.append(api_key.model_dump())
        self._write_api_keys(api_keys)
        
        return api_key
    
    def delete_api_key(self, key_id: str) -> bool:
        """Delete an API key"""
        api_keys = self._read_api_keys()
        initial_count = len(api_keys)
        
        api_keys = [k for k in api_keys if k.get("id") != key_id]
        
        if len(api_keys) < initial_count:
            self._write_api_keys(api_keys)
            return True
        
        return False
    
    def update_api_key_usage(self, key_id: str) -> Optional[APIKey]:
        """Update API key usage statistics"""
        api_keys = self._read_api_keys()
        
        for i, key in enumerate(api_keys):
            if key.get("id") == key_id:
                # Update usage stats
                key["usage_count"] = key.get("usage_count", 0) + 1
                key["last_used"] = datetime.now().isoformat()
                
                # Update database
                api_keys[i] = key
                self._write_api_keys(api_keys)
                
                return APIKey(**key)
        
        return None
    
    def verify_api_key(self, key_value: str) -> Optional[str]:
        """Verify an API key and return the associated profile ID if valid"""
        api_key = self.get_api_key_by_value(key_value)
        
        if not api_key:
            return None
        
        # Update usage statistics
        self.update_api_key_usage(api_key.id)
        
        # Return the profile ID
        return api_key.profile_id
    
    def _read_api_keys(self) -> List[Dict]:
        """Read API keys from storage"""
        api_keys_path = self.profiles_dir / "api_keys.json"
        
        # Create file if it doesn't exist
        if not api_keys_path.exists():
            with open(api_keys_path, "w") as f:
                json.dump({"keys": []}, f)
        
        # Read keys
        try:
            with open(api_keys_path, "r") as f:
                data = json.load(f)
                return data.get("keys", [])
        except (FileNotFoundError, json.JSONDecodeError):
            logger.error(f"Error reading API keys file {api_keys_path}")
            return []
    
    def _write_api_keys(self, keys: List[Dict]):
        """Write API keys to storage"""
        api_keys_path = self.profiles_dir / "api_keys.json"
        
        try:
            with open(api_keys_path, "w") as f:
                json.dump({"keys": keys}, f, indent=2, cls=DateTimeEncoder)
        except Exception as e:
            logger.error(f"Error writing API keys file: {str(e)}")
            raise


# Create a global profile service instance
profile_service = ProfileService() 