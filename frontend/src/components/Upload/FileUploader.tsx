import React, { useState, useRef } from 'react';
import UploadProgress from './UploadProgress';

interface FileUploaderProps {
  profileId: string;
  onUploadComplete: () => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ profileId, onUploadComplete }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFiles = Array.from(e.dataTransfer.files);
      setFiles(selectedFiles);
      setError(null);
    }
  };

  const handleUpload = () => {
    if (files.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const nextProgress = prev + 10;
        if (nextProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            setFiles([]);
            onUploadComplete();
          }, 500);
          return 100;
        }
        return nextProgress;
      });
    }, 500);
  };

  const handleCancel = () => {
    setFiles([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
      <h3 className="text-xl font-semibold mb-4 text-gray-100">Upload Files</h3>
      <p className="text-gray-300 mb-4">
        Upload PDF, DOCX, or TXT files to add to your AI profile's knowledge base.
      </p>

      {isUploading ? (
        <UploadProgress progress={uploadProgress} />
      ) : (
        <>
          <div
            className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-900"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              ref={fileInputRef}
              accept=".pdf,.docx,.txt"
            />
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-8m-12 0H8m12 0a4 4 0 01-4-4v-4m32 0h-4m-4 0h-8m-12 0h-4m4-4h32a4 4 0 000-8H12a4 4 0 00-4 4v4h4m4 0h12"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-400">
              Drag and drop files here, or click to select files
            </p>
            <p className="mt-1 text-xs text-gray-500">PDF, DOCX, TXT up to 10MB each</p>
          </div>

          {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}

          {files.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2 text-gray-300">Selected Files</h4>
              <ul className="space-y-2 max-h-40 overflow-y-auto bg-gray-850 rounded p-2">
                {files.map((file, index) => (
                  <li key={index} className="text-sm flex justify-between items-center text-gray-300">
                    <span className="truncate max-w-xs">{file.name}</span>
                    <span className="text-gray-400 ml-2">{formatFileSize(file.size)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 flex justify-end space-x-3">
            {files.length > 0 && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-600 rounded text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleUpload}
              className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700"
              disabled={files.length === 0}
            >
              Upload Files
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FileUploader; 