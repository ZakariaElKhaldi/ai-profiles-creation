import React, { useState, useEffect } from 'react';
import { ChatbotProfile, getProfileDocuments, addDocumentsToProfile, removeDocumentFromProfile } from '../../services/profileService';
import { Document, fetchDocument } from '../../services/documentService';
import DocumentSelector from './DocumentSelector';
import DocumentStatusIndicator from './DocumentStatusIndicator';

interface ProfileDocumentsProps {
  profile: ChatbotProfile;
  onUpdate?: () => void;
}

const ProfileDocuments: React.FC<ProfileDocumentsProps> = ({ profile, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [profile.id]);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProfileDocuments(profile.id);
      const docs = await Promise.all(
        response.document_ids.map(id => fetchDocument(id))
      );
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocuments = async (selectedDocs: string[]) => {
    setLoading(true);
    setError(null);
    try {
      await addDocumentsToProfile(profile.id, selectedDocs);
      await loadDocuments();
      onUpdate?.();
      setShowSelector(false);
    } catch (error) {
      console.error('Error adding documents:', error);
      setError('Failed to add documents');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    setLoading(true);
    setError(null);
    try {
      await removeDocumentFromProfile(profile.id, documentId);
      await loadDocuments();
      onUpdate?.();
    } catch (error) {
      console.error('Error removing document:', error);
      setError('Failed to remove document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold text-white mb-2">Documents</h3>
      
      {error && (
        <div className="bg-red-900/50 border border-red-800 text-red-200 p-3 mb-4 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
          <p className="text-zinc-400">No documents attached to this profile</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="flex items-center justify-between bg-zinc-800 p-3 rounded-lg"
            >
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center">
                  <div className="text-zinc-300 font-medium truncate mr-2">
                    {doc.name}
                  </div>
                  <DocumentStatusIndicator status={doc.status} />
                </div>
                {doc.description && (
                  <div className="text-zinc-500 text-sm truncate">
                    {doc.description}
                  </div>
                )}
                <div className="text-zinc-600 text-xs">
                  {doc.type} • {(doc.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <button
                onClick={() => handleRemoveDocument(doc.id)}
                className="ml-2 px-2 py-1 text-sm bg-red-600/20 text-red-400 rounded hover:bg-red-600/30"
                disabled={doc.status === 'processing'}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={() => setShowSelector(true)}
          className="w-full px-4 py-2 bg-zinc-700 text-white rounded-md hover:bg-zinc-600"
        >
          Add Documents
        </button>
      </div>

      {showSelector && (
        <DocumentSelector
          onSelect={handleAddDocuments}
          onCancel={() => setShowSelector(false)}
          currentDocuments={documents.map(d => d.id)}
        />
      )}
    </div>
  );
};

export default ProfileDocuments; 