import { api } from './config';

export interface DocumentMetadata {
  page_count?: number;
  word_count?: number;
  author?: string;
  created_date?: string;
  modified_date?: string;
  size_bytes?: number;
  extracted_entities?: Record<string, any>;
  keywords?: string[];
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  document_type: 'pdf' | 'docx' | 'txt' | 'csv' | 'xlsx';
  profile_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_path: string;
  upload_date: string;
  metadata?: DocumentMetadata;
  processing_error?: string;
}

export interface DocumentList {
  total: number;
  documents: Document[];
}

export interface DocumentUploadResponse {
  document_id: string;
  message: string;
  status: Document['status'];
}

export interface DocumentContent {
  content: string;
}

class DocumentService {
  async listDocuments(profileId?: string): Promise<DocumentList> {
    const params = profileId ? { profile_id: profileId } : {};
    const response = await api.get('/documents', { params });
    return response.data;
  }

  async getDocument(id: string): Promise<Document> {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  }

  async getDocumentContent(id: string): Promise<DocumentContent> {
    const response = await api.get(`/documents/${id}/content`);
    return response.data;
  }

  async uploadDocument(
    profileId: string,
    file: File,
    title?: string,
    document_type?: string,
    metadata?: Partial<DocumentMetadata>
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('profile_id', profileId);
    formData.append('title', title || file.name);
    formData.append('document_type', document_type || file.type.split('/')[1]);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await api.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateDocument(
    id: string,
    data: { title?: string; description?: string }
  ): Promise<Document> {
    const response = await api.patch(`/documents/${id}`, data);
    return response.data;
  }

  async deleteDocument(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  }
}

export const documentService = new DocumentService(); 