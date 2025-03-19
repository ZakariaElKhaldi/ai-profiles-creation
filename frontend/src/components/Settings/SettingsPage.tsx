import React, { useState } from 'react';
import ApiKeySettings from './ApiKeySettings';
import Toast from '../Common/Toast';

const SettingsPage: React.FC = () => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const handleApiKeySave = (key: string) => {
    setToast({
      message: 'OpenRouter API key saved successfully',
      type: 'success'
    });
    
    // In a real app, you might also want to update this in your global state management
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-100 mb-8">Settings</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">API Integration</h2>
          <ApiKeySettings onSave={handleApiKeySave} />
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">User Interface</h2>
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-100 mb-4">Theme Settings</h3>
            <p className="text-gray-300 mb-6">
              The application currently uses a dark theme to reduce eye strain and provide a modern look.
              Theme customization options will be available in a future update.
            </p>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-300">Dark Theme</div>
                <div className="text-sm text-gray-500">Currently active</div>
              </div>
            </div>
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">Account Preferences</h2>
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <p className="text-gray-300 mb-6">
              Account settings and preferences will be available once user authentication is implemented.
            </p>
            <div className="flex items-center text-blue-400">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Coming soon</span>
            </div>
          </div>
        </section>
      </div>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={true}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default SettingsPage; 