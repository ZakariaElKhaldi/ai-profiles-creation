"""
Utility functions for managing chatbot profiles.
"""
import json
import os
import logging
from typing import Dict, Any, List

# Path to store profiles
PROFILES_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "profiles.json")

def load_profiles() -> Dict[str, Any]:
    """
    Load profiles from JSON file
    
    Returns:
        Dict[str, Any]: Dictionary of profiles
    """
    try:
        if os.path.exists(PROFILES_FILE):
            with open(PROFILES_FILE, 'r') as f:
                return json.load(f)
        else:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(PROFILES_FILE), exist_ok=True)
            return {}
    except Exception as e:
        logging.error(f"Error loading profiles: {e}")
        return {}

def save_profiles(profiles: Dict[str, Any]) -> None:
    """
    Save profiles to JSON file
    
    Args:
        profiles (Dict[str, Any]): Dictionary of profiles
    """
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(PROFILES_FILE), exist_ok=True)
        
        with open(PROFILES_FILE, 'w') as f:
            json.dump(profiles, f, indent=2)
    except Exception as e:
        logging.error(f"Error saving profiles: {e}")

def generate_profile_description(name: str, personality_traits: List[str]) -> str:
    """
    Generate a description for a chatbot profile based on name and personality traits
    
    Args:
        name (str): Name of the profile
        personality_traits (List[str]): List of personality traits
    
    Returns:
        str: Generated description
    """
    traits_text = ", ".join(personality_traits)
    return f"{name} is a chatbot assistant with the following traits: {traits_text}. " \
           f"It aims to provide helpful, accurate, and engaging responses that reflect these characteristics." 