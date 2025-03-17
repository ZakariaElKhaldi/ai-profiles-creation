import React, { useState, useEffect } from 'react';
import { 
  fetchDocuments, 
  Document, 
  DocumentUploadResponse, 
  fetchDatasets,
  fetchTags,
  fetchUploadsDocuments,
  Tag,
  Dataset
} from '../../services/documentService';
import DocumentUploader from './DocumentUploader';
import DocumentStatusIndicator from './DocumentStatusIndicator';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export interface DocumentSelectorProps {
  onDocumentsSelected?: (documents: Document[]) => void;
  onDocumentSelected?: (document: Document) => void;
  selectedDocumentIds?: string[];
  profileId?: string;
  maxSelections?: number;
  onCancel?: () => void;
  selectionMode?: 'single' | 'multiple';
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  onDocumentsSelected,
  onDocumentSelected,
  selectedDocumentIds,
  profileId,
  maxSelections = 10,
  onCancel,
  selectionMode = 'single'
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Document[]>([]);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [addedDocuments, setAddedDocuments] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load all document sources on component mount
    loadDocuments();
    loadDatasets();
    loadTags();
    
    // Load uploaded documents separately to avoid race conditions
    setTimeout(() => {
      loadUploadedDocuments();
    }, 100);
  }, []);

  useEffect(() => {
    // When selectedDatasetId or selectedTagIds change, reload documents
    loadDocuments();
  }, [selectedDatasetId, selectedTagIds]);

  useEffect(() => {
    if (selectedDocumentIds && selectedDocumentIds.length > 0 && documents.length > 0) {
      const docsToSelect = documents.filter(doc => 
        selectedDocumentIds.includes(doc.id)
      );
      setSelectedDocs(docsToSelect);
    }
  }, [selectedDocumentIds, documents]);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading documents with filters:', { searchQuery, selectedDatasetId, selectedTagIds });
      const docs = await fetchDocuments(searchQuery, selectedDatasetId, selectedTagIds);
      
      console.log(`Fetched ${Array.isArray(docs) ? docs.length : 0} documents from API`);
      
      if (Array.isArray(docs)) {
        setDocuments(prevDocs => {
          // Make sure we don't have duplicates when combining with existing documents
          const existingIds = new Set(prevDocs.filter(d => d.metadata?.source !== 'api').map(d => d.id));
          const newDocs = [...prevDocs.filter(d => d.metadata?.source !== 'api')];
          
          let addedCount = 0;
          for (const doc of docs) {
            if (!existingIds.has(doc.id)) {
              newDocs.push(doc);
              existingIds.add(doc.id);
              addedCount++;
            }
          }
          
          console.log(`Added ${addedCount} API documents to document selector`);
          return newDocs;
        });
      } else {
        console.warn('fetchDocuments did not return an array:', docs);
        setDocuments([]);
      }
    } catch (err) {
      setError('Failed to load documents');
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDatasets = async () => {
    try {
      const datasets = await fetchDatasets();
      setDatasets(Array.isArray(datasets) ? datasets : []);
    } catch (err) {
      console.error('Error loading datasets:', err);
    }
  };

  const loadTags = async () => {
    try {
      const tags = await fetchTags();
      setTags(Array.isArray(tags) ? tags : []);
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  };

  const loadUploadedDocuments = async () => {
    try {
      console.log('Attempting to fetch uploaded documents...');
      
      let data;
      
      // Try with fetch API first
      try {
        // Use the exact endpoint path from backend/app/api/document.py
        const response = await fetch(`${API_BASE_URL}/api/documents/uploads/`);
        
        if (!response.ok) {
          console.warn(`First attempt failed: ${response.status}. Trying alternate URL format...`);
          // Try alternate URL format
          const altResponse = await fetch(`${API_BASE_URL}/documents/uploads/`);
          
          if (!altResponse.ok) {
            throw new Error(`Failed to fetch uploads: ${altResponse.status} ${altResponse.statusText}`);
          }
          
          data = await altResponse.json();
        } else {
          data = await response.json();
        }
        
        console.log(`Successfully fetched uploads data with fetch API:`, data);
      } catch (fetchErr) {
        console.log('Fetch API failed, trying axios:', fetchErr);
        // Try with axios as fallback, first with /api prefix
        try {
          const axiosResponse = await axios.get(`${API_BASE_URL}/api/documents/uploads/`);
          data = axiosResponse.data;
        } catch (axiosErr) {
          // Try without /api prefix
          const axiosAltResponse = await axios.get(`${API_BASE_URL}/documents/uploads/`);
          data = axiosAltResponse.data;
        }
        console.log(`Successfully fetched uploads data with axios:`, data);
      }
      
      if (data && data.documents) {
        console.log(`Found ${Object.keys(data.documents).length} documents in uploads index`);
        
        // Convert the uploads data into Document objects - index.json has a different structure
        const uploadsDocs: Document[] = Object.entries(data.documents).map(([id, docData]: [string, any]) => {
          console.log("Processing document:", id, docData);
          
          // Handle potential null values and missing fields
          const filename = docData.filename || id;
          const fileExt = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() : 'unknown';
          
          return {
            id,
            name: filename,
            content: '', // Content will be loaded on demand
            metadata: {
              source: 'upload',
              type: fileExt,
              size: docData.size || 0,
              created_at: docData.timestamp ? new Date(docData.timestamp * 1000).toISOString() : new Date().toISOString(),
              chunk_count: docData.chunk_count || 0
            }
          };
        });
        
        console.log(`Converted ${uploadsDocs.length} upload documents to Document objects:`, uploadsDocs);
        
        // Add these documents to state, but be careful with existing documents
        setDocuments(prevDocs => {
          // Only keep documents that are not uploads from the previous state
          const existingDocs = prevDocs.filter(doc => doc.metadata?.source !== 'upload');
          const existingIds = new Set(existingDocs.map(d => d.id));
          
          // Combine with uploads, avoiding duplicates
          const newDocs = [...existingDocs];
          let addedCount = 0;
          
          for (const doc of uploadsDocs) {
            if (!existingIds.has(doc.id)) {
              newDocs.push(doc);
              existingIds.add(doc.id);
              addedCount++;
            }
          }
          
          console.log(`Added ${addedCount} new upload documents to selector. Total documents: ${newDocs.length}`);
          return newDocs;
        });
      } else {
        console.log('No upload documents found in the response:', data);
      }
    } catch (err) {
      console.error('Error loading uploaded documents:', err);
      // If the dedicated endpoint fails, try the regular documents API as fallback
      try {
        console.log('Trying fallback: fetching uploaded documents from main API...');
        const docs = await fetchDocuments();
        const uploadsFound = Array.isArray(docs) ? docs.filter(doc => doc.metadata?.source === 'upload') : [];
        
        if (uploadsFound.length > 0) {
          console.log(`Found ${uploadsFound.length} uploaded documents in main API`);
          
          // Add these documents to state, but be careful with existing documents
          setDocuments(prevDocs => {
            // Remove any existing uploads first to avoid duplicates
            const existingDocs = prevDocs.filter(doc => doc.metadata?.source !== 'upload');
            const existingIds = new Set(existingDocs.map(d => d.id));
            
            // Combine with uploads, avoiding duplicates
            const newDocs = [...existingDocs];
            let addedCount = 0;
            
            for (const doc of uploadsFound) {
              if (!existingIds.has(doc.id)) {
                newDocs.push(doc);
                existingIds.add(doc.id);
                addedCount++;
              }
            }
            
            console.log(`Added ${addedCount} upload documents from API. Total documents: ${newDocs.length}`);
            return newDocs;
          });
        } else {
          console.log('No uploaded documents found in main API either');
        }
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }
    }
  };

  const handleSearch = () => {
    loadDocuments();
  };

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handlePreviewDocument = (doc: Document) => {
    setPreviewDoc(doc);
  };

  const handleUploadComplete = (document: DocumentUploadResponse) => {
    // Reload documents after upload
    loadDocuments();
    setUploadError(null);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
  };

  const handleAddDocumentToProfile = (doc: Document) => {
    if (onDocumentSelected) {
      onDocumentSelected(doc);
      // Mark as added
      setAddedDocuments(prev => new Set(prev).add(doc.id));
    }
  };

  const isDocumentAdded = (docId: string) => {
    return addedDocuments.has(docId);
  };

  const toggleDocumentSelection = (doc: Document) => {
    let newSelectedDocs: Document[];
    
    if (selectedDocs.some(d => d.id === doc.id)) {
      // Remove document if already selected
      newSelectedDocs = selectedDocs.filter(d => d.id !== doc.id);
    } else {
      // Add document if not at max selections
      if (selectionMode === 'multiple' && selectedDocs.length >= maxSelections) {
        alert(`You can only select up to ${maxSelections} documents`);
        return;
      }
      
      // If single mode, replace selection. If multiple mode, add to selection
      newSelectedDocs = selectionMode === 'single' 
        ? [doc] 
        : [...selectedDocs, doc];
    }
    
    setSelectedDocs(newSelectedDocs);
    
    // Notify parent component for multiple selections
    if (onDocumentsSelected) {
      onDocumentsSelected(newSelectedDocs);
    }
  };

  const isDocumentSelected = (docId: string) => {
    return selectedDocs.some(doc => doc.id === docId);
  };

  const handleConfirmSelection = () => {
    if (onDocumentsSelected && Array.isArray(selectedDocs) && selectedDocs.length > 0) {
      onDocumentsSelected(selectedDocs);
    }
    onCancel?.();
  };

  // Document item render function for reuse in both sections
  const renderDocumentItem = (doc: Document) => (
    <div
      key={doc.id}
      className={`flex p-2 rounded-md cursor-pointer transition-all ${
        isDocumentSelected(doc.id)
          ? 'bg-blue-600/30 border-l-4 border-blue-500 pl-3 shadow-md shadow-blue-900/20'
          : 'bg-zinc-700 hover:bg-zinc-600/70 border-l-4 border-transparent'
      } ${doc.metadata?.type === 'processing' ? 'opacity-70' : ''}`}
      onClick={() => {
        if (doc.metadata?.type !== 'processing') {
          if (selectionMode === 'multiple') {
            toggleDocumentSelection(doc);
          } else {
            // For single selection mode, just select this doc and notify parent
            setSelectedDocs([doc]);
            if (onDocumentSelected) {
              onDocumentSelected(doc);
            }
            // Close the selector if in single mode
            if (onCancel) {
              onCancel();
            }
          }
        }
      }}
      onMouseEnter={() => handlePreviewDocument(doc)}
    >
      <div className={`flex items-center w-full ${selectionMode === 'multiple' ? 'gap-2' : ''}`}>
        {selectionMode === 'multiple' && (
          <div className="flex-shrink-0">
            <input
              type="checkbox"
              checked={isDocumentSelected(doc.id)}
              onChange={() => doc.metadata?.type !== 'processing' && toggleDocumentSelection(doc)}
              className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500"
              disabled={doc.metadata?.type === 'processing'}
            />
          </div>
        )}
      
        <div className="flex-1 min-w-0 relative">
          {isDocumentSelected(doc.id) && selectionMode === 'multiple' && (
            <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
              {Array.isArray(selectedDocs) ? selectedDocs.findIndex(d => d.id === doc.id) + 1 : '✓'}
            </div>
          )}
          
          <div className="flex flex-col">
            <div className="font-medium text-white text-sm truncate">{doc.name}</div>
            <div className="flex items-center text-xs text-zinc-400 gap-1">
              {doc.metadata?.type && (
                doc.metadata.source === 'upload' ? (
                  <span className="px-1.5 py-0.5 bg-green-600/20 text-green-400 text-xs rounded">
                    {doc.metadata.type}
                  </span>
                ) : (
                  <DocumentStatusIndicator status={doc.metadata.type as "processing" | "processed" | "failed"} />
                )
              )}
              <span className="text-zinc-500 text-xs">
                {doc.metadata?.source === 'upload' ? (
                  <>
                    {doc.metadata?.created_at && new Date(doc.metadata.created_at).toLocaleDateString()}
                    {doc.metadata?.size && ` • ${(doc.metadata.size / 1024).toFixed(1)} KB`}
                  </>
                ) : (
                  <>
                    {doc.metadata?.source} • {doc.metadata?.size ? (doc.metadata.size / 1024).toFixed(1) : '0'} KB
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-800 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            {selectionMode === 'multiple' ? 'Select Documents' : 'Browse Documents'}
          </h2>
          <button
            className="text-zinc-400 hover:text-white"
            onClick={onCancel}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Add selection mode indicator */}
        {selectionMode === 'multiple' && (
          <div className="mb-4 bg-blue-900/30 text-blue-300 p-2 rounded-md">
            <p className="text-sm">
              Selection mode: <span className="font-semibold">Multiple</span> — You can select up to {maxSelections} documents.
              Currently selected: {selectedDocs.length}
            </p>
          </div>
        )}

        {/* Filters and Search - Make more compact */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="flex-1 px-3 py-2 bg-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">All Datasets</option>
              {Array.isArray(datasets) && datasets.map(dataset => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setShowUploader(!showUploader)}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
            >
              {showUploader ? 'Hide' : 'Upload'}
            </button>
          </div>
        </div>

        {/* Tag filters - Make more compact */}
        {Array.isArray(tags) && tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-2 py-1 rounded-full text-xs ${
                  selectedTagIds.includes(tag.id)
                    ? `bg-${tag.color || 'blue'}-600 text-white`
                    : `bg-zinc-700 text-zinc-300 hover:bg-zinc-600`
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}

        {showUploader && (
          <>
            <DocumentUploader
              onUploadComplete={handleUploadComplete}
              onError={handleUploadError}
            />
            {uploadError && (
              <div className="bg-red-900/50 border border-red-800 text-red-200 p-3 mb-4 rounded-lg">
                {uploadError}
              </div>
            )}
          </>
        )}

        {/* Document list and preview section */}
        <div className="flex-1 flex gap-3 min-h-0">
          {/* Document list section */}
          <div className="w-3/5 overflow-y-auto rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : error ? (
              <div className="text-red-400 text-center py-4">{error}</div>
            ) : !Array.isArray(documents) || documents.length === 0 ? (
              <div className="text-zinc-400 text-center py-12 bg-zinc-900/50 rounded-lg flex flex-col items-center">
                <svg className="w-12 h-12 mb-3 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No documents found</p>
                <button 
                  onClick={() => setShowUploader(true)}
                  className="mt-3 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Upload a document
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Uploaded documents section */}
                {documents.some(doc => doc.metadata?.source === 'upload') && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider sticky top-0 bg-zinc-800/80 backdrop-blur-sm z-10">
                      Uploaded Documents
                    </div>
                    <div className="space-y-1.5 mb-3">
                      {documents
                        .filter(doc => doc.metadata?.source === 'upload')
                        .map(renderDocumentItem)}
                    </div>
                  </>
                )}
                
                {/* Other documents section */}
                {documents.some(doc => doc.metadata?.source !== 'upload') && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider sticky top-0 bg-zinc-800/80 backdrop-blur-sm z-10">
                      Other Documents
                    </div>
                    <div className="space-y-1.5">
                      {documents
                        .filter(doc => doc.metadata?.source !== 'upload')
                        .map(renderDocumentItem)}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Preview panel - Make it narrower */}
          <div className="w-2/5 bg-zinc-900 rounded-lg p-3 overflow-y-auto">
            {previewDoc ? (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{previewDoc.name}</h3>
                <div className="text-sm text-zinc-400 mb-3">
                  <div>Type: {previewDoc.metadata?.type}</div>
                  <div>Size: {previewDoc.metadata?.size ? (previewDoc.metadata.size / 1024).toFixed(1) : '0'} KB</div>
                  {previewDoc.metadata?.created_at && 
                    <div>Uploaded: {new Date(previewDoc.metadata.created_at).toLocaleDateString()}</div>
                  }
                  {previewDoc.metadata?.dataset_id && <div>Dataset: {previewDoc.metadata.dataset_id}</div>}
                </div>
                <div className="prose prose-invert max-w-none">
                  <div className="text-zinc-300 whitespace-pre-wrap font-mono text-sm max-h-80 overflow-y-auto p-2 bg-zinc-800 rounded text-xs">
                    {previewDoc.content ? (
                      previewDoc.content.length > 300
                        ? previewDoc.content.substring(0, 300) + '...'
                        : previewDoc.content
                    ) : (
                      <span className="text-zinc-500 italic">No preview available</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-zinc-400 text-center py-12 flex flex-col items-center">
                <svg className="w-10 h-10 mb-2 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <p>Hover over a document to see its preview</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-4 pt-4 border-t border-zinc-700">
          <div className="text-zinc-400">
            {selectionMode === 'multiple' && (
              <>
                <span>{Array.isArray(selectedDocs) ? selectedDocs.length : 0} of {maxSelections} documents selected</span>
                {Array.isArray(selectedDocs) && selectedDocs.length > 0 && (
                  <div className="mt-2 text-xs">
                    <span className="text-zinc-500">Selected:</span>
                    <div className="flex flex-wrap gap-1 mt-1 max-w-md">
                      {selectedDocs.map((doc, index) => (
                        <div key={doc.id} className="bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded-full flex items-center">
                          <span className="truncate max-w-[150px]">{doc.name}</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDocumentSelection(doc);
                            }}
                            className="ml-1 text-blue-300 hover:text-blue-100"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              className="px-4 py-2 bg-zinc-700 text-white rounded-md hover:bg-zinc-600"
              onClick={onCancel}
            >
              Cancel
            </button>
            {selectionMode === 'multiple' && (
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleConfirmSelection}
                disabled={!Array.isArray(selectedDocs) || selectedDocs.length === 0}
              >
                Confirm Selection ({Array.isArray(selectedDocs) ? selectedDocs.length : 0})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentSelector; 