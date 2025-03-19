import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-slate-800 text-white">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="text-xl font-bold">AI Profiles</Link>
        </div>
        
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="hover:text-blue-300">Dashboard</Link>
          <Link to="/profile/create" className="hover:text-blue-300">Create Profile</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 