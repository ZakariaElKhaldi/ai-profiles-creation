import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Document } from './DocumentList';

interface DocumentDetailsProps {
  onDelete: (documentId: string) => void;
}

const DocumentDetails: React.FC<DocumentDetailsProps> = ({ onDelete }) => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // In a real app, this would fetch data from an API
    // For demo, we'll use mock data with a timeout to simulate API call
    setTimeout(() => {
      // This is mock data - in a real app you would fetch from an API
      const mockDocument: Document = {
        id: documentId || 'doc1',
        name: 'Business Proposal Q2 2023.pdf',
        fileType: 'pdf',
        uploadDate: '2023-10-15T14:32:00',
        size: 2547698,
        status: 'active' as const,
        pageCount: 18
      };
      
      setDocument(mockDocument);
      setLoading(false);
    }, 1000);
  }, [documentId]);

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    const kilobytes = bytes / 1024;
    if (kilobytes < 1024) return `${kilobytes.toFixed(1)} KB`;
    const megabytes = kilobytes / 1024;
    return `${megabytes.toFixed(1)} MB`;
  };

  // Handle document deletion
  const handleDelete = () => {
    if (documentId) {
      onDelete(documentId);
      navigate('/dashboard', { replace: true });
    }
  };

  // Get status badge based on document status
  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-900 text-green-200">Active</span>;
      case 'processing':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-900 text-blue-200">Processing</span>;
      case 'error':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-900 text-red-200">Error</span>;
      default:
        return null;
    }
  };

  // Get icon based on file type
  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return (
          <svg className="w-14 h-14 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
      case 'docx':
      case 'doc':
        return (
          <svg className="w-14 h-14 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
      case 'xlsx':
      case 'xls':
        return (
          <svg className="w-14 h-14 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-14 h-14 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-300">Loading document details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-300">Error Loading Document</h3>
        <p className="mt-2 text-sm text-gray-400">{error}</p>
        <div className="mt-6">
          <Link to="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-300">Document Not Found</h3>
        <p className="mt-2 text-sm text-gray-400">The document you are looking for could not be found.</p>
        <div className="mt-6">
          <Link to="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Document Header */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-4">
              {getFileIcon(document.fileType)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-100">{document.name}</h1>
              <div className="flex items-center mt-2 space-x-4">
                <div className="text-sm text-gray-400">
                  {document.fileType.toUpperCase()}
                </div>
                <div className="text-sm text-gray-400">
                  {formatFileSize(document.size)}
                </div>
                <div>
                  {getStatusBadge(document.status)}
                </div>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-sm font-medium rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              Delete
            </button>
            <Link
              to={`/dashboard`}
              className="px-4 py-2 text-sm font-medium rounded-md bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            >
              Back
            </Link>
          </div>
        </div>
      </div>

      {/* Document Details */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">Document Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-400">Upload Date</h3>
              <p className="mt-1 text-base text-gray-200">
                {format(new Date(document.uploadDate), 'PPP p')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Pages</h3>
              <p className="mt-1 text-base text-gray-200">{document.pageCount}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Document ID</h3>
              <p className="mt-1 text-base text-gray-200">{document.id}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-400">Processing Status</h3>
              <p className="mt-1 text-base text-gray-200">{document.status.charAt(0).toUpperCase() + document.status.slice(1)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">File Type</h3>
              <p className="mt-1 text-base text-gray-200">{document.fileType.toUpperCase()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">File Size</h3>
              <p className="mt-1 text-base text-gray-200">{formatFileSize(document.size)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Document Preview (Placeholder) */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">Document Preview</h2>
        <div className="p-8 bg-gray-900 rounded-lg border border-gray-700 flex items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-16 w-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4 text-gray-400">Preview not available</p>
            <button className="mt-4 px-4 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors">
              Download Document
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-10 w-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-200">Delete Document</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Are you sure you want to delete this document? This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
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