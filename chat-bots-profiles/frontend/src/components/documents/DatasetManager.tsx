import React, { useState, useEffect } from 'react';
import { Dataset } from '../../pages/DocumentsPage';

interface DatasetManagerProps {
  datasets: Dataset[];
  onCreateDataset: (name: string, description?: string) => Promise<string | null>;
  onUpdateDataset?: (id: string, name: string, description?: string) => Promise<boolean>;
  onDeleteDataset?: (id: string) => Promise<boolean>;
  onClose: () => void;
}

const DatasetManager: React.FC<DatasetManagerProps> = ({
  datasets,
  onCreateDataset,
  onUpdateDataset,
  onDeleteDataset,
  onClose,
}) => {
  const [newDatasetName, setNewDatasetName] = useState('');
  const [newDatasetDescription, setNewDatasetDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sortedDatasets, setSortedDatasets] = useState<Dataset[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Sort datasets by name
  useEffect(() => {
    const sorted = [...datasets].sort((a, b) => a.name.localeCompare(b.name));
    setSortedDatasets(sorted);
  }, [datasets]);

  const handleCreateDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDatasetName.trim()) {
      setError('Dataset name is required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const datasetId = await onCreateDataset(
        newDatasetName, 
        newDatasetDescription.trim() || undefined
      );
      
      if (datasetId) {
        setNewDatasetName('');
        setNewDatasetDescription('');
        setIsCreating(false);
        setSuccessMessage('Dataset created successfully');
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (err) {
      setError('Failed to create dataset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingDataset) return;
    if (!newDatasetName.trim()) {
      setError('Dataset name is required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (onUpdateDataset) {
        const success = await onUpdateDataset(
          editingDataset.id,
          newDatasetName, 
          newDatasetDescription.trim() || undefined
        );
        
        if (success) {
          setEditingDataset(null);
          setNewDatasetName('');
          setNewDatasetDescription('');
          setSuccessMessage('Dataset updated successfully');
          
          // Hide success message after 3 seconds
          setTimeout(() => {
            setSuccessMessage(null);
          }, 3000);
        }
      }
    } catch (err) {
      setError('Failed to update dataset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDataset = async (id: string) => {
    if (!onDeleteDataset) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await onDeleteDataset(id);
      
      if (success) {
        setDeleteConfirm(null);
        setSuccessMessage('Dataset deleted successfully');
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (err) {
      setError('Failed to delete dataset');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (dataset: Dataset) => {
    setEditingDataset(dataset);
    setNewDatasetName(dataset.name);
    setNewDatasetDescription(dataset.description || '');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-zinc-900 rounded-xl shadow-lg w-full max-w-4xl m-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-zinc-800">
          <h2 className="text-xl font-bold">Dataset Manager</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-5 overflow-auto flex-1">
          {/* Success message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-900 bg-opacity-20 border border-green-500 text-green-500 rounded-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900 bg-opacity-20 border border-red-500 text-red-500 rounded-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          
          {/* Dataset list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {sortedDatasets.length === 0 ? (
              <div className="col-span-2 bg-zinc-800 rounded-lg p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-zinc-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <p className="text-zinc-400">No datasets available. Create your first dataset!</p>
              </div>
            ) : (
              sortedDatasets.map(dataset => (
                <div 
                  key={dataset.id} 
                  className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 flex flex-col"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                      <h3 className="text-lg font-medium truncate">{dataset.name}</h3>
                    </div>
                    <span className="bg-blue-900 bg-opacity-30 text-blue-400 text-xs px-2 py-1 rounded-full">
                      {dataset.document_count} {dataset.document_count === 1 ? 'document' : 'documents'}
                    </span>
                  </div>
                  
                  {dataset.description && (
                    <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{dataset.description}</p>
                  )}
                  
                  <div className="mt-auto pt-2 flex justify-between items-center text-xs text-zinc-500">
                    <span>Created: {new Date(dataset.created_at).toLocaleDateString()}</span>
                    
                    {deleteConfirm === dataset.id ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-red-500">Confirm delete?</span>
                        <button
                          onClick={() => handleDeleteDataset(dataset.id)}
                          className="text-red-500 hover:text-red-400"
                          disabled={isLoading}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-zinc-400 hover:text-zinc-300"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => startEditing(dataset)}
                          className="text-zinc-400 hover:text-zinc-300"
                        >
                          Edit
                        </button>
                        {onDeleteDataset && (
                          <button 
                            onClick={() => setDeleteConfirm(dataset.id)}
                            className="text-zinc-400 hover:text-red-500"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Create/Edit dataset form */}
          <div className="bg-zinc-800 rounded-lg p-5 border border-zinc-700">
            <h3 className="text-lg font-bold mb-4">
              {editingDataset ? 'Edit Dataset' : 'Create New Dataset'}
            </h3>
            
            <form onSubmit={editingDataset ? handleUpdateDataset : handleCreateDataset}>
              <div className="mb-4">
                <label htmlFor="dataset-name" className="block text-sm font-medium mb-1">Dataset Name</label>
                <input
                  id="dataset-name"
                  type="text"
                  value={newDatasetName}
                  onChange={(e) => setNewDatasetName(e.target.value)}
                  placeholder="e.g., Technical Documentation, Meeting Notes, Research Papers"
                  className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
              
              <div className="mb-5">
                <label htmlFor="dataset-description" className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea
                  id="dataset-description"
                  value={newDatasetDescription}
                  onChange={(e) => setNewDatasetDescription(e.target.value)}
                  placeholder="Describe what this dataset contains"
                  className="w-full p-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  disabled={isLoading}
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3">
                {editingDataset && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDataset(null);
                      setNewDatasetName('');
                      setNewDatasetDescription('');
                    }}
                    className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-600 disabled:text-zinc-400"
                  disabled={!newDatasetName.trim() || isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingDataset ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : (
                    editingDataset ? 'Update Dataset' : 'Create Dataset'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetManager; 