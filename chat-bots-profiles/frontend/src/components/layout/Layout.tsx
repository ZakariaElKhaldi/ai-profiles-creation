import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { useApp } from '../../context/AppContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isLoading, error } = useApp();

  return (
    <div className="flex h-screen bg-zinc-900 text-white">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Global loading indicator */}
        {isLoading && (
          <div className="absolute top-4 right-4 bg-blue-600 text-white py-1 px-3 rounded-full text-xs shadow-lg">
            Loading...
          </div>
        )}
        
        {/* Global error message */}
        {error && (
          <div className="absolute top-4 right-4 bg-red-600 text-white py-2 px-4 rounded-lg text-sm shadow-lg">
            {error}
          </div>
        )}
        
        {/* Main content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout; 