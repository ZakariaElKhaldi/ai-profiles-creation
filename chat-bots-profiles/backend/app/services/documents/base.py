"""
Base module for document service with shared paths and configuration.
"""
import os
import logging
from pathlib import Path
import nltk

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Base paths for storage
BASE_DIR = Path("storage")
BASE_DIR.mkdir(exist_ok=True)

# Document storage
DOCUMENTS_DIR = BASE_DIR / "documents"
DOCUMENTS_DIR.mkdir(exist_ok=True)

# Embeddings storage
EMBEDDINGS_DIR = BASE_DIR / "embeddings"
EMBEDDINGS_DIR.mkdir(exist_ok=True)

# Dataset storage
DATASETS_DIR = BASE_DIR / "datasets"
DATASETS_DIR.mkdir(exist_ok=True)

# Tags storage
TAGS_DIR = BASE_DIR / "tags"
TAGS_DIR.mkdir(exist_ok=True)

# Temp directory for file processing
TEMP_DIR = Path("temp")
TEMP_DIR.mkdir(exist_ok=True)

# Download NLTK resources
def setup_nltk():
    """Configure NLTK resources"""
    try:
        # Create a directory for NLTK data
        nltk_data_dir = BASE_DIR / "nltk_data"
        nltk_data_dir.mkdir(exist_ok=True)
        
        # Set NLTK data path
        nltk.data.path.append(str(nltk_data_dir))
        
        # Check if resources are already downloaded
        try:
            nltk.data.find('tokenizers/punkt')
            logger.info("NLTK punkt already downloaded")
        except LookupError:
            logger.info("Downloading NLTK punkt...")
            nltk.download('punkt', download_dir=str(nltk_data_dir), quiet=True)
        
        try:
            nltk.data.find('corpora/stopwords')
            logger.info("NLTK stopwords already downloaded")
        except LookupError:
            logger.info("Downloading NLTK stopwords...")
            nltk.download('stopwords', download_dir=str(nltk_data_dir), quiet=True)
        
        try:
            nltk.data.find('taggers/averaged_perceptron_tagger')
            logger.info("NLTK tagger already downloaded")
        except LookupError:
            logger.info("Downloading NLTK tagger...")
            nltk.download('averaged_perceptron_tagger', download_dir=str(nltk_data_dir), quiet=True)
            
        logger.info("NLTK resources configured successfully")
        return True
    except Exception as e:
        logger.warning(f"Could not configure NLTK resources: {e}")
        logger.warning("Some text processing features may not work correctly")
        return False

# Initialize NLTK
setup_nltk() 