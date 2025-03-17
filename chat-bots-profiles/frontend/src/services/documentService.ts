import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface Document {
  id: string;
  name: string;
  content?: string;
  metadata?: {
    source?: string;
    type?: string;
    size?: number;
    created_at?: string;
    updated_at?: string;
    dataset_id?: string;
    tag_ids?: string[];
    chunk_count?: number;
  };
}

export interface DocumentUploadResponse {
  id: string;
  name: string;
  status: string;
  metadata?: {
    source?: string;
    type?: string;
    size?: number;
  };
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  document_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  document_count?: number;
  created_at?: string;
}

export const fetchDocuments = async (
  query?: string,
  datasetId?: string,
  tagIds?: string[]
): Promise<Document[]> => {
  try {
    // If no specific filters, include uploads
    const includeUploads = !query && !datasetId && (!tagIds || tagIds.length === 0);
    
    // Get regular documents from the API
    let url = `${API_BASE_URL}/api/documents`;
    const params: Record<string, string | string[]> = {};
    
    if (query) {
      params.query = query;
    }
    
    if (datasetId) {
      params.dataset_id = datasetId;
    }
    
    if (tagIds && tagIds.length > 0) {
      params.tag_ids = tagIds;
    }
    
    const response = await axios.get(url, { params });
    
    // Handle the API response structure which returns {documents: Array, total: number}
    const documents = response.data.documents || [];
    console.log(`Received ${documents.length} documents from API`);
    
    // If we should include uploads and we have a separate uploads endpoint
    if (includeUploads) {
      try {
        const uploadsDocuments = await fetchUploadsDocuments();
        // Combine documents, avoiding duplicates
        const existingIds = new Set(documents.map((doc: Document) => doc.id));
        for (const uploadDoc of uploadsDocuments) {
          if (!existingIds.has(uploadDoc.id)) {
            documents.push(uploadDoc);
          }
        }
      } catch (uploadError) {
        console.error('Error fetching uploads documents:', uploadError);
        // Continue with the documents we already have
      }
    }
    
    return documents;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

export const fetchDocument = async (id: string): Promise<Document> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/documents/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching document ${id}:`, error);
    throw error;
  }
};

export const uploadDocument = async (
  file: File,
  datasetId?: string,
  tagIds?: string[]
): Promise<DocumentUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    if (datasetId) {
      formData.append('dataset_id', datasetId);
    }
    
    if (tagIds && tagIds.length > 0) {
      // For multiple tag IDs, we need to append each one separately
      tagIds.forEach(tagId => {
        formData.append('tag_ids', tagId);
      });
    }
    
    const response = await axios.post(
      `${API_BASE_URL}/api/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

export const deleteDocument = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/api/documents/${id}`);
  } catch (error) {
    console.error(`Error deleting document ${id}:`, error);
    throw error;
  }
};

export const fetchDatasets = async (): Promise<Dataset[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/datasets`);
    return response.data;
  } catch (error) {
    console.error('Error fetching datasets:', error);
    throw error;
  }
};

export const createDataset = async (name: string, description?: string): Promise<Dataset> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/datasets`, {
      name,
      description
    });
    return response.data;
  } catch (error) {
    console.error('Error creating dataset:', error);
    throw error;
  }
};

export const deleteDataset = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/api/datasets/${id}`);
  } catch (error) {
    console.error(`Error deleting dataset ${id}:`, error);
    throw error;
  }
};

export const fetchTags = async (): Promise<Tag[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/tags`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
};

export const createTag = async (name: string, color?: string): Promise<Tag> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/tags`, {
      name,
      color
    });
    return response.data;
  } catch (error) {
    console.error('Error creating tag:', error);
    throw error;
  }
};

export const deleteTag = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/api/tags/${id}`);
  } catch (error) {
    console.error(`Error deleting tag ${id}:`, error);
    throw error;
  }
};

export const fetchUploadsDocuments = async (): Promise<Document[]> => {
  try {
    // Using the trailing slash for API consistency
    const response = await axios.get(`${API_BASE_URL}/api/documents/uploads/`);
    
    // Convert the response data to Document objects
    const documents: Document[] = [];
    if (response.data && response.data.documents) {
      for (const [id, doc] of Object.entries(response.data.documents)) {
        const docData = doc as any;
        // Create document object consistent with DocumentsPage structure
        documents.push({
          id: id,
          name: docData.filename || 'Unknown Document',
          content: '', // Content will be fetched separately when needed
          metadata: {
            source: 'upload',
            type: getDocumentTypeFromFilename(docData.filename),
            size: docData.size || 0,
            created_at: new Date(docData.timestamp * 1000).toISOString(),
            chunk_count: docData.chunk_count || 0
          }
        });
      }
    }
    
    return documents;
  } catch (error) {
    console.error('Error fetching uploads documents:', error);
    // In case of 404, return empty array instead of throwing
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log('Uploads endpoint not found, returning empty document list');
      return [];
    }
    throw error;
  }
};

const getDocumentTypeFromFilename = (filename: string): string => {
  if (!filename) return 'unknown';
  
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'docx':
    case 'doc':
      return 'word';
    case 'txt':
      return 'text';
    case 'csv':
      return 'csv';
    default:
      return extension || 'unknown';
  }
}; 