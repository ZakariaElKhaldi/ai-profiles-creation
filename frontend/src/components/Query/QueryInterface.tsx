import React, { useState } from 'react';
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
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response
      const mockResponses = [
        "Based on the documents in this profile, the answer to your question is that our return policy allows returns within 30 days of purchase with a receipt. Refunds are processed to the original payment method within 5-7 business days.",
        "According to our documentation, the API rate limits are 100 requests per minute for the basic tier and 1000 requests per minute for the premium tier. If you exceed these limits, requests will be queued and processed at the allowed rate.",
        "The product specifications indicate that the device is compatible with iOS 14+ and Android 10+. It requires Bluetooth 5.0 for optimal performance and has a battery life of approximately 8 hours with continuous use.",
        "Our company's privacy policy states that we collect user data solely for the purpose of improving our services. We do not share personal information with third parties without explicit consent, except as required by law."
      ];
      
      // Select random response from mock data
      const randomIndex = Math.floor(Math.random() * mockResponses.length);
      setResults(mockResponses[randomIndex]);
    } catch (err) {
      setError('An error occurred while processing your query. Please try again.');
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-100">Query AI Profile</h3>
        <span className="text-sm font-medium text-gray-300">
          Profile: <span className="text-blue-400">{profileName}</span>
        </span>
      </div>

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