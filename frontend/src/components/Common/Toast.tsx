import React, { useEffect, useState } from 'react';

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  type,
  message,
  isVisible,
  onClose,
  duration = 5000,
}) => {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Reset leaving state when the toast becomes visible
      setIsLeaving(false);
      
      // Set a timeout to close the toast after the duration
      const timer = setTimeout(() => {
        setIsLeaving(true);
        
        // Give time for exit animation before calling onClose
        setTimeout(() => {
          onClose();
        }, 300);
      }, duration);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [isVisible, onClose, duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(onClose, 300);
  };

  if (!isVisible) {
    return null;
  }

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-900 border-green-700 text-green-200',
          icon: 'text-green-300',
          iconPath: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ),
        };
      case 'error':
        return {
          container: 'bg-red-900 border-red-700 text-red-200',
          icon: 'text-red-300',
          iconPath: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ),
        };
      case 'warning':
        return {
          container: 'bg-yellow-900 border-yellow-700 text-yellow-200',
          icon: 'text-yellow-300',
          iconPath: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          ),
        };
      case 'info':
      default:
        return {
          container: 'bg-blue-900 border-blue-700 text-blue-200',
          icon: 'text-blue-300',
          iconPath: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ),
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div
      className={`fixed bottom-4 right-4 max-w-md rounded-lg border shadow-lg ${
        styles.container
      } transform transition-all duration-300 ${
        isLeaving ? 'translate-y-10 opacity-0' : 'translate-y-0 opacity-100'
      }`}
      role="alert"
    >
      <div className="flex p-4">
        <div className="flex-shrink-0">
          <svg
            className={`h-5 w-5 ${styles.icon}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {styles.iconPath}
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={handleClose}
              className={`inline-flex p-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                type === 'success'
                  ? 'focus:ring-green-400 hover:bg-green-800'
                  : type === 'error'
                  ? 'focus:ring-red-400 hover:bg-red-800'
                  : type === 'warning'
                  ? 'focus:ring-yellow-400 hover:bg-yellow-800'
                  : 'focus:ring-blue-400 hover:bg-blue-800'
              }`}
            >
              <span className="sr-only">Close</span>
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast; 