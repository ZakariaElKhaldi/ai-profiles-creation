import React, { useState } from 'react';

// Tag interface to be used across different components
export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

interface TagManagerProps {
  tags: Tag[];
  onCreateTag: (name: string, color: string) => Promise<boolean>;
  onUpdateTag: (id: string, name: string, color: string) => Promise<boolean>;
  onDeleteTag: (id: string) => Promise<boolean>;
  onClose: () => void;
}

const TagManager: React.FC<TagManagerProps> = ({
  tags,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
  onClose,
}) => {
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6'); // Default blue
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Predefined colors
  const colorOptions = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#EC4899', // Pink
  ];

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      setError('Tag name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const success = await onCreateTag(newTagName.trim(), newTagColor);
      if (success) {
        setNewTagName('');
        setNewTagColor('#3B82F6');
      }
    } catch (err) {
      setError('Failed to create tag');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag || !editingTag.name.trim()) {
      setError('Tag name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const success = await onUpdateTag(
        editingTag.id,
        editingTag.name.trim(),
        editingTag.color
      );
      if (success) {
        setEditingTag(null);
      }
    } catch (err) {
      setError('Failed to update tag');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (confirm('Are you sure you want to delete this tag?')) {
      setIsSubmitting(true);
      setError(null);

      try {
        await onDeleteTag(tagId);
      } catch (err) {
        setError('Failed to delete tag');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center border-b border-zinc-700 p-4">
          <h2 className="text-xl font-bold">Manage Tags</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
            disabled={isSubmitting}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-500 px-3 py-2 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Create new tag */}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2">Create New Tag</h3>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2"
                disabled={isSubmitting}
              />
              <div className="relative">
                <div
                  className="w-8 h-8 rounded-full cursor-pointer"
                  style={{ backgroundColor: newTagColor }}
                />
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {colorOptions.map((color) => (
                <div
                  key={color}
                  className={`w-6 h-6 rounded-full cursor-pointer ${newTagColor === color ? 'ring-2 ring-white' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewTagColor(color)}
                />
              ))}
            </div>
            
            <button
              onClick={handleCreateTag}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              disabled={isSubmitting || !newTagName.trim()}
            >
              {isSubmitting ? 'Creating...' : 'Create Tag'}
            </button>
          </div>

          {/* List of existing tags */}
          <div>
            <h3 className="text-md font-medium mb-2">Existing Tags</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="bg-zinc-800 rounded-lg p-3 flex items-center justify-between"
                  >
                    {editingTag && editingTag.id === tag.id ? (
                      // Edit mode
                      <div className="flex-1 flex items-center space-x-2">
                        <input
                          type="text"
                          value={editingTag.name}
                          onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                          className="flex-1 bg-zinc-700 border border-zinc-600 rounded-lg px-2 py-1"
                          disabled={isSubmitting}
                        />
                        <div className="relative">
                          <div
                            className="w-6 h-6 rounded-full cursor-pointer"
                            style={{ backgroundColor: editingTag.color }}
                          />
                          <input
                            type="color"
                            value={editingTag.color}
                            onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span>{tag.name}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-1">
                      {editingTag && editingTag.id === tag.id ? (
                        <>
                          <button
                            onClick={handleUpdateTag}
                            className="p-1 text-green-500 hover:text-green-400"
                            disabled={isSubmitting}
                            title="Save"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setEditingTag(null)}
                            className="p-1 text-red-500 hover:text-red-400"
                            disabled={isSubmitting}
                            title="Cancel"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingTag(tag)}
                            className="p-1 text-zinc-400 hover:text-zinc-200"
                            disabled={isSubmitting}
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag.id)}
                            className="p-1 text-zinc-400 hover:text-red-500"
                            disabled={isSubmitting}
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-zinc-500 text-center py-4">No tags found</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagManager; 