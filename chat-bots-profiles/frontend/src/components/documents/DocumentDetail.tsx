import React from 'react';
import { Document, DocumentAnalysis, Dataset } from '../../pages/DocumentsPage';
import { Tag } from './TagManager';
import { Box, Button, IconButton, Typography, Chip, Paper, Divider } from '@mui/material';
import { Close, Edit, Delete, Star, StarBorder, Code } from '@mui/icons-material';

interface DocumentDetailProps {
  document: Document;
  analysis: DocumentAnalysis | null;
  datasets: Dataset[];
  tags: Tag[];
  isLoading: boolean;
  onUpdate: (id: string, updates: Partial<Document>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onGenerateEmbedding: (id: string) => Promise<boolean>;
  onToggleFavorite: (id: string) => Promise<boolean>;
  onClose: () => void;
}

const DocumentDetail: React.FC<DocumentDetailProps> = ({
  document,
  analysis,
  datasets,
  tags,
  isLoading,
  onUpdate,
  onDelete,
  onGenerateEmbedding,
  onToggleFavorite,
  onClose
}) => {
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  // Get document tags
  const documentTags = document.tag_ids
    .map(id => tags.find(tag => tag.id === id))
    .filter(tag => tag !== undefined) as Tag[];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1e2838] rounded-xl shadow-lg overflow-hidden flex flex-col max-w-2xl w-full max-h-[90vh] border border-zinc-700">
        <div className="bg-[#1e2838] p-4 flex justify-between items-center border-b border-zinc-700">
          <h3 className="text-lg font-medium text-[#99a1b0]">Document Details</h3>
          <button 
            className="text-[#99a1b0] hover:text-white"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-[#99a1b0]">
                {document.title || document.file_name || 'Untitled Document'}
              </h2>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {document.embedding_status && (
                  <span 
                    className={`px-2 py-1 text-xs rounded-full ${
                      document.embedding_status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : document.embedding_status === 'processing' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : document.embedding_status === 'failed' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-zinc-100 text-zinc-800'
                    }`}
                  >
                    {document.embedding_status}
                  </span>
                )}
                
                {documentTags.map(tag => (
                  <span 
                    key={tag.id}
                    className="px-2 py-1 text-xs rounded-full"
                    style={{ 
                      backgroundColor: `${tag.color}20`,
                      color: tag.color
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
              
              <div className="text-[#99a1b0] text-sm mb-4">
                <span>Created: {formatDate(document.created_at)}</span>
                {document.updated_at && (
                  <>
                    <span className="mx-2">•</span>
                    <span>Updated: {formatDate(document.updated_at)}</span>
                  </>
                )}
                {document.dataset_name && (
                  <>
                    <span className="mx-2">•</span>
                    <span>Dataset: {document.dataset_name}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-md font-medium text-[#99a1b0] mb-2">Content</h3>
              <div className="bg-[#1e2838] rounded-lg p-4 whitespace-pre-wrap break-words text-[#99a1b0] border border-zinc-700">
                {document.content || 'No content available'}
              </div>
            </div>
            
            {analysis && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-[#99a1b0] mb-2">Analysis</h3>
                <div className="bg-[#1e2838] rounded-lg p-4 border border-zinc-700">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-[#99a1b0]">Word Count</p>
                      <p className="text-lg font-medium text-[#99a1b0]">{analysis.word_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#99a1b0]">Reading Time</p>
                      <p className="text-lg font-medium text-[#99a1b0]">{analysis.reading_time} min</p>
                    </div>
                  </div>
                  
                  {analysis.key_phrases && analysis.key_phrases.length > 0 && (
                    <div>
                      <p className="text-xs text-[#99a1b0] mb-2">Key Phrases</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.key_phrases.map((phrase, index) => (
                          <span 
                            key={index}
                            className="bg-[#1e2838] text-[#99a1b0] px-2 py-1 text-xs rounded-full border border-zinc-700"
                          >
                            {phrase}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analysis.summary && (
                    <div className="mt-4">
                      <p className="text-xs text-[#99a1b0] mb-1">Summary</p>
                      <p className="text-sm text-[#99a1b0]">{analysis.summary}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-[#1e2838] p-4 mt-auto border-t border-zinc-700">
          <div className="flex justify-between">
            <div>
              <button 
                className="px-3 py-1 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none disabled:opacity-50"
                onClick={() => onDelete(document.id)}
                disabled={isLoading}
              >
                Delete
              </button>
            </div>
            
            <div className="space-x-2">
              <button 
                className="px-3 py-1 text-sm rounded-lg border focus:outline-none disabled:opacity-50 border-zinc-600 text-[#99a1b0] hover:bg-zinc-700"
                onClick={() => onToggleFavorite(document.id)}
                disabled={isLoading}
              >
                {document.is_favorite ? 'Unfavorite' : 'Favorite'}
              </button>
              
              {document.embedding_status !== 'completed' && document.embedding_status !== 'processing' && (
                <button 
                  className="px-3 py-1 text-sm rounded-lg bg-zinc-700 text-white hover:bg-zinc-600 focus:outline-none disabled:opacity-50"
                  onClick={() => onGenerateEmbedding(document.id)}
                  disabled={isLoading}
                >
                  Generate Embedding
                </button>
              )}
              
              <button 
                className="px-3 py-1 text-sm rounded-lg bg-zinc-700 text-white hover:bg-zinc-600 focus:outline-none disabled:opacity-50"
                onClick={() => {
                  // Implement edit functionality
                  console.log('Edit document:', document.id);
                }}
                disabled={isLoading}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail; 