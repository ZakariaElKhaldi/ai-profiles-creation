"""
Document analysis functionality for extracting insights from documents.
"""
import math
import logging
import numpy as np
from typing import List, Optional
from pathlib import Path

from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.corpus import stopwords
from sentence_transformers import SentenceTransformer

from app.services.documents.base import logger

# Initialize sentence transformer model (will be loaded on demand)
_sentence_transformer = None

def get_sentence_transformer():
    """Get or initialize the sentence transformer model for embeddings"""
    global _sentence_transformer
    if _sentence_transformer is None:
        try:
            # Using a smaller model for speed, replace with a more accurate model if needed
            logger.info("Loading sentence transformer model...")
            _sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Sentence transformer model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading sentence transformer model: {e}")
            raise
    return _sentence_transformer

def extract_key_phrases(text: str) -> List[str]:
    """Extract key phrases from text"""
    try:
        # Tokenize text
        words = word_tokenize(text.lower())
        
        # Get stopwords
        stop_words = set(stopwords.words('english'))
        
        # Filter out stopwords and punctuation
        filtered_words = [word for word in words if word.isalnum() and word not in stop_words]
        
        # Count word frequencies
        word_freq = {}
        for word in filtered_words:
            if word in word_freq:
                word_freq[word] += 1
            else:
                word_freq[word] = 1
        
        # Get the most frequent words
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        
        # Return the top words
        return [word for word, freq in sorted_words[:20]]
    except Exception as e:
        logger.error(f"Error extracting key phrases: {e}")
        return []

def generate_summary(text: str) -> Optional[str]:
    """Generate a summary for text"""
    try:
        # Simple extractive summarization
        sentences = sent_tokenize(text)
        
        # For very short texts, just return the text
        if len(sentences) <= 3:
            return text if len(text) < 200 else text[:200] + "..."
        
        # For longer texts, use the first sentence and last sentence
        return sentences[0] + " [...] " + sentences[-1]
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        return None

def calculate_similarity(query_embedding, doc_embedding):
    """Calculate cosine similarity between two embeddings"""
    try:
        return np.dot(query_embedding, doc_embedding) / (
            np.linalg.norm(query_embedding) * np.linalg.norm(doc_embedding)
        )
    except Exception as e:
        logger.error(f"Error calculating similarity: {e}")
        return 0.0 