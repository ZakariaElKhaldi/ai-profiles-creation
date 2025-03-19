import React from 'react';

interface UploadProgressProps {
  progress: number;
}

const UploadProgress: React.FC<UploadProgressProps> = ({ progress }) => {
  return (
    <div className="my-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-blue-700">Uploading...</span>
        <span className="text-sm font-medium text-blue-700">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {progress < 100 
          ? 'Your document is being uploaded...' 
          : 'Upload complete! Processing document...'
        }
      </p>
    </div>
  );
};

export default UploadProgress; 