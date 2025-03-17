"""
Document service module for handling document operations.
This package provides document management functionality including:
- Document creation, retrieval, and deletion
- File parsing and text extraction
- Document analysis and searching
- Dataset and tag management
"""

# Singleton instance
from app.services.documents.service import DocumentService, document_service

# Export important classes and functions
from app.services.documents.processors import extract_text_from_file
from app.services.documents.analyzers import get_sentence_transformer

__all__ = [
    'DocumentService',
    'document_service',
    'extract_text_from_file',
    'get_sentence_transformer'
] 