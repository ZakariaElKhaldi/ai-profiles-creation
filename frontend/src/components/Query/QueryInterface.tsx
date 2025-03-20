import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { documentService, profileService } from '../../services/api';
import { generateSuggestedQuestions } from '../../services/suggestedQuestions';
import QueryResults from './QueryResults';

interface QueryInterfaceProps {
  profileId: string;
  profileName: string;
}

const QueryInterface: React.FC<QueryInterfaceProps> = ({ profileId, profileName }) => {
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [results, setResults] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  // Fetch the profile's documents
  const { data: documentsData } = useQuery({
    queryKey: ['documents', profileId],
    queryFn: () => documentService.listDocuments(profileId),
    enabled: !!profileId,
  });

  // Generate suggested questions from documents
  useEffect(() => {
    if (documentsData?.documents && documentsData.documents.length > 0) {
      // Get completed documents only
      const completedDocs = documentsData.documents.filter(doc => doc.status === 'completed');
      
      if (completedDocs.length > 0) {
        // Get content from the most recent document
        const latestDoc = completedDocs.sort((a, b) => 
          new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()
        )[0];
        
        // Fetch document content
        documentService.getDocumentContent(latestDoc.id)
          .then(contentData => {
            // Generate suggested questions
            const questions = generateSuggestedQuestions(
              contentData.content,
              latestDoc.document_type,
              latestDoc.title
            );
            setSuggestedQuestions(questions);
          })
          .catch(err => {
            console.error('Error fetching document content:', err);
          });
      }
    }
  }, [documentsData]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    setError(null);
  };

  const handleSubmitQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setIsQuerying(true);
    setResults(null);
    setError(null);

    try {
      // Use the real API to query the profile
      const response = await profileService.queryProfile(profileId, query);
      setResults(response.response);
    } catch (err: any) {
      console.error('Error querying profile:', err);
      setError(err.message || 'An error occurred while processing your query. Please try again.');
    } finally {
      setIsQuerying(false);
    }
  };

  const handleSuggestedQuestionClick = (question: string) => {
    setQuery(question);
    // Automatically submit the query
    setIsQuerying(true);
    setResults(null);
    setError(null);

    profileService.queryProfile(profileId, question)
      .then(response => {
        setResults(response.response);
      })
      .catch(err => {
        console.error('Error querying profile:', err);
        setError(err.message || 'An error occurred while processing your query. Please try again.');
      })
      .finally(() => {
        setIsQuerying(false);
      });
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-100">Query AI Profile</h3>
        <span className="text-sm font-medium text-gray-300">
          Profile: <span className="text-blue-400">{profileName}</span>
        </span>
      </div>

      {suggestedQuestions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Suggested Questions</h4>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestionClick(question)}
                className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-full hover:bg-gray-600 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="query" className="block text-sm font-medium mb-1 text-gray-300">
          Ask a question
        </label>
        <textarea
          id="query"
          rows={3}
          className="w-full px-3 py-2 text-gray-300 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ask me anything about the documents in this profile..."
          value={query}
          onChange={handleQueryChange}
          disabled={isQuerying}
        ></textarea>
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmitQuery}
          disabled={isQuerying}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isQuerying ? 'Processing...' : 'Ask Question'}
        </button>
      </div>

      {(isQuerying || results) && (
        <div className="mt-6">
          <h4 className="text-md font-medium mb-2 text-gray-300">Answer</h4>
          <QueryResults isLoading={isQuerying} results={results} />
        </div>
      )}
    </div>
  );
};

export default QueryInterface; 