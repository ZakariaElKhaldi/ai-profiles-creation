import React, { useState } from 'react';

interface Dataset {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
  color?: string;
}

interface CreateDocumentFormProps {
  isLoading: boolean;
  datasets: Dataset[];
  tags: Tag[];
  onSubmit: (document: { 
    title: string; 
    content: string; 
    dataset_id?: string; 
    tag_ids?: string[];
  }) => Promise<boolean>;
  onClose: () => void;
}

const CreateDocumentForm: React.FC<CreateDocumentFormProps> = ({
  isLoading,
  datasets,
  tags,
  onSubmit,
  onClose
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!content.trim()) {
      setError('Content is required');
      return;
    }
    
    setError(null);
    
    const success = await onSubmit({
      title: title.trim(),
      content: content.trim(),
      dataset_id: selectedDatasetId || undefined,
      tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined
    });
    
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-zinc-800 p-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">Create New Document</h3>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto">
          {error && (
            <div className="bg-red-900 bg-opacity-20 border border-red-500 text-red-500 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-zinc-400 mb-1">
                Document Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-800 text-white rounded-lg px-4 py-2 border border-zinc-700 focus:border-blue-500 focus:outline-none"
                placeholder="Enter document title"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-zinc-400 mb-1">
                Content *
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="w-full bg-zinc-800 text-white rounded-lg px-4 py-2 border border-zinc-700 focus:border-blue-500 focus:outline-none"
                placeholder="Enter document content"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="dataset" className="block text-sm font-medium text-zinc-400 mb-1">
                Dataset (optional)
              </label>
              <select
                id="dataset"
                value={selectedDatasetId || ''}
                onChange={(e) => setSelectedDatasetId(e.target.value || null)}
                className="w-full bg-zinc-800 text-white rounded-lg px-4 py-2 border border-zinc-700 focus:border-blue-500 focus:outline-none"
                disabled={isLoading}
              >
                <option value="">None</option>
                {datasets.map(dataset => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Tags (optional)
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleTag(tag.id)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedTagIds.includes(tag.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}
                    style={
                      tag.color && selectedTagIds.includes(tag.id)
                        ? { backgroundColor: tag.color }
                        : {}
                    }
                    disabled={isLoading}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>
        
        <div className="bg-zinc-800 p-4 mt-auto flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-700 focus:outline-none"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Document'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateDocumentForm; 