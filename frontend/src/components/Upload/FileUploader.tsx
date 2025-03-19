import React, { useState, useRef } from 'react';
import UploadProgress from './UploadProgress';

interface FileUploaderProps {
  profileId: string;
  onUploadComplete: () => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ profileId, onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedFileTypes = [
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    
    if (!allowedFileTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a PDF or CSV file.');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size exceeds 10MB limit.');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulating file upload with progress
    // This would be replaced with actual API call to backend
    try {
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setUploadProgress(i);
      }

      // Simulate successful upload
      console.log(`Uploading file ${selectedFile.name} to profile ${profileId}`);
      setIsUploading(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadComplete();
    } catch (err) {
      setError('Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Upload Document</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Upload a PDF or CSV file (max 10MB). The document will be processed and the data will be extracted for AI usage.
        </p>
        
        <div className="flex items-center justify-center w-full">
          <label 
            className="flex flex-col w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <div className="flex flex-col items-center justify-center pt-7">
              <svg 
                className="w-8 h-8 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>
              <p className="pt-1 text-sm text-gray-500">
                {selectedFile ? selectedFile.name : 'Drag and drop a file or click to browse'}
              </p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf,.csv,.xlsx,.xls" 
              onChange={handleFileChange} 
              disabled={isUploading}
              ref={fileInputRef}
            />
          </label>
        </div>
      </div>
      
      {isUploading && <UploadProgress progress={uploadProgress} />}
      
      {selectedFile && !isUploading && (
        <div className="flex justify-end mt-4">
          <button
            onClick={handleUpload}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition duration-200"
          >
            Upload Document
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploader; 