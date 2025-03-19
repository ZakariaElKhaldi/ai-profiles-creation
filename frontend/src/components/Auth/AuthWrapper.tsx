import React, { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Simple mock authentication solution
// In a real app, this would be handled by your auth provider
if (!localStorage.getItem('userSession')) {
  localStorage.setItem('userSession', JSON.stringify({
    userId: 'mock-user-id',
    name: 'Demo User',
    authenticated: true
  }));
}

interface AuthWrapperProps {
  children: ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  // Auto-login for demo purposes
  return <>{children}</>;
};

export default AuthWrapper; 