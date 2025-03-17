import React, { useState } from 'react';
import { Dataset } from '../../pages/DocumentsPage';
import { Tag } from './TagManager';
import DatasetSelector from './DatasetSelector';
import TagSelector from './TagSelector';

interface DocumentFormProps {
  isLoading: boolean;
  datasets: Dataset[];
  tags: Tag[];
  onSubmit: (document: { 
    name: string; 
    content: string; 
    type: string; 
    dataset_id?: string;
    tags?: string[];
  }) => Promise<boolean>;
}

const DocumentForm: React.FC<DocumentFormProps> = ({
  isLoading,
  datasets,
  tags,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('text');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatasetCreator, setShowDatasetCreator] = useState(false);
  const [showTagCreator, setShowTagCreator] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Document name is required');
      return;
    }
    
    if (!content.trim()) {
      setError('Document content is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const success = await onSubmit({
        name,
        content,
        type,
        dataset_id: selectedDatasetId || undefined,
        tags: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      });
      
      if (success) {
        // Reset form
        setName('');
        setContent('');
        setType('text');
        setSelectedDatasetId(null);
        setSelectedTagIds([]);
      }
    } catch (err) {
      setError('Failed to create document. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDataset = async () => {
    try {
      // Open dataset creator dialog
      setShowDatasetCreator(true);
      return null;
    } catch (err) {
      setError('Failed to create dataset');
      return null;
    }
  };

  const handleCreateTag = async () => {
    try {
      // Open tag creator dialog
      setShowTagCreator(true);
      return null;
    } catch (err) {
      setError('Failed to create tag');
      return null;
    }
  };

  return (
    <div className="bg-zinc-900 rounded-lg p-4">
      <h3 className="text-xl font-semibold mb-4">Create New Document</h3>
      
      {error && (
        <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-500 px-3 py-2 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="doc-name">
            Document Name <span className="text-red-500">*</span>
          </label>
          <input
            id="doc-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter document name"
            disabled={isLoading || isSubmitting}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="doc-type">
            Document Type
          </label>
          <select
            id="doc-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading || isSubmitting}
          >
            <option value="text">Text</option>
            <option value="note">Note</option>
            <option value="article">Article</option>
            <option value="code">Code</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Dataset (optional)
          </label>
          <DatasetSelector
            datasets={datasets}
            selectedDatasetId={selectedDatasetId}
            onSelect={setSelectedDatasetId}
            onCreateNew={handleCreateDataset}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Tags (optional)
          </label>
          <TagSelector
            tags={tags}
            selectedTagIds={selectedTagIds}
            onSelectTags={setSelectedTagIds}
            onCreateNew={handleCreateTag}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="doc-content">
            Document Content <span className="text-red-500">*</span>
          </label>
          <textarea
            id="doc-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-60 p-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter document content..."
            disabled={isLoading || isSubmitting}
            required
          />
        </div>
        
        <div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-600"
            disabled={isLoading || isSubmitting || !name.trim() || !content.trim()}
          >
            {isSubmitting ? 'Creating...' : 'Create Document'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentForm; 