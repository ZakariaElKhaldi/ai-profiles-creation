import React, { useState } from 'react';
import { Dataset } from '../../pages/DocumentsPage';

interface DatasetSelectorProps {
  datasets: Dataset[];
  selectedDatasetId: string | null;
  onSelect: (datasetId: string | null) => void;
  onCreateNew: () => Promise<string | null>;
}

const DatasetSelector: React.FC<DatasetSelectorProps> = ({
  datasets,
  selectedDatasetId,
  onSelect,
  onCreateNew,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDatasets = datasets.filter(dataset => 
    dataset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDatasetClick = (datasetId: string | null) => {
    onSelect(datasetId);
    setIsOpen(false);
  };

  const handleCreateDataset = async () => {
    await onCreateNew();
  };

  // Get the name of the selected dataset
  const selectedDataset = selectedDatasetId ? datasets.find(d => d.id === selectedDatasetId) : null;

  return (
    <div className="relative">
      <div
        className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 flex items-center justify-between min-h-[40px] cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedDataset ? '' : 'text-zinc-500'}>
          {selectedDataset ? selectedDataset.name : 'Select dataset...'}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2">
            <input
              type="text"
              className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm"
              placeholder="Search datasets..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            <div
              className={`px-3 py-2 rounded-lg cursor-pointer flex items-center ${
                selectedDatasetId === null ? 'bg-zinc-700' : 'hover:bg-zinc-700'
              }`}
              onClick={e => {
                e.stopPropagation();
                handleDatasetClick(null);
              }}
            >
              <span>No dataset</span>
            </div>
            
            {filteredDatasets.length > 0 ? (
              <div className="p-2 space-y-1">
                {filteredDatasets.map(dataset => (
                  <div
                    key={dataset.id}
                    className={`px-3 py-2 rounded-lg cursor-pointer flex items-center ${
                      selectedDatasetId === dataset.id ? 'bg-zinc-700' : 'hover:bg-zinc-700'
                    }`}
                    onClick={e => {
                      e.stopPropagation();
                      handleDatasetClick(dataset.id);
                    }}
                  >
                    <span>{dataset.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-zinc-500">
                No datasets found
              </div>
            )}
          </div>
          <div className="p-2 border-t border-zinc-700">
            <button
              className="w-full px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm"
              onClick={e => {
                e.stopPropagation();
                handleCreateDataset();
              }}
            >
              + Create new dataset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetSelector; 