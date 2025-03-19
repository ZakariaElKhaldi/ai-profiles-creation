import React from 'react';

interface UploadProgressProps {
  progress: number;
}

const UploadProgress: React.FC<UploadProgressProps> = ({ progress }) => {
  return (
    <div className="my-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-300">Uploading...</span>
        <span className="text-sm font-medium text-gray-300">{progress}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-400 mt-2">Please wait while your files are being uploaded</p>
    </div>
  );
};

export default UploadProgress; 