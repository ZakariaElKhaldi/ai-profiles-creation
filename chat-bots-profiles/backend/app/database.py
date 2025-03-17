import os
import json
from pathlib import Path
from typing import Dict, Any, Optional

class JsonDatabase:
    """A simple JSON file-based database for storing documents, datasets, and tags."""
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.data: Dict[str, Any] = {}
        self.load()
    
    def load(self):
        """Load data from the JSON file."""
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, 'r', encoding='utf-8') as f:
                    self.data = json.load(f)
            except json.JSONDecodeError:
                # If the file is corrupted, start with empty data
                self.data = {}
        else:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
            self.data = {}
    
    def save(self):
        """Save data to the JSON file."""
        with open(self.file_path, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)
    
    def __getitem__(self, key: str) -> Any:
        """Get a value from the database."""
        return self.data.get(key)
    
    def __setitem__(self, key: str, value: Any):
        """Set a value in the database."""
        self.data[key] = value
    
    def __contains__(self, key: str) -> bool:
        """Check if a key exists in the database."""
        return key in self.data

# Singleton pattern for database instances
_document_db: Optional[JsonDatabase] = None
_main_db: Optional[JsonDatabase] = None

def get_document_db() -> JsonDatabase:
    """Get the document database instance."""
    global _document_db
    if _document_db is None:
        # Get the base directory from environment or use default
        base_dir = os.environ.get('DATA_DIR', os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data'))
        os.makedirs(base_dir, exist_ok=True)
        
        db_path = os.path.join(base_dir, 'documents.json')
        _document_db = JsonDatabase(db_path)
    
    return _document_db

def get_db() -> JsonDatabase:
    """Get the main database instance used for datasets and other general data."""
    global _main_db
    if _main_db is None:
        # Get the base directory from environment or use default
        base_dir = os.environ.get('DATA_DIR', os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data'))
        os.makedirs(base_dir, exist_ok=True)
        
        db_path = os.path.join(base_dir, 'main.json')
        _main_db = JsonDatabase(db_path)
    
    return _main_db 