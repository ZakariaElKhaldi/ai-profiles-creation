import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { openRouterService } from '../../services/api';
import ApiKeySettings from './ApiKeySettings';
import Toast from '../Common/Toast';

const SettingsPage: React.FC = () => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // Fetch active key
  const { data: activeKeyInfo, isLoading: isLoadingKey } = useQuery({
    queryKey: ['openrouter-active-key'],
    queryFn: () => openRouterService.getActiveKey(),
  });

  // Test API key mutation
  const testKeyMutation = useMutation({
    mutationFn: async () => {
      const request = {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hi! This is a test message. Please respond with a short greeting." }],
        max_tokens: 50
      };
      return openRouterService.createCompletion(request);
    },
    onSuccess: (data) => {
      console.log('OpenRouter Response:', data);
      setToast({
        message: 'Test successful! Check console for full response.',
        type: 'success'
      });
    },
    onError: (error) => {
      console.error('Test Error:', error);
      setToast({
        message: 'Test failed. Check console for error details.',
        type: 'error'
      });
    }
  });

  const handleTest = async () => {
    if (!activeKeyInfo?.active) {
      setToast({
        message: 'No active API key to test.',
        type: 'warning'
      });
      return;
    }
    await testKeyMutation.mutateAsync();
  };

  const handleApiKeySave = (key: string) => {
    setToast({
      message: 'OpenRouter API key saved successfully',
      type: 'success'
    });
    
    // In a real app, you might also want to update this in your global state management
    setTimeout(() => setToast(null), 3000);
  };

  const testApiKey = async () => {
    setIsTesting(true);
    setToast(null);
    
    try {
      // Create a simple test request
      const response = await openRouterService.createCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "user", content: "Hi! Just testing the OpenRouter API connection. Please respond with a short greeting." }
        ],
        max_tokens: 50,
        temperature: 0.7
      });
      
      console.log("Test successful:", response);
      
      setToast({
        message: `Test successful! Response: "${response.choices[0].message.content}"`,
        type: 'success'
      });
    } catch (error: any) {
      console.log("Test Error:", error);
      setToast({
        message: `Test failed: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsTesting(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-100 mb-8">Settings</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">API Integration</h2>
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-100 mb-4">OpenRouter API Key</h3>
              {isLoadingKey ? (
                <p className="text-blue-400">Loading...</p>
              ) : activeKeyInfo?.active ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <span className="text-green-400 mr-2">●</span>
                    <span className="text-green-400">Active</span>
                    {showKey && activeKeyInfo.key && (
                      <span className="ml-4 text-gray-400">{activeKeyInfo.key}</span>
                    )}
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="ml-4 text-sm text-blue-400 hover:text-blue-300"
                    >
                      {showKey ? 'Hide' : 'Show'} Key
                    </button>
                    <button
                      onClick={handleTest}
                      disabled={testKeyMutation.isPending}
                      className="ml-4 text-sm text-green-400 hover:text-green-300 flex items-center"
                    >
                      {testKeyMutation.isPending ? (
                        <span>Testing...</span>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Test Key
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="text-yellow-400 mr-2">●</span>
                  <span className="text-yellow-400">No active key</span>
                </div>
              )}
            </div>
            <ApiKeySettings onSave={handleApiKeySave} />
          </div>
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