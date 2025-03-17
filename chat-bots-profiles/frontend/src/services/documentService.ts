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
    return response.data;
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