import React, { useState, useRef, useEffect } from 'react';
import { 
  uploadDocument, 
  DocumentUploadResponse,
  fetchDatasets,
  fetchTags
} from '../../services/documentService';

interface Tag {
  id: string;
  name: string;
  color?: string;
}

interface Dataset {
  id: string;
  name: string;
  description?: string;
}

interface DocumentUploaderProps {
  onUploadComplete?: (document: DocumentUploadResponse) => void;
  onError?: (error: string) => void;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onUploadComplete,
  onError
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDatasets();
    loadTags();
  }, []);

  const loadDatasets = async () => {
    try {
      const datasets = await fetchDatasets();
      setDatasets(Array.isArray(datasets) ? datasets : []);
    } catch (error) {
      console.error('Error loading datasets:', error);
    }
  };

  const loadTags = async () => {
    try {
      const tags = await fetchTags();
      setTags(Array.isArray(tags) ? tags : []);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      await uploadFile(file);
    }
  };

  const toggleTag = (tagId: string) => {
    if (!Array.isArray(selectedTagIds)) {
      setSelectedTagIds([tagId]);
      return;
    }
    
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate progress (in a real app, you'd use XMLHttpRequest or fetch with progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 300);
      
      // Upload the file with dataset and tags
      const response = await uploadDocument(
        file, 
        selectedDatasetId || undefined, 
        Array.isArray(selectedTagIds) && selectedTagIds.length > 0 ? selectedTagIds : undefined
      );
      
      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Notify parent component
      onUploadComplete?.(response);
      
      // Reset after a short delay
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Error uploading document:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to upload document');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="mb-4">
      {/* Dataset and Tag Selection */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Dataset (Optional)
          </label>
          <select
            value={selectedDatasetId}
            onChange={(e) => setSelectedDatasetId(e.target.value)}
            className="w-full px-4 py-2 bg-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No Dataset</option>
            {Array.isArray(datasets) && datasets.map(dataset => (
              <option key={dataset.id} value={dataset.id}>
                {dataset.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tag Selection */}
      {Array.isArray(tags) && tags.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Tags (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
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
        </div>
      )}

      {/* File Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          className="hidden"
          multiple
          accept=".txt,.pdf,.docx,.csv"
        />
        
        {isUploading ? (
          <div className="space-y-2">
            <div className="w-full bg-zinc-700 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-zinc-400 text-sm">Uploading... {uploadProgress}%</p>
          </div>
        ) : (
          <>
            <svg
              className="w-12 h-12 mx-auto text-zinc-500 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-zinc-300 font-medium">
              Drag and drop files here, or click to select files
            </p>
            <p className="text-zinc-500 text-sm mt-1">
              Supported formats: TXT, PDF, DOCX, CSV
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentUploader; 