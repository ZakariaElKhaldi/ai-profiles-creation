import React, { useState } from 'react';
import { Document, Dataset } from '../../pages/DocumentsPage';
import { Tag } from './TagManager';
import TagSelector from './TagSelector';
import DatasetSelector from './DatasetSelector';

interface DocumentViewerProps {
  document: Document;
  isLoading: boolean;
  datasets: Dataset[];
  tags: Tag[];
  onUpdate: (id: string, updates: Partial<Document>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onGenerateEmbedding: (id: string) => Promise<boolean>;
  onToggleFavorite: (id: string) => Promise<boolean>;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  isLoading,
  datasets,
  tags,
  onUpdate,
  onDelete,
  onGenerateEmbedding,
  onToggleFavorite,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(document.title);
  const [editedContent, setEditedContent] = useState(document.content);
  const [editedDatasetId, setEditedDatasetId] = useState<string | null>(document.dataset_id || null);
  const [editedTagIds, setEditedTagIds] = useState<string[]>(document.tag_ids || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatasetCreator, setShowDatasetCreator] = useState(false);
  const [showTagCreator, setShowTagCreator] = useState(false);

  // Handle saving changes
  const handleSave = async () => {
    if (!editedName.trim()) {
      setError('Document name is required');
      return;
    }
    
    const updates: Partial<Document> = {
      title: editedName,
      content: editedContent,
      dataset_id: editedDatasetId || undefined,
      tag_ids: editedTagIds,
    };
    
    setSaving(true);
    setError(null);
    
    try {
      const success = await onUpdate(document.id, updates);
      if (success) {
        setIsEditing(false);
      }
    } catch (err) {
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Handle dataset creation
  const handleCreateDataset = async () => {
    try {
      setShowDatasetCreator(true);
      return null;
    } catch (err) {
      setError('Failed to create dataset');
      return null;
    }
  };

  // Handle tag creation
  const handleCreateTag = async () => {
    try {
      setShowTagCreator(true);
      return null;
    } catch (err) {
      setError('Failed to create tag');
      return null;
    }
  };

  // Render dataset name
  const renderDatasetName = () => {
    if (!document.dataset_id) return 'No dataset';
    
    const dataset = datasets.find(d => d.id === document.dataset_id);
    return dataset ? dataset.name : 'Unknown dataset';
  };

  // Render tags
  const renderTags = () => {
    if (!document.tag_ids || document.tag_ids.length === 0) {
      return <span className="text-zinc-500">No tags</span>;
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {document.tag_ids.map((tagId: string) => {
          const tag = tags.find(t => t.id === tagId);
          if (!tag) return null;
          
          return (
            <span
              key={tag.id}
              className="px-2 py-1 text-xs rounded-lg"
              style={{ backgroundColor: tag.color + '30', color: tag.color }}
            >
              {tag.name}
            </span>
          );
        })}
      </div>
    );
  };

  const hasEmbeddings = document.embedding_status === 'completed';

  return (
    <div className="bg-zinc-900 rounded-lg p-4">
      <div className="flex justify-between items-start mb-4">
        {isEditing ? (
          <input
            type="text"
            value={editedName}
            onChange={e => setEditedName(e.target.value)}
            className="text-xl font-bold bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Document name"
            disabled={saving || isLoading}
          />
        ) : (
          <h2 className="text-xl font-bold">{document.title}</h2>
        )}
        
        <div className="flex space-x-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => onToggleFavorite(document.id)}
                className={`p-2 rounded-lg ${
                  document.is_favorite ? 'text-yellow-500' : 'text-zinc-400 hover:text-yellow-500'
                }`}
                title={document.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-zinc-400 hover:text-zinc-200 rounded-lg"
                title="Edit document"
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              {!hasEmbeddings && (
                <button
                  onClick={() => onGenerateEmbedding(document.id)}
                  className="p-2 text-zinc-400 hover:text-blue-500 rounded-lg"
                  title="Generate embeddings"
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => onDelete(document.id)}
                className="p-2 text-zinc-400 hover:text-red-500 rounded-lg"
                title="Delete document"
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-zinc-600"
                disabled={saving || isLoading || !editedName.trim()}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600"
                disabled={saving || isLoading}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-500 px-3 py-2 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium mb-1 text-zinc-400">Created</h3>
          <p className="text-sm">
            {document.created_at ? new Date(document.created_at).toLocaleString() : 'N/A'}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-1 text-zinc-400">Updated</h3>
          <p className="text-sm">
            {document.updated_at ? new Date(document.updated_at).toLocaleString() : 'N/A'}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-1 text-zinc-400">Type</h3>
          <p className="text-sm">{document.content.length > 100 ? 'Document' : 'Note'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-1 text-zinc-400">Embeddings</h3>
          <p className="text-sm">
            {hasEmbeddings ? (
              <span className="text-green-500">Generated</span>
            ) : (
              <span className="text-zinc-500">Not generated</span>
            )}
          </p>
        </div>
      </div>
      
      {isEditing ? (
        <div className="space-y-4 mb-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Dataset</h3>
            <DatasetSelector
              datasets={datasets}
              selectedDatasetId={editedDatasetId}
              onSelect={setEditedDatasetId}
              onCreateNew={handleCreateDataset}
            />
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-1">Tags</h3>
            <TagSelector
              tags={tags}
              selectedTagIds={editedTagIds}
              onSelectTags={setEditedTagIds}
              onCreateNew={handleCreateTag}
            />
          </div>
        </div>
      ) : (
        <div className="mb-4 grid grid-cols-1 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-1 text-zinc-400">Dataset</h3>
            <p className="text-sm">{renderDatasetName()}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-1 text-zinc-400">Tags</h3>
            {renderTags()}
          </div>
        </div>
      )}
      
      <div>
        <h3 className="text-sm font-medium mb-2 text-zinc-400">Content</h3>
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={e => setEditedContent(e.target.value)}
            className="w-full h-60 p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={saving || isLoading}
          />
        ) : (
          <div className="bg-zinc-800 rounded-lg p-3 max-h-60 overflow-y-auto whitespace-pre-wrap">
            {document.content}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer; 