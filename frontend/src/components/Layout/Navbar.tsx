import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-white text-xl font-bold">
                AI Profiles
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`${
                  isActive('/') && location.pathname === '/'
                    ? 'border-blue-500 text-white' 
                    : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-gray-100'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Dashboard
              </Link>
              <Link
                to="/profile/create"
                className={`${
                  isActive('/profile/create') 
                    ? 'border-blue-500 text-white' 
                    : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-gray-100'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Create Profile
              </Link>
              <Link
                to="/settings"
                className={`${
                  isActive('/settings')
                    ? 'border-blue-500 text-white' 
                    : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-gray-100'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Settings
              </Link>
            </div>
          </div>
          <div className="hidden sm:flex items-center">
            <Link
              to="/settings"
              className={`${
                location.pathname === '/settings' 
                  ? 'border-blue-500 text-white' 
                  : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-gray-100'
              } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1 bg-gray-800">
            <Link
              to="/"
              className={`${
                isActive('/') && location.pathname === '/'
                  ? 'bg-gray-700 border-blue-500 text-white' 
                  : 'border-transparent text-gray-300 hover:bg-gray-700 hover:text-white'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/profile/create"
              className={`${
                isActive('/profile/create') 
                  ? 'bg-gray-700 border-blue-500 text-white' 
                  : 'border-transparent text-gray-300 hover:bg-gray-700 hover:text-white'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              onClick={() => setIsMenuOpen(false)}
            >
              Create Profile
            </Link>
            <Link
              to="/profile/123/documents"
              className={`${
                location.pathname.includes('/documents') 
                  ? 'bg-gray-700 border-blue-500 text-white' 
                  : 'border-transparent text-gray-300 hover:bg-gray-700 hover:text-white'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              onClick={() => setIsMenuOpen(false)}
            >
              Documents
            </Link>
            <Link
              to="/settings"
              className={`${
                location.pathname === '/settings' 
                  ? 'bg-gray-700 border-blue-500 text-white' 
                  : 'border-transparent text-gray-300 hover:bg-gray-700 hover:text-white'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              onClick={() => setIsMenuOpen(false)}
            >
              Settings
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 