import React, { useState } from 'react';

interface SetupResponse {
  success: boolean;
  message: string;
  credentials?: {
    superAdmin: {
      email: string;
      password: string;
    };
    orgAdmin: {
      email: string;
      password: string;
    };
  };
}

export default function DatabaseSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SetupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setupDatabase = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/api/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || 'Setup failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-extrabold text-gray-900">
              🚀 Database Setup
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Initialize the database with all required tables and demo accounts
            </p>
          </div>

          <div className="space-y-6">
            <button
              onClick={setupDatabase}
              disabled={isLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {isLoading ? '🔄 Setting up...' : 'Initialize Database'}
            </button>

            {isLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      🔄 Initializing database...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {result && result.success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      ✅ {result.message}
                    </h3>
                    {result.credentials && (
                      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <h4 className="text-sm font-medium text-yellow-800 mb-2">
                          🔑 Login Credentials
                        </h4>
                        <div className="text-sm text-yellow-700 space-y-2">
                          <div>
                            <strong>Super Admin:</strong><br />
                            Email: {result.credentials.superAdmin.email}<br />
                            Password: {result.credentials.superAdmin.password}
                          </div>
                          <div>
                            <strong>Organization Admin:</strong><br />
                            Email: {result.credentials.orgAdmin.email}<br />
                            Password: {result.credentials.orgAdmin.password}
                          </div>
                        </div>
                        <div className="mt-4">
                          <a
                            href="/"
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            🏠 Go to Login Page
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      ❌ Setup failed: {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
