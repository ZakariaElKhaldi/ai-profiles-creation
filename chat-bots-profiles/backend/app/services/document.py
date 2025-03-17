"""
Document service for handling document operations.

This file is a compatibility layer that re-exports the document_service singleton
from the modular structure in the documents/ directory.
"""

# Re-export from modular structure
from app.services.documents import document_service

# For backward compatibility 
from app.services.documents.service import DocumentService
from app.services.documents.processors import extract_text_from_file
from app.services.documents.analyzers import get_sentence_transformer 