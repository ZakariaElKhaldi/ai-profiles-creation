"""
Document store for managing uploaded documents and their content.
This module provides storage and retrieval functions for document content.
"""
import os
import json
import time
from typing import List, Dict, Any, Optional, Set

class DocumentStore:
    """Class for managing uploaded document data"""
    
    def __init__(self, storage_dir: str = "uploads"):
        """Initialize the document store
        
        Args:
            storage_dir: Directory for storing documents
        """
        self.storage_dir = storage_dir
        self.index_file = os.path.join(storage_dir, "index.json")
        self.chunks_dir = os.path.join(storage_dir, "chunks")
        
        # Ensure directories exist
        try:
            os.makedirs(self.storage_dir, exist_ok=True)
            os.makedirs(self.chunks_dir, exist_ok=True)
            
            # Create empty index file if it doesn't exist
            if not os.path.exists(self.index_file):
                with open(self.index_file, 'w') as f:
                    json.dump({"documents": {}}, f)
                print(f"Created new document index at {self.index_file}")
        except Exception as e:
            print(f"Warning: Error creating document store directories: {str(e)}")
            # Try using a temporary directory if the main one fails
            import tempfile
            temp_dir = os.path.join(tempfile.gettempdir(), "doc_store")
            os.makedirs(temp_dir, exist_ok=True)
            self.storage_dir = temp_dir
            self.index_file = os.path.join(temp_dir, "index.json")
            self.chunks_dir = os.path.join(temp_dir, "chunks")
            os.makedirs(self.chunks_dir, exist_ok=True)
            
            if not os.path.exists(self.index_file):
                with open(self.index_file, 'w') as f:
                    json.dump({"documents": {}}, f)
                print(f"Created new document index at {self.index_file} (fallback location)")
        
        # Load document index if it exists
        self.document_index = self._load_index()
    
    def _load_index(self) -> Dict[str, Any]:
        """Load the document index from disk"""
        if os.path.exists(self.index_file):
            try:
                with open(self.index_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading document index: {str(e)}")
                return {"documents": {}}
        else:
            return {"documents": {}}
    
    def _save_index(self) -> None:
        """Save the document index to disk"""
        try:
            with open(self.index_file, 'w') as f:
                json.dump(self.document_index, f, indent=2)
        except Exception as e:
            print(f"Error saving document index: {str(e)}")
    
    def add_document(self, filename: str, chunks: List[str]) -> str:
        """Add a document to the store
        
        Args:
            filename: Name of the document
            chunks: List of text chunks from the document
            
        Returns:
            Document ID
        """
        # Generate a unique document ID
        doc_id = f"{int(time.time())}_{filename}"
        
        # Create a chunks file
        chunks_file = os.path.join(self.chunks_dir, f"{doc_id}.json")
        with open(chunks_file, 'w') as f:
            json.dump(chunks, f)
        
        # Add to document index
        self.document_index["documents"][doc_id] = {
            "filename": filename,
            "timestamp": int(time.time()),
            "chunks_file": chunks_file,
            "chunk_count": len(chunks)
        }
        
        # Save updated index
        self._save_index()
        
        return doc_id
    
    def get_document_chunks(self, doc_id: str) -> List[str]:
        """Get chunks for a specific document
        
        Args:
            doc_id: ID of the document
            
        Returns:
            List of text chunks
        """
        if doc_id not in self.document_index["documents"]:
            return []
        
        chunks_file = self.document_index["documents"][doc_id]["chunks_file"]
        
        if not os.path.exists(chunks_file):
            return []
        
        try:
            with open(chunks_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading document chunks: {str(e)}")
            return []
    
    def get_all_document_chunks(self) -> List[str]:
        """Get chunks from all documents
        
        Returns:
            List of text chunks from all documents
        """
        all_chunks = []
        
        for doc_id in self.document_index["documents"]:
            doc_chunks = self.get_document_chunks(doc_id)
            all_chunks.extend(doc_chunks)
        
        return all_chunks
    
    def get_document_metadata(self) -> List[Dict[str, Any]]:
        """Get metadata for all documents
        
        Returns:
            List of document metadata
        """
        return [
            {
                "id": doc_id,
                "filename": info["filename"],
                "timestamp": info["timestamp"],
                "chunk_count": info["chunk_count"]
            }
            for doc_id, info in self.document_index["documents"].items()
        ]
    
    def remove_document(self, doc_id: str) -> bool:
        """Remove a document from the store
        
        Args:
            doc_id: ID of the document to remove
            
        Returns:
            True if document was removed, False otherwise
        """
        if doc_id not in self.document_index["documents"]:
            return False
        
        # Get chunks file path
        chunks_file = self.document_index["documents"][doc_id]["chunks_file"]
        
        # Remove chunks file if it exists
        if os.path.exists(chunks_file):
            try:
                os.remove(chunks_file)
            except Exception as e:
                print(f"Error removing chunks file: {str(e)}")
        
        # Remove from index
        del self.document_index["documents"][doc_id]
        
        # Save updated index
        self._save_index()
        
        return True 