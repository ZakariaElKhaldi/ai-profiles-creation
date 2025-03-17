import React, { useState, useEffect } from 'react';
import { 
  fetchDocuments, 
  Document, 
  DocumentUploadResponse, 
  fetchDatasets,
  fetchTags,
  Tag,
  Dataset
} from '../../services/documentService';
import DocumentUploader from './DocumentUploader';
import DocumentStatusIndicator from './DocumentStatusIndicator';

export interface DocumentSelectorProps {
  selectedDocumentIds?: string[];
  onDocumentsSelected?: (documents: Document[]) => void;
  maxSelections?: number;
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  selectedDocumentIds = [],
  onDocumentsSelected,
  maxSelections = 10
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

  useEffect(() => {
    loadDocuments();
    loadDatasets();
    loadTags();
  }, []);

  useEffect(() => {
    // When selectedDocumentIds changes externally, update selectedDocs
    if (selectedDocumentIds && selectedDocumentIds.length > 0) {
      const docsToSelect = documents.filter(doc => selectedDocumentIds.includes(doc.id));
      setSelectedDocs(docsToSelect);
    }
  }, [selectedDocumentIds, documents]);

  useEffect(() => {
    // When selectedDatasetId or selectedTagIds change, reload documents
    loadDocuments();
  }, [selectedDatasetId, selectedTagIds]);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await fetchDocuments(searchQuery, selectedDatasetId, selectedTagIds);
      setDocuments(docs);
      
      // If we have preselected document IDs, select those documents
      if (selectedDocumentIds && selectedDocumentIds.length > 0) {
        const docsToSelect = docs.filter(doc => selectedDocumentIds.includes(doc.id));
        setSelectedDocs(docsToSelect);
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
      setDatasets(datasets);
    } catch (err) {
      console.error('Error loading datasets:', err);
    }
  };

  const loadTags = async () => {
    try {
      const tags = await fetchTags();
      setTags(tags);
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  };

  const handleSearch = () => {
    loadDocuments();
  };

  const toggleDocumentSelection = (doc: Document) => {
    let newSelectedDocs: Document[];
    
    if (selectedDocs.some(d => d.id === doc.id)) {
      // Remove document
      newSelectedDocs = selectedDocs.filter(d => d.id !== doc.id);
    } else {
      // Add document if under max selections
      if (selectedDocs.length >= maxSelections) {
        alert(`You can only select up to ${maxSelections} documents`);
        return;
      }
      newSelectedDocs = [...selectedDocs, doc];
    }
    
    setSelectedDocs(newSelectedDocs);
    
    // Notify parent component
    if (onDocumentsSelected) {
      onDocumentsSelected(newSelectedDocs);
    }
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-800 rounded-lg p-6 max-w-5xl w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Select Documents</h2>
          <button
            className="text-zinc-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

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
              {datasets.map(dataset => (
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
        {tags.length > 0 && (
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
            ) : documents.length === 0 ? (
              <div className="text-zinc-400 text-center py-4">No documents found</div>
            ) : (
              <div className="space-y-2">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className={`flex items-center p-3 rounded-lg cursor-pointer ${
                      selectedDocs.some(d => d.id === doc.id)
                        ? 'bg-blue-600/20 border border-blue-500'
                        : 'bg-zinc-700 border border-transparent hover:border-zinc-600'
                    } ${doc.metadata?.type === 'processing' ? 'opacity-70' : ''}`}
                    onClick={() => doc.metadata?.type !== 'processing' && toggleDocumentSelection(doc)}
                    onMouseEnter={() => handlePreviewDocument(doc)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocs.some(d => d.id === doc.id)}
                      onChange={() => {}} // Handled by the onClick on the li
                      className="mr-3"
                      disabled={doc.metadata?.type === 'processing'}
                    />
                    <div className="flex-1 min-w-0">
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
                        <span>{doc.metadata?.type} • {(doc.metadata?.size || 0 / 1024).toFixed(1)} KB</span>
                        {doc.metadata?.dataset_id && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded-full">
                            {doc.metadata.dataset_id}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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
                  <div>Size: {(previewDoc.metadata?.size || 0 / 1024).toFixed(1)} KB</div>
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
            {selectedDocs.length} of {maxSelections} documents selected
          </div>
          <div className="flex space-x-3">
            <button
              className="px-4 py-2 bg-zinc-700 text-white rounded-md hover:bg-zinc-600"
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Selected ({selectedDocs.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentSelector; 