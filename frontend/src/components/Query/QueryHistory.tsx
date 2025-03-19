import React from 'react';

interface HistoryItem {
  id: string;
  query: string;
  timestamp: string;
  truncatedAnswer: string;
}

interface QueryHistoryProps {
  profileId: string;
  history: HistoryItem[];
  onSelect: (id: string) => void;
}

const QueryHistory: React.FC<QueryHistoryProps> = ({ profileId, history, onSelect }) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Recent Queries</h3>
      
      {history.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          No queries yet. Start by asking a question above.
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {history.map(item => (
            <div 
              key={item.id}
              onClick={() => onSelect(item.id)}
              className="py-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-blue-600">{item.query}</div>
                <div className="text-xs text-gray-500">{formatDate(item.timestamp)}</div>
              </div>
              <div className="text-sm text-gray-600 line-clamp-2">
                {item.truncatedAnswer}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {history.length > 0 && (
        <div className="mt-4 text-center">
          <button 
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View All Queries
          </button>
        </div>
      )}
    </div>
  );
};

export default QueryHistory;