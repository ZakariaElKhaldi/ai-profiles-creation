import React from 'react';

interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: string;
  truncatedAnswer: string;
}

interface QueryHistoryProps {
  profileId: string;
  history: QueryHistoryItem[];
  onSelect: (id: string) => void;
}

const QueryHistory: React.FC<QueryHistoryProps> = ({ profileId, history, onSelect }) => {
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (history.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-gray-100">Recent Queries</h3>
        <p className="text-gray-400 text-center py-4">No query history available</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
      <h3 className="text-xl font-semibold mb-4 text-gray-100">Recent Queries</h3>
      
      <div className="space-y-4">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="p-4 bg-gray-900 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
            onClick={() => onSelect(item.id)}
          >
            <div className="flex justify-between items-start">
              <h4 className="text-md font-medium text-gray-200">{item.query}</h4>
              <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                {formatDate(item.timestamp)}
              </span>
            </div>
            
            <p className="mt-2 text-sm text-gray-400 line-clamp-2">
              {item.truncatedAnswer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QueryHistory;