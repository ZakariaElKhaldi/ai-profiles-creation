import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-800 text-white py-3">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} AI Profiles Management
        </p>
      </div>
    </footer>
  );
};

export default Footer; 