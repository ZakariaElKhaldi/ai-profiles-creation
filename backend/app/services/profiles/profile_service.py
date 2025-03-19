import json
import uuid
from typing import List, Dict, Optional, Any
from datetime import datetime
import logging
from pathlib import Path

from backend.app.models.profiles import (
    ProfileCreate,
    ProfileUpdate,
    Profile,
    ProfileInDB,
    ProfileStatus,
    ProfileList,
    ProfileStats,
    ProfileWithStats
)
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Define the path for storing profile data
PROFILES_DIR = Path("backend/data/profiles")
PROFILES_DB = PROFILES_DIR / "profiles.json"
PROFILE_STATS_DB = PROFILES_DIR / "profile_stats.json"


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
        self.profiles_dir.mkdir(parents=True, exist_ok=True)
        
        if not self.profiles_db.exists():
            with open(self.profiles_db, "w") as f:
                json.dump({"profiles": []}, f)
        
        if not self.profile_stats_db.exists():
            with open(self.profile_stats_db, "w") as f:
                json.dump({"profile_stats": {}}, f)
    
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
                json.dump({"profiles": profiles}, f, indent=2)
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
                json.dump({"profile_stats": profile_stats}, f, indent=2)
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
        # Check profile limit per user
        if user_id:
            user_profiles = [p for p in self._read_profiles() if p.get("user_id") == user_id]
            if len(user_profiles) >= settings.MAX_PROFILES_PER_USER:
                raise ValueError(
                    f"Maximum number of profiles ({settings.MAX_PROFILES_PER_USER}) reached for this user"
                )
        
        # Create profile record
        profile = ProfileInDB(
            id=str(uuid.uuid4()),
            user_id=user_id,
            **profile_create.dict(),
            created_at=datetime.now(),
            updated_at=datetime.now(),
            status=ProfileStatus.DRAFT
        )
        
        # Save to database
        profiles = self._read_profiles()
        profiles.append(profile.dict())
        self._write_profiles(profiles)
        
        # Initialize profile stats
        profile_stats = self._read_profile_stats()
        profile_stats[profile.id] = ProfileStats().dict()
        self._write_profile_stats(profile_stats)
        
        return Profile(**profile.dict())
    
    def update_profile(self, profile_id: str, profile_update: ProfileUpdate) -> Optional[Profile]:
        """Update profile information"""
        profiles = self._read_profiles()
        
        for i, profile in enumerate(profiles):
            if profile["id"] == profile_id:
                # Update profile fields
                update_data = profile_update.dict(exclude_unset=True)
                
                if update_data:
                    for field, value in update_data.items():
                        if value is not None:
                            profile[field] = value
                    
                    # Update the updated_at timestamp
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
        tokens_used: Optional[int] = None,
        query_time: Optional[float] = None,
        add_query: bool = True
    ) -> Optional[ProfileStats]:
        """Update a profile's usage statistics"""
        profile = self.get_profile(profile_id)
        
        if not profile:
            return None
        
        profile_stats = self._read_profile_stats()
        
        if profile_id not in profile_stats:
            profile_stats[profile_id] = ProfileStats().dict()
        
        stats = profile_stats[profile_id]
        
        # Update stats
        if add_query:
            stats["total_queries"] = stats.get("total_queries", 0) + 1
        
        if tokens_used:
            stats["total_tokens"] = stats.get("total_tokens", 0) + tokens_used
        
        if query_time:
            current_avg = stats.get("average_response_time", 0.0)
            current_count = stats.get("total_queries", 0)
            
            # Calculate new average
            if current_count > 0:
                stats["average_response_time"] = (
                    (current_avg * (current_count - 1) + query_time) / current_count
                    if add_query else
                    (current_avg * (current_count - 1) + query_time) / (current_count)
                )
            else:
                stats["average_response_time"] = query_time
        
        # Update last used timestamp
        stats["last_used"] = datetime.now().isoformat()
        
        # Save stats
        profile_stats[profile_id] = stats
        self._write_profile_stats(profile_stats)
        
        return ProfileStats(**stats)


# Create a global profile service instance
profile_service = ProfileService() 