import React, { useState } from 'react';
import { Tag } from './TagManager';

interface TagSelectorProps {
  tags: Tag[];
  selectedTagIds: string[];
  onSelectTags: (selectedIds: string[]) => void;
  onCreateNew: () => Promise<string | null>;
}

const TagSelector: React.FC<TagSelectorProps> = ({
  tags,
  selectedTagIds,
  onSelectTags,
  onCreateNew,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTagClick = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onSelectTags(selectedTagIds.filter(id => id !== tagId));
    } else {
      onSelectTags([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = async () => {
    await onCreateNew();
  };

  return (
    <div className="relative">
      <div
        className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 flex flex-wrap gap-1 min-h-[40px] cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedTagIds.length > 0 ? (
          selectedTagIds.map(tagId => {
            const tag = tags.find(t => t.id === tagId);
            if (!tag) return null;

            return (
              <span
                key={tag.id}
                className="px-2 py-1 text-xs rounded-lg flex items-center"
                style={{ backgroundColor: tag.color + '30', color: tag.color }}
                onClick={e => {
                  e.stopPropagation();
                  handleTagClick(tag.id);
                }}
              >
                {tag.name}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 ml-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            );
          })
        ) : (
          <span className="text-zinc-500">Select tags...</span>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2">
            <input
              type="text"
              className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm"
              placeholder="Search tags..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredTags.length > 0 ? (
              <div className="p-2 space-y-1">
                {filteredTags.map(tag => (
                  <div
                    key={tag.id}
                    className={`px-3 py-2 rounded-lg cursor-pointer flex items-center ${
                      selectedTagIds.includes(tag.id) ? 'bg-zinc-700' : 'hover:bg-zinc-700'
                    }`}
                    onClick={e => {
                      e.stopPropagation();
                      handleTagClick(tag.id);
                    }}
                  >
                    <span
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: tag.color }}
                    ></span>
                    <span>{tag.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-zinc-500">
                No tags found
              </div>
            )}
          </div>
          <div className="p-2 border-t border-zinc-700">
            <button
              className="w-full px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm"
              onClick={e => {
                e.stopPropagation();
                handleCreateTag();
              }}
            >
              + Create new tag
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagSelector; 