import React from 'react';

interface Source {
  document: string;
  page?: number;
  relevance: number;
}

interface QueryResultsProps {
  isLoading: boolean;
  results: string | null;
}

const QueryResults: React.FC<QueryResultsProps> = ({ isLoading, results }) => {
  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-blue-400 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-300">Processing your query...</span>
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
      <div className="prose prose-invert max-w-none text-gray-300">
        {results.split('\n').map((paragraph, index) => (
          <p key={index} className="mb-4">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
};

export default QueryResults; 