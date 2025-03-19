import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
  fullScreen?: boolean;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
  fullScreen = false,
  text
}) => {
  // Size configurations
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  // Color configurations
  const colorClasses = {
    primary: 'text-blue-500',
    white: 'text-white',
    gray: 'text-gray-400'
  };

  // Spinner element
  const spinner = (
    <svg 
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
      data-testid="loading-spinner"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      ></circle>
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  // If fullScreen, render spinner in the center of the screen
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75">
        <div className="flex flex-col items-center">
          {spinner}
          {text && (
            <p className="mt-4 text-sm font-medium text-gray-200">
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Otherwise, just return the spinner (with optional text)
  if (text) {
    return (
      <div className="flex flex-col items-center">
        {spinner}
        <p className="mt-2 text-sm font-medium text-gray-300">
          {text}
        </p>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner; 