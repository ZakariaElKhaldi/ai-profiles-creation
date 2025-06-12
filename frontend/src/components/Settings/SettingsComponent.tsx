import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { openRouterService } from '../../services/api';
import ApiKeySettings from './ApiKeySettings';
import Toast from '../Common/Toast';
import type { OpenRouterAPIKey, ActiveKeyInfo } from '../../services/api/openrouter';
import axios from 'axios';

const SettingsPage: React.FC = () => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [savedKeys, setSavedKeys] = useState<OpenRouterAPIKey[]>([]);
  const [activeKeyInfo, setActiveKeyInfo] = useState<ActiveKeyInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showKeyDetails, setShowKeyDetails] = useState<Record<string, boolean>>({});
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const [isDiagnosticLoading, setIsDiagnosticLoading] = useState(false);

  // Fetch all saved keys and active key on component mount
  useEffect(() => {
    const fetchKeys = async () => {
      setIsLoading(true);
      try {
        // Get all saved keys
        const keysResponse = await openRouterService.listKeys();
        setSavedKeys(keysResponse.keys);
        
        // Get active key info
        const activeKey = await openRouterService.getActiveKey();
        setActiveKeyInfo(activeKey);
      } catch (error: any) {
        console.error("Error fetching keys:", error);
        setToast({
          message: `Failed to load API keys: ${error.message}`,
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchKeys();
  }, []);

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

  const handleApiKeySave = async (key: string) => {
    try {
      await refreshKeys();
      setToast({
        message: 'OpenRouter API key saved successfully',
        type: 'success'
      });
    } catch (error) {
      console.error("Error refreshing keys after save:", error);
    }
    
    setTimeout(() => setToast(null), 3000);
  };

  const refreshKeys = async () => {
    try {
      const keysResponse = await openRouterService.listKeys();
      setSavedKeys(keysResponse.keys);
      
      const activeKey = await openRouterService.getActiveKey();
      setActiveKeyInfo(activeKey);
    } catch (error) {
      console.error("Error refreshing keys:", error);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeyDetails(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const setAsActive = async (key: string) => {
    try {
      await openRouterService.setActiveKey(key);
      await refreshKeys();
      setToast({
        message: 'Active API key updated successfully',
        type: 'success'
      });
      setTimeout(() => setToast(null), 3000);
    } catch (error: any) {
      setToast({
        message: `Failed to set active key: ${error.message}`,
        type: 'error'
      });
    }
  };

  const deleteKey = async (key: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }
    
    try {
      await openRouterService.deleteKey(key);
      await refreshKeys();
      setToast({
        message: 'API key deleted successfully',
        type: 'success'
      });
      setTimeout(() => setToast(null), 3000);
    } catch (error: any) {
      setToast({
        message: `Failed to delete key: ${error.message}`,
        type: 'error'
      });
    }
  };

  const runDiagnostic = async () => {
    setIsDiagnosticLoading(true);
    try {
      const diagnosticData = await openRouterService.getDiagnostic();
      setDiagnosticInfo(diagnosticData);
      console.log('Diagnostic info:', diagnosticData);
      
      setToast({
        message: 'Diagnostic completed successfully',
        type: 'info'
      });
    } catch (error: any) {
      console.error('Diagnostic error:', error);
      setToast({
        message: `Diagnostic failed: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsDiagnosticLoading(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const testApiKey = async () => {
    setIsTesting(true);
    setToast(null);
    
    try {
      // First run a diagnostic to make sure keys are synced
      try {
        await openRouterService.getDiagnostic();
      } catch (e) {
        console.log('Diagnostic check failed, but continuing with test');
      }
      
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
        message: `Test failed: ${error.message || 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setIsTesting(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const maskApiKey = (key: string) => {
    return `${key.substring(0, 4)}${'•'.repeat(Math.max(0, Math.min(key.length - 8, 20)))}${key.substring(key.length - 4)}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-100 mb-8">Settings</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">API Integration</h2>
          <div className="flex flex-col gap-4">
            <ApiKeySettings onSave={handleApiKeySave} />
            
            {/* Saved API Keys List */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-100 mb-4">Saved API Keys</h3>
              
              {isLoading ? (
                <div className="text-gray-300 py-4">Loading API keys...</div>
              ) : savedKeys.length === 0 ? (
                <div className="text-gray-300 py-4">No API keys saved yet.</div>
              ) : (
                <div className="space-y-4">
                  {savedKeys.map((keyData) => {
                    const isActive = activeKeyInfo?.active && 
                                    activeKeyInfo.key && 
                                    keyData.key.startsWith(activeKeyInfo.key.split('...')[0]) && 
                                    keyData.key.endsWith(activeKeyInfo.key.split('...')[1]);
                    
                    return (
                      <div 
                        key={keyData.key} 
                        className={`border rounded-md p-4 ${isActive ? 'border-green-500 bg-gray-700' : 'border-gray-600'}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                          <div className="mb-2 sm:mb-0">
                            <div className="flex items-center">
                              {isActive && (
                                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2 flex-shrink-0" />
                              )}
                              <span className="font-mono text-gray-300 break-all">
                                {showKeyDetails[keyData.key] ? 
                                  <span className="break-all">{keyData.key}</span> : 
                                  maskApiKey(keyData.key)
                                }
                              </span>
                            </div>
                            <div className="text-gray-400 text-sm mt-1">
                              Added: {formatDate(keyData.created_at)}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 mt-2 sm:mt-0">
                            <button
                              onClick={() => toggleKeyVisibility(keyData.key)}
                              className="p-1.5 rounded hover:bg-gray-600 text-gray-300"
                              title={showKeyDetails[keyData.key] ? "Hide key" : "Show key"}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                {showKeyDetails[keyData.key] ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                )}
                              </svg>
                            </button>
                            
                            {!isActive && (
                              <button
                                onClick={() => setAsActive(keyData.key)}
                                className="p-1.5 rounded hover:bg-gray-600 text-blue-400"
                                title="Set as active"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                            
                            <button
                              onClick={() => deleteKey(keyData.key)}
                              className="p-1.5 rounded bg-gray-700 hover:bg-red-500 hover:text-white text-red-400"
                              title="Delete key"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Add Diagnostics button */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-100 mb-4">API Key Diagnostics</h3>
              <p className="text-gray-300 mb-4">
                If you're having issues with the OpenRouter connection, run a diagnostic to check the API key configuration.
              </p>
              <div className="flex flex-col">
                <button
                  onClick={runDiagnostic}
                  disabled={isDiagnosticLoading}
                  className={`px-4 py-2 rounded-md text-white transition-colors ${
                    isDiagnosticLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isDiagnosticLoading ? 'Running Diagnostic...' : 'Run Diagnostic'}
                </button>
                
                {diagnosticInfo && (
                  <div className="mt-4 bg-gray-700 p-4 rounded-md">
                    <h4 className="text-lg font-medium text-gray-100 mb-2">Diagnostic Results</h4>
                    <div className="text-sm space-y-1">
                      <p className="text-gray-300">
                        <span className="font-medium">Status:</span> {diagnosticInfo.status}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium">Active Key:</span> {diagnosticInfo.active_key}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium">Client Key:</span> {diagnosticInfo.client_key}
                      </p>
                      <p className={`${diagnosticInfo.keys_match ? 'text-green-400' : 'text-red-400'}`}>
                        <span className="font-medium">Keys Match:</span> {diagnosticInfo.keys_match ? 'Yes' : 'No'}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium">Total Keys in Storage:</span> {diagnosticInfo.keys_in_storage}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-100 mb-4">Test OpenRouter Connection</h3>
              <p className="text-gray-300 mb-4">
                Verify your OpenRouter API key is working correctly by sending a test message.
              </p>
              <button
                onClick={testApiKey}
                disabled={isTesting || !activeKeyInfo?.active}
                className={`px-4 py-2 rounded-md text-white transition-colors ${
                  isTesting || !activeKeyInfo?.active ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>
              {!activeKeyInfo?.active && (
                <p className="text-yellow-400 text-sm mt-2">
                  You need to add and activate an API key before testing.
                </p>
              )}
            </div>
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