import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-4 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">
          AI Profiles © {new Date().getFullYear()} - All rights reserved
        </p>
        <div className="mt-2 text-xs text-gray-500">
          <a href="#" className="hover:text-gray-300 mx-2">Privacy Policy</a>
          <a href="#" className="hover:text-gray-300 mx-2">Terms of Service</a>
          <a href="#" className="hover:text-gray-300 mx-2">Contact</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 