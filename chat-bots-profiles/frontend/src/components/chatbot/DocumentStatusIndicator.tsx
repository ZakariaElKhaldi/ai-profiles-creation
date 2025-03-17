import React from 'react';

interface DocumentStatusIndicatorProps {
  status: 'processing' | 'processed' | 'failed';
}

const DocumentStatusIndicator: React.FC<DocumentStatusIndicatorProps> = ({ status }) => {
  let statusColor = '';
  let statusText = '';
  let icon = null;

  switch (status) {
    case 'processing':
      statusColor = 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
      statusText = 'Processing';
      icon = (
        <svg className="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
      break;
    case 'processed':
      statusColor = 'bg-green-600/20 text-green-400 border-green-600/30';
      statusText = 'Ready';
      icon = (
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
      break;
    case 'failed':
      statusColor = 'bg-red-600/20 text-red-400 border-red-600/30';
      statusText = 'Failed';
      icon = (
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
      break;
  }

  return (
    <div className={`inline-flex items-center px-2 py-1 text-xs rounded border ${statusColor}`}>
      {icon}
      <span>{statusText}</span>
    </div>
  );
};

export default DocumentStatusIndicator; 