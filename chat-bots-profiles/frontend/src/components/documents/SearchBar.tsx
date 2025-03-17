import React, { useState, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => Promise<void>;
  initialQuery?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setIsSearching(true);
    try {
      await onSearch(query);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = async () => {
    setQuery('');
    setIsSearching(true);
    try {
      await onSearch('');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg className="w-4 h-4 text-zinc-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
          </svg>
        </div>
        <input
          type="search"
          id="document-search" 
          className="block w-full p-3 pl-10 text-sm border rounded-lg bg-zinc-800 border-zinc-700 placeholder-zinc-400 text-white focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search documents by content, name, or tags..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          {query && (
            <button 
              type="button"
              className="p-1 text-zinc-400 hover:text-zinc-200 mr-1"
              onClick={handleReset}
              title="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <button 
            type="submit"
            className="px-3 py-1 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none disabled:bg-zinc-600"
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchBar; 