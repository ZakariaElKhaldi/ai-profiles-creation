import React, { useState, useRef } from 'react';
import { Dataset } from '../../pages/DocumentsPage';
import { Tag } from '../documents/TagManager';

interface EnhancedFileUploaderProps {
  isLoading: boolean;
  datasets: Dataset[];
  tags: Tag[];
  onUpload: (file: File, datasetId?: string, tagIds?: string[]) => Promise<boolean>;
  onUploadMultiple: (files: File[], datasetId?: string, tagIds?: string[]) => Promise<boolean>;
  onClose: () => void;
}

const EnhancedFileUploader: React.FC<EnhancedFileUploaderProps> = ({
  isLoading,
  datasets,
  tags,
  onUpload,
  onUploadMultiple,
  onClose
}) => {
  const [datasetId, setDatasetId] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles([...files, ...newFiles]);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  // Remove a file from the list
  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  // Handle tag selection
  const toggleTag = (tagId: string) => {
    const newSelectedTags = [...selectedTagIds];
    if (newSelectedTags.includes(tagId)) {
      const index = newSelectedTags.indexOf(tagId);
      if (index > -1) {
        newSelectedTags.splice(index, 1);
      }
    } else {
      newSelectedTags.push(tagId);
    }
    setSelectedTagIds(newSelectedTags);
  };

  // Upload files
  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload.');
      return;
    }

    // Validate file types - Updated to include CSV and more file types
    const allowedTypes = [
      'application/pdf', 
      'text/plain', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'text/markdown',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
      'text/html',
      'application/xml',
      'text/xml'
    ];
    
    // More flexible validation that checks file extensions if MIME type is not recognized
    const invalidFiles = files.filter(file => {
      // Check by MIME type first
      if (allowedTypes.some(type => file.type.includes(type))) {
        return false;
      }
      
      // If MIME type check fails, check by file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      return !['pdf', 'txt', 'doc', 'docx', 'md', 'csv', 'xls', 'xlsx', 'json', 'html', 'xml'].includes(extension || '');
    });
    
    if (invalidFiles.length > 0) {
      setError(`Unsupported file type(s): ${invalidFiles.map(f => f.name).join(', ')}. Please upload PDF, TXT, DOC, DOCX, MD, CSV, XLS, XLSX, JSON, HTML, or XML files.`);
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);
    
    try {
      // If there's only one file, use single upload
      if (files.length === 1) {
        const success = await onUpload(
          files[0], 
          datasetId || undefined, 
          selectedTagIds.length > 0 ? selectedTagIds : undefined
        );
        
        if (success) {
          onClose();
        } else {
          setError('Failed to upload file. Please try again.');
        }
      } else {
        // Otherwise use batch upload
        const success = await onUploadMultiple(
          files,
          datasetId || undefined,
          selectedTagIds.length > 0 ? selectedTagIds : undefined
        );
        
        if (success) {
          onClose();
        } else {
          setError('Failed to upload some files. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error uploading files:', err);
      setError('An error occurred while uploading files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upload Documents</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* File Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center ${
            dragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 dark:bg-gray-800'
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-400 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          
          <p className="mb-2 text-sm text-gray-700 dark:text-white">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-300">
            PDF, DOCX, TXT, MD, CSV, XLS, XLSX, JSON, HTML, XML (Max 10MB per file)
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.docx,.txt,.md,.csv,.xls,.xlsx,.json,.html,.xml"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Select Files
          </button>
        </div>
        
        {/* Selected Files */}
        {files.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-white mb-2">
              Selected Files ({files.length})
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-2 max-h-40 overflow-y-auto">
              {files.map((file, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div className="truncate text-sm max-w-xs text-gray-900 dark:text-gray-100">{file.name}</div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-500 hover:text-red-500 dark:text-gray-300 dark:hover:text-red-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Dataset Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
            Dataset (Optional)
          </label>
          <select
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">No Dataset</option>
            {datasets.map((dataset) => (
              <option key={dataset.id} value={dataset.id}>
                {dataset.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Tags Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
            Tags (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedTagIds.includes(tag.id)
                    ? 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800'
                    : 'bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                }`}
                style={selectedTagIds.includes(tag.id) ? {} : { borderLeftColor: tag.color, borderLeftWidth: '4px' }}
              >
                {tag.name}
              </button>
            ))}
            {tags.length === 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">No tags available</span>
            )}
          </div>
        </div>
        
        {/* Upload Progress */}
        {uploading && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Uploading: {uploadProgress}%</p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isLoading || uploading || files.length === 0}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
              isLoading || uploading || files.length === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-blue-700'
            }`}
          >
            {uploading ? 'Uploading...' : `Upload ${files.length > 0 ? `(${files.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFileUploader; 