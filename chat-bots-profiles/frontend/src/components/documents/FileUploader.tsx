import React, { useState, useRef, useCallback } from 'react';
import { Dataset } from '../../pages/DocumentsPage';
import { Tag } from './TagManager';
import DatasetSelector from './DatasetSelector';
import TagSelector from './TagSelector';

interface FileUploaderProps {
  isLoading: boolean;
  datasets: Dataset[];
  tags: Tag[];
  onUpload: (file: File, datasetId?: string, tagIds?: string[]) => Promise<boolean>;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  isLoading,
  datasets,
  tags,
  onUpload,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileArray = Array.from(e.target.files);
      validateAndSetFiles(fileArray);
    }
  };

  const validateAndSetFiles = (files: File[]) => {
    const validTypes = [
      'text/plain', 
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/markdown',
      'text/csv',
      'application/json',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/html',
      'application/xml'
    ];
    
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    files.forEach(file => {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const isValidType = validTypes.includes(file.type) || 
                          ['md', 'txt', 'pdf', 'docx', 'doc', 'csv', 'json', 'xls', 'xlsx', 'html', 'htm'].includes(fileExt || '');
      
      if (!isValidType) {
        invalidFiles.push(`${file.name} (${file.type || fileExt})`);
      } else if (file.size > 10 * 1024 * 1024) { // 10MB limit
        invalidFiles.push(`${file.name} (exceeds 10MB size limit)`);
      } else {
        validFiles.push(file);
      }
    });
    
    if (invalidFiles.length > 0) {
      setError(`Unsupported files: ${invalidFiles.join(', ')}. Please upload only supported document types.`);
    } else {
      setError(null);
    }
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) setDragActive(true);
  }, [dragActive]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    let successCount = 0;
    
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const success = await onUpload(file, selectedDatasetId || undefined, selectedTagIds.length > 0 ? selectedTagIds : undefined);
        if (success) successCount++;
        
        // Update progress
        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }
      
      // Reset after upload
      setSelectedFiles([]);
      setUploadProgress(0);
      
      // Show success message based on results
      if (successCount === selectedFiles.length) {
        setError(null);
      } else {
        setError(`Uploaded ${successCount} of ${selectedFiles.length} files successfully.`);
      }
    } catch (err) {
      setError('Error uploading files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    const fileType = file.type || file.name.split('.').pop()?.toLowerCase();
    
    if (fileType?.includes('pdf')) {
      return (
        <svg className="h-12 w-12 text-red-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.267 14.68c-.184 0-.308.018-.372.036v1.178c.076.018.171.023.302.023.479 0 .774-.242.774-.651 0-.366-.254-.586-.704-.586zm3.487.012c-.2 0-.33.018-.407.036v2.61c.077.018.201.018.313.018.817.006 1.349-.444 1.349-1.396.006-.83-.479-1.268-1.255-1.268z"/>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.498 16.19c-.309.29-.765.42-1.296.42a2.23 2.23 0 0 1-.308-.018v1.426H7v-3.936a7.558 7.558 0 0 1 1.235-.083c.563 0 .961.107 1.231.324.254.202.432.518.432.901 0 .382-.176.723-.4.966zm3.807 1.355c-.56.42-1.314.629-2.08.629-.566 0-.938-.033-1.194-.067v-3.96c.402-.042.888-.078 1.436-.078.889 0 1.391.211 1.791.6.43.419.684.946.684 1.793.006.896-.264 1.579-.637 2.083zM17 15h-2v1h1.5v1H15v2h-1v-4h3v1z"/>
        </svg>
      );
    } else if (fileType?.includes('word') || fileType?.includes('doc')) {
      return (
        <svg className="h-12 w-12 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
          <path d="M9.5 12H8v6h1.5v-2.25h2v-1.5h-2V13.5h2V12zM16 14a2 2 0 0 0-2-2h-1.5v6H14a2 2 0 0 0 2-2v-2zm-1.5 0v2a.5.5 0 0 1-.5.5h-.5v-3h.5a.5.5 0 0 1 .5.5z"/>
        </svg>
      );
    } else if (fileType?.includes('markdown') || fileType === 'md') {
      return (
        <svg className="h-12 w-12 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 13v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5h2v5h16v-5h2z"/>
          <path d="M14 13l-4-4v3H2v2h8v3l4-4zM18 4h-6v2h6v8h2V6a2 2 0 0 0-2-2z"/>
        </svg>
      );
    } else if (fileType?.includes('csv') || fileType?.includes('json')) {
      return (
        <svg className="h-12 w-12 text-green-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
          <path d="M14 15h-1v-3h-2v3H9v-4.5h5V15zM8 16h8v1H8z"/>
        </svg>
      );
    } else {
      return (
        <svg className="h-12 w-12 text-zinc-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
          <path d="M9 12h6v2H9zM9 16h6v2H9zM9 8h2v2H9z"/>
        </svg>
      );
    }
  };

  // Wrapper functions that return Promise<string | null>
  const handleCreateDatasetWrapper = async (): Promise<string | null> => {
    return null;
  };

  const handleCreateTagWrapper = async (): Promise<string | null> => {
    return null;
  };

  return (
    <div className="bg-zinc-900 rounded-xl p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-4">Upload Document</h3>
      
      {error && (
        <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-500 px-3 py-2 rounded-lg mb-4 text-sm">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}
      
      <div
        className={`border-2 border-dashed rounded-xl p-8 mb-4 text-center cursor-pointer transition-all ${
          dragActive 
            ? 'border-blue-500 bg-blue-900 bg-opacity-10' 
            : selectedFiles.length > 0
              ? 'border-green-500 bg-green-900 bg-opacity-10'
              : 'border-zinc-700 hover:border-zinc-500'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".txt,.pdf,.doc,.docx,.md,.csv,.json"
          multiple
          disabled={uploading || isLoading}
        />
        
        {selectedFiles.length === 0 ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-zinc-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h4 className="text-lg font-medium text-zinc-300 mb-2">Drag & drop files here</h4>
            <p className="text-zinc-500 text-sm">
              Supports PDF, Word, Text, Markdown, CSV, and JSON files up to 10MB
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <h4 className="text-lg font-medium text-zinc-300 mb-3">{selectedFiles.length} file(s) selected</h4>
            <div className="w-full max-h-36 overflow-y-auto mb-3">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-zinc-800 p-2 rounded-lg mb-2">
                  <div className="flex items-center">
                    {getFileIcon(file)}
                    <div className="ml-3 text-left">
                      <p className="text-sm font-medium truncate" style={{ maxWidth: '200px' }}>{file.name}</p>
                      <p className="text-xs text-zinc-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="text-zinc-400 hover:text-red-500 p-1"
                    disabled={uploading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <p className="text-zinc-500 text-xs">Click or drag to add more files</p>
          </div>
        )}
      </div>
      
      {uploading && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>Uploading files...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }} 
            />
          </div>
          {uploadProgress === 100 && (
            <p className="text-green-500 text-xs mt-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Upload complete
            </p>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Dataset (optional)</label>
          <div className="mb-3">
            <DatasetSelector
              datasets={datasets}
              selectedDatasetId={selectedDatasetId}
              onSelect={setSelectedDatasetId}
              onCreateNew={handleCreateDatasetWrapper}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Tags (optional)</label>
          <div>
            <TagSelector
              tags={tags}
              selectedTagIds={selectedTagIds}
              onSelectTags={setSelectedTagIds}
              onCreateNew={handleCreateTagWrapper}
            />
          </div>
        </div>
      </div>
      
      <button
        type="button"
        onClick={handleUpload}
        disabled={selectedFiles.length === 0 || uploading || isLoading}
        className="w-full py-3 px-4 flex justify-center items-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-600 disabled:text-zinc-400 transition-colors"
      >
        {uploading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Documents
          </>
        )}
      </button>
    </div>
  );
};

export default FileUploader; 