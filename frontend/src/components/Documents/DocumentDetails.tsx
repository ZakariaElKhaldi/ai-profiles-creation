import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

interface DocumentDetailsProps {
  onDelete: (documentId: string) => void;
}

interface Document {
  id: string;
  name: string;
  fileType: string;
  uploadDate: string;
  size: number;
  status: 'processing' | 'active' | 'error';
  pageCount?: number;
  extractedText?: string;
  processingDetails?: {
    startTime: string;
    endTime?: string;
    steps: {
      name: string;
      status: 'completed' | 'in_progress' | 'failed' | 'pending';
      startTime?: string;
      endTime?: string;
      details?: string;
    }[];
  };
  metadata?: Record<string, string>;
}

const DocumentDetails: React.FC<DocumentDetailsProps> = ({ onDelete }) => {
  const { documentId } = useParams<{ documentId: string }>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'processing'>('overview');

  // In a real app, this would be an API call
  // Mock document data for the example
  const document: Document = {
    id: documentId || 'doc-123',
    name: 'Business Proposal Q2 2023.pdf',
    fileType: 'pdf',
    uploadDate: '2023-10-15T14:32:00',
    size: 2547698, // in bytes
    status: 'active',
    pageCount: 18,
    extractedText: 'This is a sample of the extracted text from the document. In a real application, this would be much longer and contain the actual extracted content from the PDF, which could be used for AI analysis and queries.',
    processingDetails: {
      startTime: '2023-10-15T14:32:10',
      endTime: '2023-10-15T14:35:45',
      steps: [
        {
          name: 'File Upload',
          status: 'completed',
          startTime: '2023-10-15T14:32:10',
          endTime: '2023-10-15T14:32:15'
        },
        {
          name: 'Text Extraction',
          status: 'completed',
          startTime: '2023-10-15T14:32:15',
          endTime: '2023-10-15T14:34:30'
        },
        {
          name: 'Content Indexing',
          status: 'completed',
          startTime: '2023-10-15T14:34:30',
          endTime: '2023-10-15T14:35:45'
        }
      ]
    },
    metadata: {
      'Author': 'John Smith',
      'Created Date': '2023-09-28',
      'Modified Date': '2023-10-10',
      'Title': 'Quarterly Business Proposal',
      'Subject': 'Q2 2023 Strategy and Budget',
      'Keywords': 'business, proposal, budget, strategy, quarterly, 2023'
    }
  };

  // Helper functions
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (startTime: string, endTime?: string): string => {
    if (!endTime) return 'In progress';
    
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    
    const seconds = Math.floor((durationMs / 1000) % 60);
    const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900 text-yellow-300">
            <svg className="mr-1.5 h-2 w-2 text-yellow-400" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            Processing
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-300">
            <svg className="mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            Active
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900 text-red-300">
            <svg className="mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="3" />
            </svg>
            Error
          </span>
        );
      default:
        return null;
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return (
          <svg className="w-12 h-12 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'docx':
      case 'doc':
        return (
          <svg className="w-12 h-12 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'txt':
        return (
          <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v2H7v-2h8zM7 8h8v2H7V8z" clipRule="evenodd" />
          </svg>
        );
      case 'csv':
      case 'xlsx':
      case 'xls':
        return (
          <svg className="w-12 h-12 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H5zm12 1a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5zM7 7a1 1 0 100 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getStepStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-300">
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
            In Progress
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900 text-red-300">
            Failed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  const handleDelete = () => {
    onDelete(document.id);
    // In a real app, you would navigate back to documents list after deletion
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md border border-gray-700">
      {/* Document Header Section */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-4">
              {getFileIcon(document.fileType)}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-100">{document.name}</h1>
              <div className="mt-1 flex items-center text-sm text-gray-400">
                <span>{document.fileType.toUpperCase()}</span>
                <span className="mx-2">•</span>
                <span>{formatFileSize(document.size)}</span>
                <span className="mx-2">•</span>
                <span>Uploaded on {formatDate(document.uploadDate)}</span>
                <span className="ml-3">
                  {getStatusBadge(document.status)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              to={`/documents/${document.id}/download`}
              className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 flex items-center"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </Link>
            <button
              onClick={() => window.open(`/documents/${document.id}/preview`, '_blank')}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 flex items-center"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex -mb-px px-6">
          <button
            className={`py-4 px-1 font-medium text-sm border-b-2 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
            } mr-8`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`py-4 px-1 font-medium text-sm border-b-2 ${
              activeTab === 'content'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
            } mr-8`}
            onClick={() => setActiveTab('content')}
          >
            Content Preview
          </button>
          <button
            className={`py-4 px-1 font-medium text-sm border-b-2 ${
              activeTab === 'processing'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
            }`}
            onClick={() => setActiveTab('processing')}
          >
            Processing Details
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-850 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-medium text-gray-100 mb-4">Document Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">File Name</span>
                  <span className="text-gray-200">{document.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">File Type</span>
                  <span className="text-gray-200">{document.fileType.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Size</span>
                  <span className="text-gray-200">{formatFileSize(document.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Upload Date</span>
                  <span className="text-gray-200">{formatDate(document.uploadDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pages</span>
                  <span className="text-gray-200">{document.pageCount || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span>{getStatusBadge(document.status)}</span>
                </div>
              </div>
            </div>

            {document.metadata && (
              <div className="bg-gray-850 rounded-lg p-6 border border-gray-700">
                <h2 className="text-lg font-medium text-gray-100 mb-4">Document Metadata</h2>
                <div className="space-y-3">
                  {Object.entries(document.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-400">{key}</span>
                      <span className="text-gray-200">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Preview Tab */}
        {activeTab === 'content' && (
          <div className="bg-gray-850 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-medium text-gray-100 mb-4">Content Preview</h2>
            {document.extractedText ? (
              <div className="bg-gray-900 p-4 rounded border border-gray-700 max-h-96 overflow-y-auto">
                <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm">
                  {document.extractedText}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-900 rounded border border-gray-700">
                <svg
                  className="mx-auto h-12 w-12 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-400">No content available</h3>
                <p className="mt-1 text-gray-500 text-sm">
                  Either this document hasn't been processed yet or the content couldn't be extracted.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Processing Details Tab */}
        {activeTab === 'processing' && (
          <div className="bg-gray-850 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-medium text-gray-100 mb-4">Processing Details</h2>
            {document.processingDetails ? (
              <div className="space-y-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Started</span>
                  <span className="text-gray-200">{formatDate(document.processingDetails.startTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Completed</span>
                  <span className="text-gray-200">
                    {document.processingDetails.endTime 
                      ? formatDate(document.processingDetails.endTime) 
                      : 'In Progress'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Duration</span>
                  <span className="text-gray-200">
                    {formatDuration(
                      document.processingDetails.startTime,
                      document.processingDetails.endTime
                    )}
                  </span>
                </div>

                <div className="mt-8">
                  <h3 className="text-md font-medium text-gray-200 mb-4">Processing Steps</h3>
                  <div className="space-y-4">
                    {document.processingDetails.steps.map((step, index) => (
                      <div 
                        key={index} 
                        className="bg-gray-900 p-4 rounded border border-gray-700"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-200">{step.name}</h4>
                          {getStepStatusBadge(step.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {step.startTime && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Start Time</span>
                              <span className="text-gray-300">{formatDate(step.startTime)}</span>
                            </div>
                          )}
                          {step.endTime && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">End Time</span>
                              <span className="text-gray-300">{formatDate(step.endTime)}</span>
                            </div>
                          )}
                          {step.startTime && step.endTime && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Duration</span>
                              <span className="text-gray-300">{formatDuration(step.startTime, step.endTime)}</span>
                            </div>
                          )}
                        </div>
                        {step.details && (
                          <div className="mt-2 text-xs text-gray-400">
                            {step.details}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-900 rounded border border-gray-700">
                <svg
                  className="mx-auto h-12 w-12 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-400">No processing details available</h3>
                <p className="mt-1 text-gray-500 text-sm">
                  Processing information for this document is not available.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl border border-gray-700">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-10 w-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-200">Confirm Deletion</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Are you sure you want to delete this document? This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentDetails; 