import React from 'react';

export type ProcessingStage = 'parsing' | 'extracting' | 'indexing' | 'complete' | 'failed';

interface ProcessingStatusProps {
  profileId: string;
  documentId: string;
  stage: ProcessingStage;
  progress: number;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  profileId,
  documentId,
  stage,
  progress
}) => {
  const getStageLabel = (stage: ProcessingStage): string => {
    switch (stage) {
      case 'parsing':
        return 'Parsing Document';
      case 'extracting':
        return 'Extracting Content';
      case 'indexing':
        return 'Indexing for AI';
      case 'complete':
        return 'Processing Complete';
      case 'failed':
        return 'Processing Failed';
      default:
        return 'Unknown Stage';
    }
  };

  const getStageDescription = (stage: ProcessingStage): string => {
    switch (stage) {
      case 'parsing':
        return 'Converting your document to a format our system can understand.';
      case 'extracting':
        return 'Analyzing and extracting useful information from your document.';
      case 'indexing':
        return 'Organizing information to power AI responses for your queries.';
      case 'complete':
        return 'Your document has been successfully processed and is ready for AI queries.';
      case 'failed':
        return 'We encountered an issue while processing your document.';
      default:
        return 'No description available.';
    }
  };

  const getStatusColor = (stage: ProcessingStage): string => {
    switch (stage) {
      case 'complete':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const renderProgressBar = () => {
    if (stage === 'complete') {
      return (
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div className="bg-green-500 h-2 rounded-full w-full"></div>
        </div>
      );
    } else if (stage === 'failed') {
      return (
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div className="bg-red-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      );
    } else {
      return (
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      );
    }
  };

  const renderStageIndicator = (currentStage: ProcessingStage, thisStage: ProcessingStage) => {
    // Helper function to determine if this stage is completed
    const isCompleted = () => {
      const stages = ['parsing', 'extracting', 'indexing', 'complete'];
      const currentIndex = stages.indexOf(currentStage);
      const thisIndex = stages.indexOf(thisStage);
      
      return thisIndex < currentIndex || currentStage === thisStage && currentStage === 'complete';
    };
    
    // Helper function to determine if this is the current stage
    const isCurrent = () => currentStage === thisStage && currentStage !== 'complete';
    
    // Helper function to determine if this stage is upcoming
    const isUpcoming = () => {
      const stages = ['parsing', 'extracting', 'indexing', 'complete'];
      const currentIndex = stages.indexOf(currentStage);
      const thisIndex = stages.indexOf(thisStage);
      
      return thisIndex > currentIndex;
    };
    
    const getStageClass = () => {
      if (isCompleted()) {
        return 'bg-green-500 text-white border-green-500';
      } else if (isCurrent()) {
        return 'bg-blue-500 text-white border-blue-500';
      } else {
        return 'bg-gray-700 text-gray-400 border-gray-600';
      }
    };
    
    const getLineClass = () => {
      if (isCompleted()) {
        return 'border-green-500';
      } else {
        return 'border-gray-600';
      }
    };
    
    // Don't render a line after the last stage
    const showLine = thisStage !== 'complete';
    
    return (
      <>
        <div 
          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${getStageClass()}`}
        >
          {isCompleted() ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span>{thisStage.charAt(0).toUpperCase()}</span>
          )}
        </div>
        {showLine && (
          <div className={`flex-1 h-0 border-t-2 ${getLineClass()}`}></div>
        )}
      </>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
      <h3 className="text-xl font-semibold mb-2 text-gray-100">Document Processing</h3>
      
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-gray-300">Document ID: {documentId}</span>
        <span className={`text-sm font-medium ${getStatusColor(stage)}`}>
          {getStageLabel(stage)}
        </span>
      </div>
      
      {renderProgressBar()}
      
      <p className="my-4 text-sm text-gray-300">
        {getStageDescription(stage)}
      </p>
      
      <div className="mt-8">
        <div className="flex items-center justify-between w-full">
          {renderStageIndicator(stage, 'parsing')}
          {renderStageIndicator(stage, 'extracting')}
          {renderStageIndicator(stage, 'indexing')}
          {renderStageIndicator(stage, 'complete')}
        </div>
        
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-400">Parsing</span>
          <span className="text-xs text-gray-400">Extracting</span>
          <span className="text-xs text-gray-400">Indexing</span>
          <span className="text-xs text-gray-400">Complete</span>
        </div>
      </div>
      
      {stage === 'failed' && (
        <div className="mt-4 text-sm p-3 bg-red-900 bg-opacity-30 border border-red-800 rounded text-red-400">
          We encountered an error processing your document. Please try uploading it again.
        </div>
      )}
    </div>
  );
};

export default ProcessingStatus; 