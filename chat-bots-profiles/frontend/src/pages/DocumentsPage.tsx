import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Button, Tabs, Tab, IconButton } from '@mui/material';
import { ViewList, ViewModule, Add, Upload, Dataset as DatasetIcon, LocalOffer } from '@mui/icons-material';
import DocumentCard from '../components/documents/DocumentCard';
import DocumentDetail from '../components/documents/DocumentDetail';
import CreateDocumentForm from '../components/documents/CreateDocumentForm';
import DatasetManager from '../components/documents/DatasetManager';
import TagManager from '../components/documents/TagManager';
import DocumentStats from '../components/documents/DocumentStats';
import DocumentActionBar from '../components/documents/DocumentActionBar';
import DocumentFilters from '../components/documents/DocumentFilters';
import DocumentList from '../components/documents/DocumentList';
import DocumentGrid from '../components/documents/DocumentGrid';
import EnhancedFileUploader from '../components/documents/EnhancedFileUploader';
import { Tag } from '../components/documents/TagManager';
import apiClient from '../services/api';
import { useApp } from '../context/AppContext';

export interface DocumentMetadata {
  author?: string;
  created_date?: string;
  modified_date?: string;
  page_count?: number;
  source?: string;
  language?: string;
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  document_count: number;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  dataset_id?: string;
  dataset_name?: string;
  tag_ids: string[];
  tags?: Tag[];
  metadata?: DocumentMetadata;
  created_at: string;
  updated_at?: string;
  is_favorite: boolean;
  embedding_status?: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface DocumentAnalysis {
  word_count: number;
  reading_time: number;
  key_phrases: string[];
  summary?: string;
}

export default function DocumentsPage() {
  const { sessionId } = useApp();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'favorites'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  
  // Modal states
  const [showDatasetManager, setShowDatasetManager] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showCreateDocument, setShowCreateDocument] = useState(false);
  const [showFileUploader, setShowFileUploader] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const selectedDocument = documents.find(doc => doc.id === selectedDocId);

  // Fetch data on component mount
  useEffect(() => {
    fetchDocuments();
    fetchDatasets();
    fetchTags();
  }, []);

  // Fetch documents based on selected filters
  useEffect(() => {
    fetchDocuments();
  }, [selectedDatasetId, selectedTagIds, activeTab]);
  
  // Fetch analysis when a document is selected
  useEffect(() => {
    if (selectedDocId) {
      fetchDocumentAnalysis(selectedDocId);
    } else {
      setAnalysis(null);
    }
  }, [selectedDocId]);

  // Fetch all documents from the API
  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query parameters for filtering
      const params: Record<string, string> = {};
      if (selectedDatasetId) params.dataset_id = selectedDatasetId;
      if (selectedTagIds.length > 0) params.tag_ids = selectedTagIds.join(',');
      if (activeTab === 'favorites') params.favorite = 'true';
      if (activeTab === 'recent') params.recent = 'true';
      
      const response = await apiClient.get('/documents', { params });
      setDocuments(response.data.documents || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all datasets
  const fetchDatasets = async () => {
    try {
      const response = await apiClient.get('/datasets');
      setDatasets(response.data.datasets || []);
    } catch (err) {
      console.error('Error fetching datasets:', err);
    }
  };

  // Fetch all tags
  const fetchTags = async () => {
    try {
      const response = await apiClient.get('/tags');
      setTags(response.data.tags || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };
  
  // Fetch document analysis
  const fetchDocumentAnalysis = async (docId: string) => {
    try {
      const response = await apiClient.post(`/documents/${docId}/analyze`);
      setAnalysis(response.data);
    } catch (err) {
      console.error('Error fetching document analysis:', err);
      setAnalysis(null);
    }
  };

  // Add a new document
  const handleAddDocument = async (document: { 
    title: string; 
    content: string; 
    dataset_id?: string; 
    tag_ids?: string[];
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post('/documents', {
        ...document,
        session_id: sessionId
      });
      
      setDocuments(prevDocs => [...prevDocs, response.data]);
      return true;
    } catch (err) {
      console.error('Error adding document:', err);
      setError('Failed to add document. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a document
  const handleDeleteDocument = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await apiClient.delete(`/documents/${id}`);
      setDocuments(documents.filter(doc => doc.id !== id));
      
      if (selectedDocId === id) {
        setSelectedDocId(null);
      }
      return true;
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update the upload document function to handle batch uploads
  const uploadDocument = async (file: File, datasetId?: string, tagIds?: string[]) => {
    setIsLoading(true);
    setError(null);
    
    // Validate file size
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    if (file.size > maxSize) {
      setError(`File ${file.name} is too large. Maximum size is 10MB.`);
      setIsLoading(false);
      return false;
    }
    
    // Validate file type - Updated to include CSV and more file types
    const allowedTypes = [
      'application/pdf', 
      'text/plain', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'text/markdown',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
      'text/html',
      'application/xml',
      'text/xml'
    ];
    
    // More flexible validation that checks file extensions if MIME type is not recognized
    let isValidFile = false;
    
    // Check by MIME type first
    if (allowedTypes.some(type => file.type.includes(type))) {
      isValidFile = true;
    } else {
      // If MIME type check fails, check by file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      isValidFile = ['pdf', 'txt', 'doc', 'docx', 'md', 'csv', 'xls', 'xlsx', 'json', 'html', 'xml'].includes(extension || '');
    }
    
    if (!isValidFile) {
      setError(`Unsupported file type: ${file.type}. Please upload PDF, TXT, DOC, DOCX, MD, CSV, XLS, XLSX, JSON, HTML, or XML files.`);
      setIsLoading(false);
      return false;
    }
    
    const formData = new FormData();
    formData.append('files', file);
    
    if (datasetId) {
      formData.append('dataset_id', datasetId);
    }
    
    if (tagIds && tagIds.length > 0) {
      formData.append('tags', tagIds.join(','));
    }
    
    try {
      const response = await apiClient.post('/documents/batch-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30 second timeout
      });
      
      // Refresh document list
      fetchDocuments();
      
      // Extract document ID from the first successful upload
      const uploadResults = response.data;
      if (uploadResults && uploadResults.length > 0) {
        if (uploadResults[0].success) {
          return true;
        } else {
          setError(`Failed to upload ${file.name}: ${uploadResults[0].error || 'Unknown error'}`);
          return false;
        }
      }
      
      setError(`Failed to upload ${file.name}. Please try again.`);
      return false;
    } catch (err: any) {
      console.error('Error uploading document:', err);
      setError(err.response?.data?.message || `Failed to upload ${file.name}. Please try again.`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // New function for multiple file uploads
  const uploadMultipleDocuments = async (files: File[], datasetId?: string, tagIds?: string[]) => {
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData();
    
    // Validate files before upload
    const validFiles = files.filter(file => {
      const maxSize = 50 * 1024 * 1024; // 50MB limit
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large. Maximum size is 50MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      setIsLoading(false);
      return false;
    }
    
    // Append all valid files
    for (const file of validFiles) {
      formData.append('files', file);
    }
    
    if (datasetId) {
      formData.append('dataset_id', datasetId);
    }
    
    if (tagIds && tagIds.length > 0) {
      formData.append('tags', tagIds.join(','));
    }
    
    try {
      const response = await apiClient.post('/documents/batch-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30 second timeout
      });
      
      // Refresh document list
      fetchDocuments();
      
      // Process upload results
      const uploadResults = response.data;
      const successCount = uploadResults.filter((result: any) => result.success).length;
      const failedResults = uploadResults.filter((result: any) => !result.success);
      
      if (successCount === 0) {
        setError('Failed to upload any documents. Please try again.');
        return false;
      }
      
      if (failedResults.length > 0) {
        const failedFiles = failedResults.map((result: any) => result.fileName).join(', ');
        setError(`Successfully uploaded ${successCount} files. Failed to upload: ${failedFiles}`);
        return true;
      }
      
      return true;
    } catch (err: any) {
      console.error('Error uploading documents:', err);
      setError(err.response?.data?.message || 'Failed to upload documents. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Generate embeddings for a document
  const handleGenerateEmbedding = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await apiClient.post(`/documents/${id}/embed`);
      
      // Update the document in the state
      const updatedDocuments = documents.map(doc => 
        doc.id === id ? { ...doc, embedding_status: 'processing' as 'pending' | 'processing' | 'completed' | 'failed' } : doc
      );
      
      setDocuments(updatedDocuments);
      return true;
    } catch (err) {
      console.error('Error generating embeddings:', err);
      setError('Failed to generate embeddings. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update a document 
  const handleUpdateDocument = async (id: string, updates: Partial<Document>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.patch(`/documents/${id}`, updates);
      
      // Update the document in the state
      const updatedDocuments = documents.map(doc => 
        doc.id === id ? { ...doc, ...updates } : doc
      );
      
      setDocuments(updatedDocuments);
      return true;
    } catch (err) {
      console.error('Error updating document:', err);
      setError('Failed to update document. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle document favorite status
  const handleToggleFavorite = async (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (!doc) return false;
    
    const newFavoriteState = !doc.is_favorite;
    return handleUpdateDocument(id, { is_favorite: newFavoriteState });
  };

  // Search documents with semantic search
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      fetchDocuments();
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSearchQuery(query);
    
    try {
      // Build query parameters for filtering
      const params: Record<string, string | number> = { 
        query, 
        limit: 20 
      };
      
      if (selectedDatasetId) params.dataset_id = selectedDatasetId;
      if (selectedTagIds.length > 0) params.tag_ids = selectedTagIds.join(',');
      
      const response = await apiClient.get('/documents/search', { params });
      setDocuments(response.data.documents || []);
    } catch (err) {
      console.error('Error searching documents:', err);
      setError('Failed to search documents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new dataset
  const handleCreateDataset = async (name: string, description?: string) => {
    try {
      const response = await apiClient.post('/datasets', { name, description });
      const newDataset = response.data.dataset;
      setDatasets([...datasets, newDataset]);
      return newDataset.id;
    } catch (err) {
      console.error('Error creating dataset:', err);
      setError('Failed to create dataset. Please try again.');
      return null;
    }
  };

  // Create a new tag
  const handleCreateTag = async (name: string, color?: string) => {
    try {
      const response = await apiClient.post('/tags', { name, color });
      const newTag = response.data.tag;
      setTags([...tags, newTag]);
      return newTag.id;
    } catch (err) {
      console.error('Error creating tag:', err);
      setError('Failed to create tag. Please try again.');
      return null;
    }
  };

  // Get document counts by type
  const getDocumentCounts = () => {
    return {
      totalDocuments: documents.length,
      embeddedDocuments: documents.filter(d => d.embedding_status === 'completed').length,
      favoriteDocuments: documents.filter(d => d.is_favorite).length,
      datasetCount: datasets.length,
    };
  };

  // Filter documents based on active tab
  const getFilteredDocuments = () => {
    if (activeTab === 'favorites') {
      return documents.filter(doc => doc.is_favorite);
    } else if (activeTab === 'recent') {
      return [...documents].sort((a, b) => {
        if (!a.created_at) return 1;
        if (!b.created_at) return -1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }).slice(0, 10);
    }
    return documents;
  };

  const documentCounts = getDocumentCounts();
  const filteredDocuments = getFilteredDocuments();

  const handleTabChange = (tab: string) => {
    if (tab === 'all' || tab === 'recent' || tab === 'favorites') {
      setActiveTab(tab);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Document Management</h1>
            <p className="text-zinc-400">
              Upload, organize, and search documents for your chatbot interactions
            </p>
          </div>
        </div>
      </header>

      {/* Error message */}
      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-500 px-6 py-4 rounded-lg mb-6 shadow-sm">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <DocumentStats 
        totalDocuments={documentCounts.totalDocuments}
        embeddedDocuments={documentCounts.embeddedDocuments}
        favoriteDocuments={documentCounts.favoriteDocuments}
        datasetCount={documentCounts.datasetCount}
      />

      {/* Action Bar */}
      <DocumentActionBar
        viewMode={viewMode}
        activeTab={activeTab}
        numDocuments={documents.length}
        onViewModeChange={setViewMode}
        onCreateDocument={() => setShowCreateDocument(true)}
        onUploadDocument={() => setShowFileUploader(true)}
        onSearchChange={setSearchQuery}
        onShowFilters={() => setShowFilters(!showFilters)}
        onSelectDataset={setSelectedDatasetId}
        onSelectTags={setSelectedTagIds}
        onTabChange={handleTabChange}
        onShowDatasetManager={() => setShowDatasetManager(true)}
        onShowTagManager={() => setShowTagManager(true)}
      />

      {/* Filter and Search Bar */}
      <DocumentFilters 
        datasets={datasets}
        tags={tags}
        selectedDatasetId={selectedDatasetId}
        selectedTagIds={selectedTagIds}
        showFavorites={activeTab === 'favorites'}
        onSelectDataset={setSelectedDatasetId}
        onSelectTags={setSelectedTagIds}
        onToggleFavorites={(show) => setActiveTab(show ? 'favorites' : 'all')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content: Document List or Grid */}
        <div className={`${selectedDocument ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {viewMode === 'list' ? (
            <DocumentList 
              documents={filteredDocuments}
              selectedDocId={selectedDocId}
              isLoading={isLoading}
              onSelectDocument={setSelectedDocId}
              onDeleteDocument={handleDeleteDocument}
              onGenerateEmbedding={handleGenerateEmbedding}
              onToggleFavorite={handleToggleFavorite}
            />
          ) : (
            <DocumentGrid 
              documents={filteredDocuments}
              datasets={datasets}
              tags={tags}
              selectedDocId={selectedDocId}
              isLoading={isLoading}
              onSelectDocument={setSelectedDocId}
              onDeleteDocument={handleDeleteDocument}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
        </div>

        {/* Document Detail Panel */}
        {selectedDocument && (
          <div className="lg:col-span-1">
            <DocumentDetail 
              document={selectedDocument}
              analysis={analysis}
              datasets={datasets}
              tags={tags}
              isLoading={isLoading}
              onUpdate={handleUpdateDocument}
              onDelete={handleDeleteDocument}
              onGenerateEmbedding={handleGenerateEmbedding}
              onToggleFavorite={handleToggleFavorite}
              onClose={() => setSelectedDocId(null)}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showDatasetManager && (
        <DatasetManager 
          datasets={datasets}
          onCreateDataset={handleCreateDataset}
          onUpdateDataset={() => Promise.resolve(true)}
          onDeleteDataset={() => Promise.resolve(true)}
          onClose={() => setShowDatasetManager(false)}
        />
      )}
      
      {showTagManager && (
        <TagManager 
          tags={tags}
          onCreateTag={handleCreateTag}
          onUpdateTag={() => Promise.resolve(true)}
          onDeleteTag={() => Promise.resolve(true)}
          onClose={() => setShowTagManager(false)}
        />
      )}

      {showCreateDocument && (
        <CreateDocumentForm 
          isLoading={isLoading}
          datasets={datasets}
          tags={tags}
          onSubmit={handleAddDocument}
          onClose={() => setShowCreateDocument(false)}
        />
      )}

      {showFileUploader && (
        <EnhancedFileUploader 
          isLoading={isLoading}
          datasets={datasets}
          tags={tags}
          onUpload={uploadDocument}
          onUploadMultiple={uploadMultipleDocuments}
          onClose={() => setShowFileUploader(false)}
        />
      )}
    </div>
  );
}

// Helper function to get document type icon
function getDocumentTypeIcon(status: string | undefined) {
  switch (status) {
    case 'completed':
      return (
        <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
          <path d="M14 15h-1v-3h-2v3H9v-4.5h5V15zM8 16h8v1H8z"/>
        </svg>
      );
    case 'pending':
    case 'processing':
      return (
        <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
          <path d="M14 15h-1v-3h-2v3H9v-4.5h5V15zM8 16h8v1H8z"/>
        </svg>
      );
    case 'failed':
      return (
        <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
          <path d="M14 15h-1v-3h-2v3H9v-4.5h5V15zM8 16h8v1H8z"/>
        </svg>
      );
    default:
      return (
        <svg className="h-5 w-5 text-zinc-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
        </svg>
      );
  }
}

// Helper function to truncate text
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
} 