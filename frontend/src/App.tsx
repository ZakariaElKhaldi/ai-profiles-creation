import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layout
import Layout from './components/Layout/Layout';

// Auth Components
import AuthWrapper from './components/Auth/AuthWrapper';

// Dashboard Components
import ProfileGrid from './components/Dashboard/ProfileGrid';
import ProfileStats from './components/Dashboard/ProfileStats';

// Profile Components
import CreateProfileForm from './components/Profile/CreateProfileForm';

// Query Components
import QueryInterface from './components/Query/QueryInterface';
import QueryHistory from './components/Query/QueryHistory';

// Upload Components
import FileUploader from './components/Upload/FileUploader';
import ProcessingStatus, { ProcessingStage } from './components/Upload/ProcessingStatus';

// Document Components
import DocumentList from './components/Documents/DocumentList';
import DocumentDetails from './components/Documents/DocumentDetails';

// Key Components
import KeyGenerator from './components/Keys/KeyGenerator';

// Common Components
import Toast from './components/Common/Toast';

// Mock data
const mockQueryHistory = [
  {
    id: '1',
    query: 'How do I reset my password?',
    timestamp: '2023-10-22T14:30:00',
    truncatedAnswer: 'To reset your password, go to the login page and click on "Forgot Password". You will receive an email with instructions.'
  },
  {
    id: '2',
    query: 'What are the shipping options?',
    timestamp: '2023-10-21T11:15:00',
    truncatedAnswer: 'We offer standard shipping (3-5 business days), express shipping (1-2 business days), and same-day delivery in select areas.'
  }
];

// Mock documents data
const mockDocuments = [
  {
    id: 'doc1',
    name: 'Business Proposal Q2 2023.pdf',
    fileType: 'pdf',
    uploadDate: '2023-10-15T14:32:00',
    size: 2547698,
    status: 'active' as const,
    pageCount: 18
  },
  {
    id: 'doc2',
    name: 'Financial Report 2023.xlsx',
    fileType: 'xlsx',
    uploadDate: '2023-10-14T09:15:00',
    size: 1258291,
    status: 'active' as const,
    pageCount: 35
  },
  {
    id: 'doc3',
    name: 'Meeting Notes.docx',
    fileType: 'docx',
    uploadDate: '2023-10-12T16:45:00',
    size: 458762,
    status: 'active' as const,
    pageCount: 4
  },
  {
    id: 'doc4',
    name: 'Product Specifications.pdf',
    fileType: 'pdf',
    uploadDate: '2023-10-10T11:20:00',
    size: 3254168,
    status: 'processing' as const,
    pageCount: 26
  }
];

const App: React.FC = () => {
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    visible: boolean;
  } | null>(null);

  // Mock function to show toast
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToast({ message, type, visible: true });
  };

  // Mock document processing stage
  const [processingStage, setProcessingStage] = useState<ProcessingStage>('parsing');

  // Handle file upload completion
  const handleUploadComplete = () => {
    // In a real app, this would trigger a backend process and update the UI based on progress
    showToast('Document uploaded successfully', 'success');
    setProcessingStage('extracting');
    
    // Simulate processing stages
    setTimeout(() => setProcessingStage('indexing'), 3000);
    setTimeout(() => setProcessingStage('complete'), 6000);
  };

  // Handle document deletion
  const handleDocumentDelete = (documentId: string) => {
    showToast(`Document ${documentId} deleted successfully`, 'success');
    // In a real app, this would trigger an API call to delete the document
  };

  // Handle API key generation
  const handleKeyGenerated = (key: string) => {
    showToast('API key generated successfully', 'success');
  };

  return (
    <Router>
      <Layout>
        <Routes>
          {/* All routes are now accessible without login */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route 
            path="/dashboard" 
            element={
              <div className="space-y-8">
                <ProfileStats />
                <ProfileGrid />
              </div>
            } 
          />
          
          <Route 
            path="/profile/create" 
            element={<CreateProfileForm />} 
          />
          
          <Route 
            path="/profile/:id" 
            element={
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-100">Profile Management</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <FileUploader 
                    profileId="123" 
                    onUploadComplete={handleUploadComplete} 
                  />
                  <ProcessingStatus 
                    profileId="123"
                    documentId="doc123"
                    stage={processingStage}
                    progress={70}
                  />
                </div>
                <KeyGenerator 
                  profileId="123" 
                  hasExistingKey={false} 
                  onKeyGenerated={handleKeyGenerated} 
                />
              </div>
            } 
          />
          
          <Route 
            path="/profile/:id/query" 
            element={
              <div className="space-y-8">
                <QueryInterface profileId="123" profileName="Customer Support" />
                <QueryHistory 
                  profileId="123" 
                  history={mockQueryHistory} 
                  onSelect={(id) => console.log(`Selected query: ${id}`)} 
                />
              </div>
            } 
          />

          {/* Document Routes */}
          <Route 
            path="/profile/:id/documents" 
            element={
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-100">Profile Documents</h2>
                <DocumentList 
                  profileId="123" 
                  documents={mockDocuments} 
                  onDelete={handleDocumentDelete} 
                />
              </div>
            } 
          />
          
          <Route 
            path="/documents/:documentId" 
            element={<DocumentDetails onDelete={handleDocumentDelete} />} 
          />
        </Routes>
        
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            isVisible={toast.visible} 
            onClose={() => setToast(null)} 
          />
        )}
      </Layout>
    </Router>
  );
};

export default App;
