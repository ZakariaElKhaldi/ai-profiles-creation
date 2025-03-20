import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileService, TrainingData } from '../../services/api/profiles';
import { documentService } from '../../services/api/documents';

interface ProfileTrainingProps {
  profileId: string;
}

const ProfileTraining: React.FC<ProfileTrainingProps> = ({ profileId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [success, setSuccess] = useState(false);

  // Query for documents
  const { data: documents, isLoading: isLoadingDocs } = useQuery({
    queryKey: ['documents', profileId],
    queryFn: () => documentService.listDocuments(profileId),
    enabled: !!profileId,
  });

  // Sample training data from document content
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');

  // Extract training data from the selected document
  const extractTrainingData = async () => {
    if (!selectedDocumentId) {
      setError('Please select a document to extract training data from');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // In a real app, you would have a more sophisticated extraction method
      // that would analyze the document content and extract relevant Q&A pairs
      
      // For now, we'll create some basic training data based on the document metadata
      const document = await documentService.getDocument(selectedDocumentId);
      
      const newTrainingData: TrainingData[] = [];
      
      // Add basic document information as training data
      newTrainingData.push({
        input: `What is the title of document ${document.id}?`,
        output: `The title is "${document.title}".`
      });
      
      if (document.description) {
        newTrainingData.push({
          input: `What is document ${document.id} about?`,
          output: `This document is about: ${document.description}`
        });
      }
      
      if (document.metadata?.author) {
        newTrainingData.push({
          input: `Who is the author of document ${document.title}?`,
          output: `The author is ${document.metadata.author}.`
        });
      }
      
      if (document.metadata?.page_count) {
        newTrainingData.push({
          input: `How many pages are in the document ${document.title}?`,
          output: `The document has ${document.metadata.page_count} pages.`
        });
      }
      
      if (document.metadata?.word_count) {
        newTrainingData.push({
          input: `How many words are in the document ${document.title}?`,
          output: `The document contains approximately ${document.metadata.word_count} words.`
        });
      }
      
      // Add document type-specific training data
      newTrainingData.push({
        input: `What format is the document ${document.title} in?`,
        output: `The document is in ${document.document_type.toUpperCase()} format.`
      });
      
      // Add custom training data entry
      newTrainingData.push({
        input: '',
        output: ''
      });
      
      setTrainingData([...trainingData, ...newTrainingData]);
    } catch (err) {
      console.error('Error extracting training data:', err);
      setError('Failed to extract training data from the document');
    } finally {
      setIsLoading(false);
    }
  };

  // Update training data
  const updateTrainingData = (index: number, field: 'input' | 'output', value: string) => {
    const newData = [...trainingData];
    newData[index] = { ...newData[index], [field]: value };
    setTrainingData(newData);
  };

  // Add a new training data entry
  const addTrainingData = () => {
    setTrainingData([...trainingData, { input: '', output: '' }]);
  };

  // Remove a training data entry
  const removeTrainingData = (index: number) => {
    const newData = [...trainingData];
    newData.splice(index, 1);
    setTrainingData(newData);
  };

  // Submit training data
  const submitTrainingData = async () => {
    if (trainingData.length === 0) {
      setError('No training data to submit');
      return;
    }

    // Filter out empty entries
    const validData = trainingData.filter(td => td.input.trim() && td.output.trim());
    
    if (validData.length === 0) {
      setError('Please provide valid training data with both input and output');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await profileService.trainProfile(profileId, validData);
      setSuccess(true);
      // Clear the form after successful submission
      setTrainingData([]);
    } catch (err) {
      console.error('Error training profile:', err);
      setError('Failed to train profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
      <h3 className="text-xl font-semibold mb-4 text-gray-100">Profile Training</h3>
      
      <p className="text-sm text-gray-300 mb-6">
        Enhance your AI profile with training data extracted from documents or custom examples.
      </p>

      {/* Document Selection */}
      <div className="mb-6">
        <h4 className="text-md font-medium mb-2 text-gray-200">Extract Data from Document</h4>
        <div className="flex space-x-4">
          <select
            value={selectedDocumentId}
            onChange={(e) => setSelectedDocumentId(e.target.value)}
            className="bg-gray-700 text-gray-200 px-3 py-2 rounded-md border border-gray-600 flex-grow"
            disabled={isLoadingDocs}
          >
            <option value="">Select a document...</option>
            {documents?.documents.map(doc => (
              <option key={doc.id} value={doc.id}>
                {doc.title} ({doc.document_type})
              </option>
            ))}
          </select>
          <button
            onClick={extractTrainingData}
            disabled={isLoading || !selectedDocumentId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Extract Data
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-900 bg-opacity-30 text-red-300 p-4 rounded-md border border-red-800 text-sm mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-900 bg-opacity-30 text-green-300 p-4 rounded-md border border-green-800 text-sm mb-4">
          Profile trained successfully!
        </div>
      )}

      {/* Training Data Form */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-md font-medium text-gray-200">Training Data</h4>
          <button
            onClick={addTrainingData}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            + Add Example
          </button>
        </div>
        
        {trainingData.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            No training data available. Extract from documents or add examples manually.
          </p>
        ) : (
          <div className="space-y-6">
            {trainingData.map((data, index) => (
              <div key={index} className="p-4 bg-gray-750 rounded-md border border-gray-600 relative">
                <button
                  onClick={() => removeTrainingData(index)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-400"
                  title="Remove example"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Input (Question/Prompt)
                  </label>
                  <textarea
                    value={data.input}
                    onChange={(e) => updateTrainingData(index, 'input', e.target.value)}
                    className="w-full bg-gray-700 text-gray-200 px-3 py-2 rounded-md border border-gray-600"
                    rows={2}
                    placeholder="What question should the AI recognize?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Output (Answer/Response)
                  </label>
                  <textarea
                    value={data.output}
                    onChange={(e) => updateTrainingData(index, 'output', e.target.value)}
                    className="w-full bg-gray-700 text-gray-200 px-3 py-2 rounded-md border border-gray-600"
                    rows={3}
                    placeholder="How should the AI respond to this question?"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={submitTrainingData}
          disabled={isLoading || trainingData.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Training...
            </span>
          ) : (
            'Train Profile'
          )}
        </button>
      </div>
    </div>
  );
};

export default ProfileTraining; 