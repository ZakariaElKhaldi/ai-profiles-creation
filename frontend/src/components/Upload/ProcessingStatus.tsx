import React from 'react';

export type ProcessingStage = 'queued' | 'parsing' | 'extracting' | 'indexing' | 'complete' | 'failed';

interface ProcessingStatusProps {
  profileId: string;
  documentId: string;
  stage: ProcessingStage;
  progress?: number;
  error?: string;
  onComplete?: () => void;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  profileId,
  documentId,
  stage,
  progress = 0,
  error,
  onComplete
}) => {
  const getStageLabel = (stage: ProcessingStage): string => {
    switch (stage) {
      case 'queued': return 'Queued for Processing';
      case 'parsing': return 'Parsing Document';
      case 'extracting': return 'Extracting Information';
      case 'indexing': return 'Indexing Content';
      case 'complete': return 'Processing Complete';
      case 'failed': return 'Processing Failed';
      default: return 'Unknown Stage';
    }
  };

  const getStageDescription = (stage: ProcessingStage): string => {
    switch (stage) {
      case 'queued': 
        return 'Your document is in the processing queue and will be processed shortly.';
      case 'parsing': 
        return 'Reading and parsing the document structure and content.';
      case 'extracting': 
        return 'Extracting relevant information and data from the document.';
      case 'indexing': 
        return 'Indexing the extracted content for efficient AI querying.';
      case 'complete': 
        return 'Document has been fully processed and is ready for querying.';
      case 'failed': 
        return error || 'An error occurred during processing. Please try again.';
      default: 
        return 'Processing...';
    }
  };

  // Calculate completed stages (for the step indicator)
  const stages: ProcessingStage[] = ['queued', 'parsing', 'extracting', 'indexing', 'complete'];
  const currentStageIndex = stages.indexOf(stage);
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Document Processing</h3>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {getStageLabel(stage)}
          </span>
          {stage !== 'failed' && (
            <span className="text-sm font-medium text-gray-700">
              {stage === 'complete' ? '100%' : `${progress}%`}
            </span>
          )}
        </div>
        
        {stage !== 'failed' ? (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-300 ease-out ${
                stage === 'complete' ? 'bg-green-600' : 'bg-blue-600'
              }`}
              style={{ width: stage === 'complete' ? '100%' : `${progress}%` }}
            ></div>
          </div>
        ) : (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-red-600 h-2.5 rounded-full" style={{ width: '100%' }}></div>
          </div>
        )}
      </div>
      
      <div className="relative">
        <div className="flex justify-between mb-4">
          {stages.map((s, index) => (
            <div 
              key={s} 
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                index <= currentStageIndex 
                  ? (stage === 'failed' ? 'bg-red-500' : stage === 'complete' ? 'bg-green-500' : 'bg-blue-500') 
                  : 'bg-gray-300'
              } text-white text-xs`}
            >
              {index < currentStageIndex ? '✓' : index + 1}
            </div>
          ))}
        </div>
        
        <div className="absolute top-3 left-0 w-full z-[-1]">
          <div className="h-[2px] bg-gray-300 w-full"></div>
        </div>
        
        <div className="absolute top-3 left-0 z-[-1]">
          <div 
            className={`h-[2px] ${
              stage === 'failed' 
                ? 'bg-red-500' 
                : stage === 'complete' 
                  ? 'bg-green-500' 
                  : 'bg-blue-500'
            } transition-all duration-300 ease-out`}
            style={{ 
              width: currentStageIndex === 0 
                ? '0%' 
                : stage === 'complete'
                  ? '100%'
                  : `${(currentStageIndex / (stages.length - 1)) * 100}%`
            }}
          ></div>
        </div>
      </div>
      
      <div className="mt-6">
        <p className="text-sm text-gray-600">
          {getStageDescription(stage)}
        </p>
        
        {stage === 'complete' && onComplete && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={onComplete}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition duration-200"
            >
              Continue
            </button>
          </div>
        )}
        
        {stage === 'failed' && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition duration-200"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingStatus; 