import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
import ProcessingStatus from './components/Upload/ProcessingStatus';

// Document Components
import DocumentList from './components/Documents/DocumentList';
import DocumentDetails from './components/Documents/DocumentDetails';

// Key Components
import KeyGenerator from './components/Keys/KeyGenerator';

// Settings Components
import SettingsPage from './components/Settings/SettingsComponent';

// Common Components
import Toast from './components/Common/Toast';

// Services
import { documentService, profileService } from './services/api';

// Profile Route Component
const ProfileRoute = () => {
  const { id } = useParams<{ id: string }>();
  const { data: profile } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => profileService.getProfile(id!),
    enabled: !!id,
  });

  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (file: File) => documentService.uploadDocument(id!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', id] });
    },
  });

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-100">
        {profile ? profile.name : 'Profile Management'}
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <FileUploader 
          profileId={id!} 
          onUploadComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['documents', id] });
          }} 
        />
        <ProcessingStatus 
          profileId={id!}
          documentId="doc123"
          stage="parsing"
          progress={70}
        />
      </div>
      <KeyGenerator 
        profileId={id!} 
        hasExistingKey={false} 
        onKeyGenerated={() => {
          queryClient.invalidateQueries({ queryKey: ['profile', id] });
        }} 
      />
    </div>
  );
};

// Query Route Component
const QueryRoute = () => {
  const { id } = useParams<{ id: string }>();
  const { data: profile } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => profileService.getProfile(id!),
    enabled: !!id,
  });

  return (
    <div className="space-y-8">
      <QueryInterface 
        profileId={id!} 
        profileName={profile?.name || 'Loading...'} 
      />
      <QueryHistory 
        profileId={id!} 
        history={[]} // TODO: Implement query history
        onSelect={(queryId) => {
          // Handle query selection
        }} 
      />
    </div>
  );
};

// Documents Route Component
const DocumentsRoute = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: documents } = useQuery({
    queryKey: ['documents', id],
    queryFn: () => documentService.listDocuments(id),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: documentService.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', id] });
    },
  });

  // Transform API document type to component document type
  const transformedDocuments = documents?.documents.map(doc => ({
    id: doc.id,
    name: doc.title,
    fileType: doc.document_type,
    uploadDate: doc.upload_date,
    size: doc.metadata?.size_bytes || 0,
    status: (doc.status === 'completed' ? 'active' : 
             doc.status === 'failed' ? 'error' : 
             'processing') as 'active' | 'processing' | 'error',
    pageCount: doc.metadata?.page_count || 0
  })) || [];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-100">Profile Documents</h2>
      <DocumentList 
        profileId={id!} 
        documents={transformedDocuments}
        onDelete={(documentId) => deleteMutation.mutate(documentId)} 
      />
    </div>
  );
};

const queryClient = new QueryClient();

const App: React.FC = () => {
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    visible: boolean;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToast({ message, type, visible: true });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
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
              element={<ProfileRoute />} 
            />
            
            <Route 
              path="/profile/:id/query" 
              element={<QueryRoute />} 
            />

            <Route 
              path="/profile/:id/documents" 
              element={<DocumentsRoute />} 
            />
            
            <Route 
              path="/documents/:documentId" 
              element={<DocumentDetails onDelete={(id) => {
                documentService.deleteDocument(id).then(() => {
                  showToast('Document deleted successfully', 'success');
                }).catch(() => {
                  showToast('Failed to delete document', 'error');
                });
              }} />} 
            />

            <Route 
              path="/settings" 
              element={<SettingsPage />} 
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
    </QueryClientProvider>
  );
};

export default App;
