"""
Main document service implementation.
"""
import os
import json
import uuid
import time
from typing import List, Dict, Any, Optional, BinaryIO, Set, Union
from datetime import datetime
import numpy as np

from app.schemas.document import (
    DocumentInfo, 
    DocumentCreate, 
    DocumentMetadata,
    DocumentType,
    Dataset,
    DatasetCreate,
    DocumentTag,
    DocumentTagCreate,
    DocumentAnalysisResponse
)

from app.services.documents.base import (
    logger, 
    DOCUMENTS_DIR, 
    EMBEDDINGS_DIR, 
    DATASETS_DIR, 
    TAGS_DIR
)
from app.services.documents.processors import (
    extract_text_from_file, 
    process_text_metadata,
    get_document_type_from_extension
)
from app.services.documents.analyzers import (
    get_sentence_transformer,
    extract_key_phrases,
    generate_summary,
    calculate_similarity
)

class DocumentService:
    """Service for managing documents"""

    def __init__(self):
        """Initialize document service"""
        # In-memory document store (for development)
        self.documents = {}
        self.datasets = {}
        self.tags = {}
        
        # Ensure storage directories exist
        try:
            DOCUMENTS_DIR.mkdir(exist_ok=True)
            DATASETS_DIR.mkdir(exist_ok=True)
            TAGS_DIR.mkdir(exist_ok=True)
            
            # Make sure metadata files can be created
            for dir_path in [DOCUMENTS_DIR, DATASETS_DIR, TAGS_DIR]:
                test_path = dir_path / "test_write_access.tmp"
                with open(test_path, 'w') as f:
                    f.write("test")
                os.remove(test_path)
            
            logger.info("Storage directories verified with write permissions")
        except Exception as e:
            logger.error(f"Error setting up storage directories: {e}")
            logger.warning("Using temporary in-memory storage only - data will not persist!")
        
        # Initialize from existing data if any
        self._load_existing_data()

    def _load_existing_data(self):
        """Load any existing data from disk"""
        try:
            # Load documents
            if os.path.exists(DOCUMENTS_DIR / "metadata.json"):
                with open(DOCUMENTS_DIR / "metadata.json", "r") as f:
                    self.documents = json.load(f)
                logger.info(f"Loaded {len(self.documents)} documents from disk")
            
            # Load datasets
            if os.path.exists(DATASETS_DIR / "metadata.json"):
                with open(DATASETS_DIR / "metadata.json", "r") as f:
                    self.datasets = json.load(f)
                logger.info(f"Loaded {len(self.datasets)} datasets from disk")
            
            # Load tags
            if os.path.exists(TAGS_DIR / "metadata.json"):
                with open(TAGS_DIR / "metadata.json", "r") as f:
                    self.tags = json.load(f)
                logger.info(f"Loaded {len(self.tags)} tags from disk")
        except Exception as e:
            logger.error(f"Error loading existing data: {e}")
            self.documents = {}
            self.datasets = {}
            self.tags = {}

    def _save_documents_metadata(self):
        """Save document metadata to disk"""
        try:
            with open(DOCUMENTS_DIR / "metadata.json", "w") as f:
                json.dump(self.documents, f)
        except Exception as e:
            logger.error(f"Error saving document metadata: {e}")
    
    def _save_datasets_metadata(self):
        """Save dataset metadata to disk"""
        try:
            with open(DATASETS_DIR / "metadata.json", "w") as f:
                json.dump(self.datasets, f)
        except Exception as e:
            logger.error(f"Error saving dataset metadata: {e}")
    
    def _save_tags_metadata(self):
        """Save tags metadata to disk"""
        try:
            with open(TAGS_DIR / "metadata.json", "w") as f:
                json.dump(self.tags, f)
        except Exception as e:
            logger.error(f"Error saving tags metadata: {e}")

    def create_document(self, doc: DocumentCreate) -> DocumentInfo:
        """Create a new document from text content"""
        doc_id = str(uuid.uuid4())
        now = datetime.now()
        
        try:
            # Process metadata
            metadata = process_text_metadata(doc.content, doc.metadata)
            
            # Create document record
            document = {
                "id": doc_id,
                "name": doc.name,
                "type": str(doc.type),
                "content": doc.content,
                "dateAdded": now.isoformat(),
                "embedding": False,
                "session_id": doc.session_id,
                "dataset_id": doc.dataset_id,
                "tags": doc.tags or [],
                "metadata": metadata.dict() if metadata else None,
                "summary": generate_summary(doc.content) if len(doc.content) > 200 else None,
                "favorite": False
            }
            
            # Store document content
            content_path = DOCUMENTS_DIR / f"{doc_id}.txt"
            try:
                # Ensure directory exists
                DOCUMENTS_DIR.mkdir(exist_ok=True, parents=True)
                
                with open(content_path, "w", encoding="utf-8") as f:
                    f.write(doc.content)
                logger.info(f"Successfully wrote document content to {content_path}")
            except IOError as e:
                logger.error(f"Failed to write document content to disk: {e}")
                # Still keep the document in memory with content
                document["content_error"] = f"Content saved in memory only: {str(e)}"
            
            # Store document metadata
            self.documents[doc_id] = document
            self._save_documents_metadata()
            
            # Update dataset document count if applicable
            if doc.dataset_id and doc.dataset_id in self.datasets:
                self.datasets[doc.dataset_id]["document_count"] += 1
                self._save_datasets_metadata()
            
            # Update tag document counts if applicable
            if doc.tags:
                for tag_id in doc.tags:
                    if tag_id in self.tags:
                        self.tags[tag_id]["document_count"] += 1
                self._save_tags_metadata()
            
            # Convert to DocumentInfo
            return self._document_dict_to_info(document)
        except Exception as e:
            logger.error(f"Error creating document: {e}")
            raise

    def get_document(self, doc_id: str) -> Optional[DocumentInfo]:
        """Get a document by ID"""
        try:
            document = self.documents.get(doc_id)
            if not document:
                logger.warning(f"Document {doc_id} not found in metadata")
                return None
                
            # Load content if not cached
            if "content" not in document or not document["content"]:
                try:
                    content_path = DOCUMENTS_DIR / f"{doc_id}.txt"
                    if not content_path.exists():
                        logger.error(f"Document content file not found for {doc_id}")
                        document["content"] = "Document content file not found"
                    else:
                        try:
                            with open(content_path, "r", encoding="utf-8") as f:
                                document["content"] = f.read()
                        except UnicodeDecodeError:
                            # Try with different encodings
                            try:
                                with open(content_path, "r", encoding="latin-1") as f:
                                    document["content"] = f.read()
                            except Exception as enc_err:
                                logger.error(f"Error reading document with alternate encoding for {doc_id}: {enc_err}")
                                document["content"] = "Error reading document content: encoding issue"
                except FileNotFoundError:
                    logger.error(f"Document content file not found for {doc_id}")
                    document["content"] = "Document content file not found"
                except PermissionError:
                    logger.error(f"Permission denied when reading document content for {doc_id}")
                    document["content"] = "Error reading content: permission denied"
                except Exception as e:
                    logger.error(f"Error reading document content for {doc_id}: {e}")
                    document["content"] = f"Error reading content: {str(e)}"
            
            # Convert to DocumentInfo
            return self._document_dict_to_info(document)
        except Exception as e:
            logger.error(f"Error retrieving document {doc_id}: {e}")
            return None

    def get_all_documents(self, dataset_id: Optional[str] = None, tag_ids: Optional[List[str]] = None) -> List[DocumentInfo]:
        """Get all documents, optionally filtered by dataset or tags"""
        docs = []
        
        try:
            for doc_id, doc in self.documents.items():
                try:
                    # Filter by dataset if specified
                    if dataset_id and doc.get("dataset_id") != dataset_id:
                        continue
                        
                    # Filter by tags if specified
                    if tag_ids and not all(tag_id in doc.get("tags", []) for tag_id in tag_ids):
                        continue
                        
                    document = self.get_document(doc_id)
                    if document:
                        docs.append(document)
                except Exception as e:
                    logger.error(f"Error processing document {doc_id}: {e}")
                    # Continue with next document instead of failing
                    continue
        except Exception as e:
            logger.error(f"Error retrieving documents: {e}")
            # Return empty list instead of failing
            return []
                
        return docs

    def update_document(self, doc_id: str, updates: Dict[str, Any]) -> Optional[DocumentInfo]:
        """Update a document with new values"""
        if doc_id not in self.documents:
            return None
            
        document = self.documents[doc_id]
        
        # Handle special cases first
        
        # If content is updated, save the new content and update metadata
        if "content" in updates:
            with open(DOCUMENTS_DIR / f"{doc_id}.txt", "w", encoding="utf-8") as f:
                f.write(updates["content"])
            
            # Update metadata based on new content
            metadata = process_text_metadata(updates["content"], document.get("metadata", {}))
            document["metadata"] = metadata.dict() if metadata else None
            
            # Update summary if content changed significantly
            if len(updates["content"]) > 200:
                document["summary"] = generate_summary(updates["content"])
        
        # Update tags if specified
        old_tags = set(document.get("tags", []))
        if "tags" in updates:
            new_tags = set(updates["tags"])
            
            # Decrement count for removed tags
            for tag_id in old_tags - new_tags:
                if tag_id in self.tags and self.tags[tag_id]["document_count"] > 0:
                    self.tags[tag_id]["document_count"] -= 1
            
            # Increment count for added tags
            for tag_id in new_tags - old_tags:
                if tag_id in self.tags:
                    self.tags[tag_id]["document_count"] += 1
            
            # Save tag metadata
            self._save_tags_metadata()
        
        # Update dataset if changed
        old_dataset_id = document.get("dataset_id")
        if "dataset_id" in updates and updates["dataset_id"] != old_dataset_id:
            # Decrement count for old dataset
            if old_dataset_id and old_dataset_id in self.datasets:
                self.datasets[old_dataset_id]["document_count"] = max(0, self.datasets[old_dataset_id]["document_count"] - 1)
            
            # Increment count for new dataset
            new_dataset_id = updates["dataset_id"]
            if new_dataset_id and new_dataset_id in self.datasets:
                self.datasets[new_dataset_id]["document_count"] += 1
            
            # Save dataset metadata
            self._save_datasets_metadata()
        
        # Update document with all other fields
        for key, value in updates.items():
            if key != "id" and key in document:  # Don't allow changing the ID
                document[key] = value
        
        # Save document metadata
        self._save_documents_metadata()
        
        # Return updated document
        return self._document_dict_to_info(document)

    def delete_document(self, doc_id: str) -> bool:
        """Delete a document by ID"""
        if doc_id not in self.documents:
            return False
            
        document = self.documents[doc_id]
        
        # Update dataset document count if applicable
        dataset_id = document.get("dataset_id")
        if dataset_id and dataset_id in self.datasets:
            self.datasets[dataset_id]["document_count"] = max(0, self.datasets[dataset_id]["document_count"] - 1)
            self._save_datasets_metadata()
        
        # Update tag document counts if applicable
        tags = document.get("tags", [])
        for tag_id in tags:
            if tag_id in self.tags and self.tags[tag_id]["document_count"] > 0:
                self.tags[tag_id]["document_count"] -= 1
        self._save_tags_metadata()
        
        # Delete document file
        try:
            os.remove(DOCUMENTS_DIR / f"{doc_id}.txt")
        except FileNotFoundError:
            pass
            
        # Delete embedding file if exists
        embedding_file = EMBEDDINGS_DIR / f"{doc_id}.npy"
        if embedding_file.exists():
            os.remove(embedding_file)
            
        # Delete from metadata
        del self.documents[doc_id]
        self._save_documents_metadata()
        
        return True

    def upload_document(self, file: BinaryIO, filename: str, 
                      session_id: Optional[str] = None,
                      dataset_id: Optional[str] = None,
                      tags: Optional[List[str]] = None) -> DocumentInfo:
        """Upload and process a document file"""
        # Extract file extension for document type
        extension = os.path.splitext(filename)[1].lower().replace('.', '')
        
        # Map extension to document type
        doc_type = get_document_type_from_extension(extension)
        
        # Extract text and metadata from file
        content, metadata = extract_text_from_file(file, filename)
        
        # Generate a default name if none provided
        name = os.path.splitext(filename)[0]
        
        # Create document record
        doc = DocumentCreate(
            name=name,
            content=content,
            type=doc_type,
            session_id=session_id,
            dataset_id=dataset_id,
            tags=tags,
            metadata=metadata
        )
        
        # Store document
        return self.create_document(doc)

    def generate_embedding(self, doc_id: str) -> bool:
        """Generate embeddings for a document"""
        document = self.get_document(doc_id)
        if not document:
            return False
            
        try:
            # Get sentence transformer model
            model = get_sentence_transformer()
            
            # Generate embedding for the document content
            embedding = model.encode(document.content, show_progress_bar=False)
            
            # Save embedding
            np.save(EMBEDDINGS_DIR / f"{doc_id}.npy", embedding)
            
            # Update document metadata
            self.documents[doc_id]["embedding"] = True
            self._save_documents_metadata()
            
            return True
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return False

    def search_documents(self, query: str, limit: int = 5, 
                      dataset_id: Optional[str] = None,
                      tag_ids: Optional[List[str]] = None) -> List[DocumentInfo]:
        """Search documents using semantic search with embeddings"""
        try:
            # Filter documents by dataset and tags if specified
            candidate_docs = {}
            for doc_id, doc in self.documents.items():
                # Skip if not in specified dataset
                if dataset_id and doc.get("dataset_id") != dataset_id:
                    continue
                    
                # Skip if doesn't have all specified tags
                if tag_ids and not all(tag_id in doc.get("tags", []) for tag_id in tag_ids):
                    continue
                    
                # Add to candidates
                candidate_docs[doc_id] = doc
                
            # Get documents with embeddings
            embedded_docs = []
            for doc_id, doc in candidate_docs.items():
                if doc.get("embedding", False):
                    embedding_file = EMBEDDINGS_DIR / f"{doc_id}.npy"
                    if embedding_file.exists():
                        embedded_docs.append(doc_id)
            
            if not embedded_docs:
                # If no embeddings, do basic text search
                results = []
                query_lower = query.lower()
                for doc_id, doc in candidate_docs.items():
                    document = self.get_document(doc_id)
                    if document and (
                        query_lower in document.name.lower() or 
                        query_lower in document.content.lower()
                    ):
                        results.append(document)
                
                return results[:limit]
            
            # Get sentence transformer model
            model = get_sentence_transformer()
            
            # Generate embedding for the query
            query_embedding = model.encode(query, show_progress_bar=False)
            
            # Calculate similarity scores
            scores = []
            for doc_id in embedded_docs:
                embedding_file = EMBEDDINGS_DIR / f"{doc_id}.npy"
                doc_embedding = np.load(embedding_file)
                
                # Calculate cosine similarity
                similarity = calculate_similarity(query_embedding, doc_embedding)
                
                scores.append((doc_id, similarity))
            
            # Sort by similarity score (highest first)
            scores.sort(key=lambda x: x[1], reverse=True)
            
            # Return top results
            results = []
            for doc_id, score in scores[:limit]:
                document = self.get_document(doc_id)
                if document:
                    results.append(document)
            
            return results
        except Exception as e:
            logger.error(f"Error in semantic search: {e}")
            return []

    def analyze_document(self, doc_id: str) -> Optional[DocumentAnalysisResponse]:
        """Analyze a document to extract insights"""
        document = self.get_document(doc_id)
        if not document:
            return None
            
        content = document.content
        
        try:
            # Basic analysis
            word_count = len(content.split())
            
            # Estimate reading time (average reading speed: 200-250 words per minute)
            read_time_minutes = (word_count + 199) // 200  # Ceiling division
            
            # Extract key phrases
            key_phrases = extract_key_phrases(content)
            
            # Generate or get summary
            summary = document.summary
            if not summary:
                summary = generate_summary(content)
                # Update document with generated summary
                self.documents[doc_id]["summary"] = summary
                self._save_documents_metadata()
            
            return DocumentAnalysisResponse(
                word_count=word_count,
                read_time_minutes=read_time_minutes,
                key_phrases=key_phrases[:10],  # Top 10 key phrases
                summary=summary
            )
        except Exception as e:
            logger.error(f"Error analyzing document: {e}")
            return DocumentAnalysisResponse(
                word_count=len(content.split()),
                read_time_minutes=(len(content.split()) + 199) // 200,
                key_phrases=[],
                summary=None
            )

    # Dataset methods
    def create_dataset(self, dataset: DatasetCreate) -> Dataset:
        """Create a new dataset"""
        dataset_id = str(uuid.uuid4())
        now = datetime.now()
        
        # Create dataset record
        dataset_data = {
            "id": dataset_id,
            "name": dataset.name,
            "description": dataset.description,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "document_count": 0
        }
        
        # Store dataset
        self.datasets[dataset_id] = dataset_data
        self._save_datasets_metadata()
        
        return Dataset(
            id=dataset_id,
            name=dataset.name,
            description=dataset.description,
            created_at=now,
            updated_at=now,
            document_count=0
        )

    def get_dataset(self, dataset_id: str) -> Optional[Dataset]:
        """Get a dataset by ID"""
        dataset = self.datasets.get(dataset_id)
        if not dataset:
            return None
            
        return Dataset(
            id=dataset["id"],
            name=dataset["name"],
            description=dataset["description"],
            created_at=datetime.fromisoformat(dataset["created_at"]),
            updated_at=datetime.fromisoformat(dataset["updated_at"]),
            document_count=dataset["document_count"]
        )

    def get_all_datasets(self) -> List[Dataset]:
        """Get all datasets"""
        return [
            Dataset(
                id=dataset["id"],
                name=dataset["name"],
                description=dataset["description"],
                created_at=datetime.fromisoformat(dataset["created_at"]),
                updated_at=datetime.fromisoformat(dataset["updated_at"]),
                document_count=dataset["document_count"]
            )
            for dataset in self.datasets.values()
        ]

    def update_dataset(self, dataset_id: str, updates: Dict[str, Any]) -> Optional[Dataset]:
        """Update a dataset with new values"""
        if dataset_id not in self.datasets:
            return None
            
        dataset = self.datasets[dataset_id]
        
        # Update fields
        for key, value in updates.items():
            if key in ["name", "description"]:
                dataset[key] = value
        
        # Update timestamp
        dataset["updated_at"] = datetime.now().isoformat()
        
        # Save dataset metadata
        self._save_datasets_metadata()
        
        return Dataset(
            id=dataset["id"],
            name=dataset["name"],
            description=dataset["description"],
            created_at=datetime.fromisoformat(dataset["created_at"]),
            updated_at=datetime.fromisoformat(dataset["updated_at"]),
            document_count=dataset["document_count"]
        )

    def delete_dataset(self, dataset_id: str) -> bool:
        """Delete a dataset by ID"""
        if dataset_id not in self.datasets:
            return False
            
        # Remove dataset_id from all documents in this dataset
        for doc_id, doc in self.documents.items():
            if doc.get("dataset_id") == dataset_id:
                doc["dataset_id"] = None
        
        # Save document metadata
        self._save_documents_metadata()
        
        # Delete dataset
        del self.datasets[dataset_id]
        self._save_datasets_metadata()
        
        return True

    # Tag methods
    def create_tag(self, tag: DocumentTagCreate) -> DocumentTag:
        """Create a new tag"""
        tag_id = str(uuid.uuid4())
        
        # Create tag record
        tag_data = {
            "id": tag_id,
            "name": tag.name,
            "color": tag.color or "#3b82f6",  # Default blue color
            "document_count": 0
        }
        
        # Store tag
        self.tags[tag_id] = tag_data
        self._save_tags_metadata()
        
        return DocumentTag(
            id=tag_id,
            name=tag.name,
            color=tag.color or "#3b82f6"
        )

    def get_tag(self, tag_id: str) -> Optional[DocumentTag]:
        """Get a tag by ID"""
        tag = self.tags.get(tag_id)
        if not tag:
            return None
            
        return DocumentTag(
            id=tag["id"],
            name=tag["name"],
            color=tag["color"]
        )

    def get_all_tags(self) -> List[DocumentTag]:
        """Get all tags"""
        return [
            DocumentTag(
                id=tag["id"],
                name=tag["name"],
                color=tag["color"]
            )
            for tag in self.tags.values()
        ]

    def update_tag(self, tag_id: str, updates: Dict[str, Any]) -> Optional[DocumentTag]:
        """Update a tag with new values"""
        if tag_id not in self.tags:
            return None
            
        tag = self.tags[tag_id]
        
        # Update fields
        for key, value in updates.items():
            if key in ["name", "color"]:
                tag[key] = value
        
        # Save tag metadata
        self._save_tags_metadata()
        
        return DocumentTag(
            id=tag["id"],
            name=tag["name"],
            color=tag["color"]
        )

    def delete_tag(self, tag_id: str) -> bool:
        """Delete a tag by ID"""
        if tag_id not in self.tags:
            return False
            
        # Remove tag from all documents
        for doc_id, doc in self.documents.items():
            if "tags" in doc and tag_id in doc["tags"]:
                doc["tags"].remove(tag_id)
        
        # Save document metadata
        self._save_documents_metadata()
        
        # Delete tag
        del self.tags[tag_id]
        self._save_tags_metadata()
        
        return True

    def _document_dict_to_info(self, doc: Dict[str, Any]) -> DocumentInfo:
        """Convert a document dictionary to DocumentInfo object"""
        try:
            # Get tags
            tags = []
            for tag_id in doc.get("tags", []):
                try:
                    tag = self.tags.get(tag_id)
                    if tag:
                        tags.append(DocumentTag(
                            id=tag["id"],
                            name=tag["name"],
                            color=tag["color"]
                        ))
                except Exception as tag_e:
                    logger.error(f"Error processing tag {tag_id}: {tag_e}")
            
            # Convert metadata
            metadata = None
            if doc.get("metadata"):
                try:
                    if isinstance(doc["metadata"], dict):
                        metadata = DocumentMetadata(**doc["metadata"])
                    elif isinstance(doc["metadata"], DocumentMetadata):
                        metadata = doc["metadata"]
                except Exception as meta_e:
                    logger.error(f"Error processing metadata for document {doc.get('id')}: {meta_e}")
            
            # Ensure required fields exist
            required_fields = ["id", "name", "type", "content", "dateAdded"]
            for field in required_fields:
                if field not in doc:
                    if field == "content":
                        doc[field] = "No content available"
                    elif field == "type":
                        doc[field] = DocumentType.TEXT
                    elif field == "dateAdded":
                        doc[field] = datetime.now().isoformat()
                    else:
                        doc[field] = f"Missing {field}"
                        logger.warning(f"Document missing required field: {field}")
            
            # Create DocumentInfo
            return DocumentInfo(
                id=doc["id"],
                name=doc["name"],
                type=doc["type"],
                content=doc["content"],
                dateAdded=doc["dateAdded"],
                embedding=doc.get("embedding", False),
                metadata=metadata,
                tags=tags,
                summary=doc.get("summary"),
                dataset_id=doc.get("dataset_id"),
                favorite=doc.get("favorite", False)
            )
        except Exception as e:
            logger.error(f"Error converting document to DocumentInfo: {e}")
            # Create a minimal valid document to avoid 500 errors
            return DocumentInfo(
                id=doc.get("id", str(uuid.uuid4())),
                name=doc.get("name", "Error Document"),
                type=DocumentType.TEXT,
                content="Error reading document content",
                dateAdded=datetime.now().isoformat(),
                embedding=False
            )


# Create singleton instance
document_service = DocumentService() 