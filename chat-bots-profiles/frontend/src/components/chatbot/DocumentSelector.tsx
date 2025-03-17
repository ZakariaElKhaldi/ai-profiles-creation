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
    loadDocuments();
    loadDatasets();
    loadTags();
  }, []);

  useEffect(() => {
    // When selectedDatasetId or selectedTagIds change, reload documents
    loadDocuments();
  }, [selectedDatasetId, selectedTagIds]);

  // Add a specific useEffect for uploaded documents
  useEffect(() => {
    loadUploadedDocuments();
  }, []);

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
      const docs = await fetchDocuments(searchQuery, selectedDatasetId, selectedTagIds);
      setDocuments(Array.isArray(docs) ? docs : []);
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
      // First try to load from regular document endpoint as it might include uploads too
      const apiDocs = await fetchDocuments();
      let uploadsFound = apiDocs.some(doc => doc.metadata?.source === 'upload');
      
      // If no uploads found in regular docs, try the dedicated uploads endpoint
      if (!uploadsFound) {
        const uploadsDocs = await fetchUploadsDocuments();
        
        // Only proceed if we got documents back
        if (Array.isArray(uploadsDocs) && uploadsDocs.length > 0) {
          setDocuments(prevDocs => {
            const existingIds = new Set(prevDocs.map(d => d.id));
            const newDocs = [...prevDocs];
            for (const doc of uploadsDocs) {
              if (!existingIds.has(doc.id)) {
                newDocs.push(doc);
              }
            }
            return newDocs;
          });
          
          console.log(`Added ${uploadsDocs.length} upload documents to selector`);
        }
      } else {
        console.log('Upload documents already included in main documents list');
      }
    } catch (err) {
      console.error('Error loading uploaded documents:', err);
      // Continue silently - don't show error to user as this is a supplementary function
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-800 rounded-lg p-6 max-w-5xl w-full max-h-[80vh] flex flex-col">
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

        {/* Filters and Search */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div>
            <select
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Datasets</option>
              {Array.isArray(datasets) && datasets.map(dataset => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex">
            <button
              onClick={() => setShowUploader(!showUploader)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {showUploader ? 'Hide Uploader' : 'Upload New'}
            </button>
          </div>
        </div>

        {/* Tag filters */}
        {Array.isArray(tags) && tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 rounded-full text-sm ${
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

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Document list */}
          <div className="w-1/2 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : error ? (
              <div className="text-red-400 text-center py-4">{error}</div>
            ) : !Array.isArray(documents) || documents.length === 0 ? (
              <div className="text-zinc-400 text-center py-4">No documents found</div>
            ) : (
              <div className="space-y-2">
                {/* Uploaded documents section */}
                {documents.some(doc => doc.metadata?.source === 'upload') && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Uploaded Documents
                    </div>
                    {documents
                      .filter(doc => doc.metadata?.source === 'upload')
                      .map(doc => (
                        <div
                          key={doc.id}
                          className={`flex flex-col p-3 rounded-lg cursor-pointer ${
                            isDocumentSelected(doc.id)
                              ? 'bg-blue-600/30 border-2 border-blue-500 shadow-md shadow-blue-900/30'
                              : 'bg-zinc-700 border border-transparent hover:border-zinc-600'
                          } ${doc.metadata?.type === 'processing' ? 'opacity-70' : ''}`}
                          onClick={() => selectionMode === 'multiple' && doc.metadata?.type !== 'processing' && toggleDocumentSelection(doc)}
                          onMouseEnter={() => handlePreviewDocument(doc)}
                        >
                          <div className="flex items-center">
                            {selectionMode === 'multiple' && (
                              <div className="mr-3 flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={isDocumentSelected(doc.id)}
                                  onChange={() => doc.metadata?.type !== 'processing' && toggleDocumentSelection(doc)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                  disabled={doc.metadata?.type === 'processing'}
                                />
                              </div>
                            )}
                          
                            <div className="flex-1 min-w-0 relative">
                              {isDocumentSelected(doc.id) && selectionMode === 'multiple' && (
                                <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                  {Array.isArray(selectedDocs) ? selectedDocs.findIndex(d => d.id === doc.id) + 1 : '✓'}
                                </div>
                              )}
                              
                              <div className="flex items-center">
                                <div className="font-medium text-white truncate mr-2">{doc.name}</div>
                                {doc.metadata?.type && (
                                  <span className="px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded-full">
                                    {doc.metadata.type}
                                  </span>
                                )}
                              </div>
                              {doc.metadata?.chunk_count && (
                                <div className="text-sm text-zinc-400 truncate">
                                  {doc.metadata.chunk_count} chunks
                                </div>
                              )}
                              <div className="flex items-center text-xs text-zinc-500">
                                <span>
                                  {doc.metadata?.created_at && new Date(doc.metadata.created_at).toLocaleDateString()}
                                  {doc.metadata?.size && ` • ${(doc.metadata.size / 1024).toFixed(1)} KB`}
                                </span>
                              </div>
                            </div>
                          </div>
                          {onDocumentSelected && selectionMode === 'single' && (
                            <div className="mt-2 pt-2 border-t border-zinc-600/50 flex justify-end">
                              <button
                                onClick={() => handleAddDocumentToProfile(doc)}
                                disabled={isDocumentAdded(doc.id)}
                                className={`px-2 py-1 text-xs rounded-md ${
                                  isDocumentAdded(doc.id)
                                    ? 'bg-green-900/30 text-green-400 cursor-default'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                {isDocumentAdded(doc.id) ? 'Added to Profile' : 'Add to Profile'}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                  </>
                )}
                
                {/* Other documents section */}
                {documents.some(doc => doc.metadata?.source !== 'upload') && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider mt-4">
                      Other Documents
                    </div>
                    {documents
                      .filter(doc => doc.metadata?.source !== 'upload')
                      .map(doc => (
                        <div
                          key={doc.id}
                          className={`flex flex-col p-3 rounded-lg cursor-pointer ${
                            isDocumentSelected(doc.id)
                              ? 'bg-blue-600/30 border-2 border-blue-500 shadow-md shadow-blue-900/30'
                              : 'bg-zinc-700 border border-transparent hover:border-zinc-600'
                          } ${doc.metadata?.type === 'processing' ? 'opacity-70' : ''}`}
                          onClick={() => selectionMode === 'multiple' && doc.metadata?.type !== 'processing' && toggleDocumentSelection(doc)}
                          onMouseEnter={() => handlePreviewDocument(doc)}
                        >
                          <div className="flex items-center">
                            {selectionMode === 'multiple' && (
                              <div className="mr-3 flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={isDocumentSelected(doc.id)}
                                  onChange={() => doc.metadata?.type !== 'processing' && toggleDocumentSelection(doc)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                  disabled={doc.metadata?.type === 'processing'}
                                />
                              </div>
                            )}
                            
                            {/* Add a selection badge if selected */}
                            <div className="flex-1 min-w-0 relative">
                              {isDocumentSelected(doc.id) && selectionMode === 'multiple' && (
                                <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                  {Array.isArray(selectedDocs) ? selectedDocs.findIndex(d => d.id === doc.id) + 1 : '✓'}
                                </div>
                              )}
                              
                              <div className="flex items-center">
                                <div className="font-medium text-white truncate mr-2">{doc.name}</div>
                                {doc.metadata?.type && (
                                  <DocumentStatusIndicator status={doc.metadata.type as "processing" | "processed" | "failed"} />
                                )}
                              </div>
                              {doc.metadata?.source && (
                                <div className="text-sm text-zinc-400 truncate">{doc.metadata.source}</div>
                              )}
                              <div className="flex items-center text-xs text-zinc-500">
                                <span>{doc.metadata?.type} • {doc.metadata?.size ? (doc.metadata.size / 1024).toFixed(1) : '0'} KB</span>
                                {doc.metadata?.dataset_id && (
                                  <span className="ml-2 px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded-full">
                                    {doc.metadata.dataset_id}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {onDocumentSelected && selectionMode === 'single' && (
                            <div className="mt-2 pt-2 border-t border-zinc-600/50 flex justify-end">
                              <button
                                onClick={() => handleAddDocumentToProfile(doc)}
                                disabled={isDocumentAdded(doc.id) || doc.metadata?.type === 'processing'}
                                className={`px-2 py-1 text-xs rounded-md ${
                                  isDocumentAdded(doc.id)
                                    ? 'bg-green-900/30 text-green-400 cursor-default'
                                    : doc.metadata?.type === 'processing'
                                    ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                {isDocumentAdded(doc.id) ? 'Added to Profile' : 'Add to Profile'}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Preview panel */}
          <div className="w-1/2 bg-zinc-900 rounded-lg p-4 overflow-y-auto">
            {previewDoc ? (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{previewDoc.name}</h3>
                <div className="text-sm text-zinc-400 mb-4">
                  <div>Type: {previewDoc.metadata?.type}</div>
                  <div>Size: {previewDoc.metadata?.size ? (previewDoc.metadata.size / 1024).toFixed(1) : '0'} KB</div>
                  <div>Uploaded: {new Date(previewDoc.metadata?.created_at || '').toLocaleDateString()}</div>
                  {previewDoc.metadata?.dataset_id && <div>Dataset: {previewDoc.metadata.dataset_id}</div>}
                </div>
                <div className="prose prose-invert max-w-none">
                  <div className="text-zinc-300 whitespace-pre-wrap font-mono text-sm max-h-96 overflow-y-auto p-3 bg-zinc-800 rounded">
                    {previewDoc.content ? (
                      previewDoc.content.length > 500 
                        ? previewDoc.content.substring(0, 500) + '...' 
                        : previewDoc.content
                    ) : (
                      <span className="text-zinc-500 italic">No preview available</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-zinc-400 text-center py-4">
                Hover over a document to see its preview
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