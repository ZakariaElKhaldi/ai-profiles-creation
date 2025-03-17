import React from 'react';
import { Document } from '../../pages/DocumentsPage';
import { Tag } from './TagManager';

interface DocumentItemProps {
  document: Document;
  selected: boolean;
  onSelect: (doc: Document) => void;
  onDeleteDocument: (docId: string) => void;
  onToggleFavorite: (docId: string, isFavorite: boolean) => void;
  onGenerateEmbeddings: (docId: string) => void;
  datasets: { [id: string]: string }; // Map of dataset IDs to names
  tags: Tag[];
}

const DocumentItem: React.FC<DocumentItemProps> = ({
  document,
  selected,
  onSelect,
  onDeleteDocument,
  onToggleFavorite,
  onGenerateEmbeddings,
  datasets,
  tags,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'DIV') {
      onSelect(document);
    }
  };

  const documentTags = tags.filter(tag => 
    document.tag_ids?.includes(tag.id)
  );

  const hasEmbeddings = document.embedding_status === 'completed';
  
  return (
    <div
      className={`p-3 border border-zinc-800 rounded-lg mb-2 cursor-pointer transition-colors ${
        selected ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-900 hover:bg-zinc-850'
      }`}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="font-medium text-zinc-200">{document.title}</h3>
            {document.is_favorite && (
              <span className="ml-2 text-yellow-500" title="Favorite">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </span>
            )}
          </div>
          {document.dataset_id && datasets[document.dataset_id] && (
            <div className="text-xs text-zinc-400 mt-1">
              Dataset: {datasets[document.dataset_id]}
            </div>
          )}
          
          {documentTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {documentTags.map(tag => (
                <span
                  key={tag.id}
                  className="px-1.5 py-0.5 text-xs rounded-md"
                  style={{ backgroundColor: tag.color + '30', color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          
          <div className="text-xs text-zinc-500 mt-2">
            {hasEmbeddings ? (
              <span className="text-green-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Embeddings Generated
              </span>
            ) : (
              <span className="text-zinc-500">No Embeddings</span>
            )}
          </div>
        </div>
        
        <div className="flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(document.id, !document.is_favorite);
            }}
            className={`p-1.5 rounded-md ${
              document.is_favorite ? 'text-yellow-500' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title={document.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
          
          {!hasEmbeddings && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGenerateEmbeddings(document.id);
              }}
              className="p-1.5 text-zinc-400 hover:text-blue-500 rounded-md"
              title="Generate Embeddings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteDocument(document.id);
            }}
            className="p-1.5 text-zinc-400 hover:text-red-500 rounded-md"
            title="Delete document"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentItem; 