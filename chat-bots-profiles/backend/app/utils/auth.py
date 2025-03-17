from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader
from typing import Optional
import logging

from ..services.profile_service import ProfileService

logger = logging.getLogger(__name__)

# Define API key header
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

def get_api_key(
    api_key: str = Security(API_KEY_HEADER)
) -> Optional[str]:
    """
    Validate API key from header
    
    Args:
        api_key: API key from header
        
    Returns:
        API key if valid, None otherwise
    """
    if not api_key:
        return None
    return api_key

def validate_api_key(
    api_key: str = Depends(get_api_key)
) -> str:
    """
    Validate API key and return profile ID
    
    Args:
        api_key: API key from header
        
    Returns:
        Profile ID if valid
        
    Raises:
        HTTPException: If API key is invalid
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key is required",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    # Validate API key
    profile_service = ProfileService()
    profile_id = profile_service.get_profile_id_by_api_key(api_key)
    
    if not profile_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    # Update last used timestamp
    profile_service.update_api_key_last_used(api_key)
    
    return profile_id 