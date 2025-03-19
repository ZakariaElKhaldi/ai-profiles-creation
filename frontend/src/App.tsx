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
                <h2 className="text-2xl font-bold">Profile Management</h2>
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
