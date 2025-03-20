import React, { useState, useEffect } from 'react';
import { documentService, Document } from '../../services/api/documents';

export type ProcessingStage = 'parsing' | 'extracting' | 'indexing' | 'complete' | 'failed';

interface ProcessingStatusProps {
  profileId: string;
  documentId?: string;
  stage?: ProcessingStage;
  progress?: number;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  profileId,
  documentId,
  stage: initialStage,
  progress: initialProgress
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load the most recent documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const response = await documentService.listDocuments(profileId);
        
        // Filter documents that are being processed
        const processingDocs = response.documents.filter(
          doc => doc.status === 'pending' || doc.status === 'processing'
        );
        
        // Sort by most recent
        processingDocs.sort((a, b) => 
          new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()
        );
        
        setDocuments(processingDocs);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError("Failed to load processing documents");
        setLoading(false);
      }
    };
    
    // Initial fetch
    fetchDocuments();
    
    // Set up polling every 3 seconds
    const intervalId = setInterval(fetchDocuments, 3000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [profileId]);

  const getStageLabel = (documentStatus: Document['status']): string => {
    switch (documentStatus) {
      case 'pending':
        return 'Parsing Document';
      case 'processing':
        return 'Extracting Content';
      case 'completed':
        return 'Processing Complete';
      case 'failed':
        return 'Processing Failed';
      default:
        return 'Unknown Stage';
    }
  };

  const getStageDescription = (documentStatus: Document['status']): string => {
    switch (documentStatus) {
      case 'pending':
        return 'Converting your document to a format our system can understand.';
      case 'processing':
        return 'Analyzing and extracting useful information from your document.';
      case 'completed':
        return 'Your document has been successfully processed and is ready for AI queries.';
      case 'failed':
        return 'We encountered an issue while processing your document.';
      default:
        return 'No description available.';
    }
  };

  const getStatusColor = (documentStatus: Document['status']): string => {
    switch (documentStatus) {
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const estimateProgress = (documentStatus: Document['status'], uploadDate: string): number => {
    if (documentStatus === 'completed') return 100;
    if (documentStatus === 'failed') return 100;
    
    // Calculate a time-based progress estimation
    const uploadTime = new Date(uploadDate).getTime();
    const now = new Date().getTime();
    const elapsedMs = now - uploadTime;
    
    // Assume processing takes about 30 seconds
    const expectedProcessingTime = 30000; // 30 seconds in ms
    const progress = Math.min(Math.floor((elapsedMs / expectedProcessingTime) * 100), 99);
    
    // Ensure a minimum progress
    return Math.max(progress, 5);
  };

  const renderProgressBar = (documentStatus: Document['status'], progress: number) => {
    if (documentStatus === 'completed') {
      return (
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div className="bg-green-500 h-2 rounded-full w-full"></div>
        </div>
      );
    } else if (documentStatus === 'failed') {
      return (
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div className="bg-red-500 h-2 rounded-full w-full"></div>
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

  const mapDocumentStatusToStage = (status: Document['status']): ProcessingStage => {
    switch (status) {
      case 'pending': return 'parsing';
      case 'processing': return 'extracting';
      case 'completed': return 'complete';
      case 'failed': return 'failed';
      default: return 'parsing';
    }
  };

  const renderStageIndicator = (currentStatus: Document['status'], thisStage: ProcessingStage) => {
    const currentStage = mapDocumentStatusToStage(currentStatus);
    
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

  // If loading, show a loading indicator
  if (loading && documents.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-gray-100">Document Processing</h3>
        <div className="flex justify-center items-center space-x-2 my-8">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse delay-100"></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse delay-200"></div>
        </div>
        <p className="text-center text-gray-400">Loading document processing status...</p>
      </div>
    );
  }

  // If no documents are processing, show a placeholder
  if (documents.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-gray-100">Document Processing</h3>
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-4 text-gray-300">No documents currently processing</p>
          <p className="text-sm text-gray-500 mt-2">Uploaded documents will appear here during processing</p>
        </div>
      </div>
    );
  }

  // Display the most recent processing document
  const latestDocument = documents[0];
  const docStatus = latestDocument.status;
  const progress = estimateProgress(docStatus, latestDocument.upload_date);

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
      <h3 className="text-xl font-semibold mb-2 text-gray-100">Document Processing</h3>
      
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-gray-300 truncate max-w-xs">{latestDocument.title}</span>
        <span className={`text-sm font-medium ${getStatusColor(docStatus)}`}>
          {getStageLabel(docStatus)}
        </span>
      </div>
      
      {renderProgressBar(docStatus, progress)}
      
      <p className="my-4 text-sm text-gray-300">
        {getStageDescription(docStatus)}
      </p>
      
      <div className="mt-8">
        <div className="flex items-center justify-between w-full">
          {renderStageIndicator(docStatus, 'parsing')}
          {renderStageIndicator(docStatus, 'extracting')}
          {renderStageIndicator(docStatus, 'indexing')}
          {renderStageIndicator(docStatus, 'complete')}
        </div>
        
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-400">Parsing</span>
          <span className="text-xs text-gray-400">Extracting</span>
          <span className="text-xs text-gray-400">Indexing</span>
          <span className="text-xs text-gray-400">Complete</span>
        </div>
      </div>
      
      {docStatus === 'failed' && (
        <div className="mt-4 text-sm p-3 bg-red-900 bg-opacity-30 border border-red-800 rounded text-red-400">
          We encountered an error processing your document. Please try uploading it again.
        </div>
      )}

      {documents.length > 1 && (
        <div className="mt-4 text-sm p-3 bg-blue-900 bg-opacity-30 border border-blue-800 rounded text-blue-300">
          {documents.length - 1} more document{documents.length > 2 ? 's' : ''} in processing queue
        </div>
      )}
    </div>
  );
};

export default ProcessingStatus; 