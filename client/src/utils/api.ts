/**
 * API configuration and utilities
 */

// Get the API base URL based on environment
export function getApiBaseUrl(): string {
  // In development, use the proxy
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // In production on Netlify, use the function URL
  return '/.netlify/functions/api';
}

// Create a fetch wrapper that uses the correct API base URL
export async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  // Ensure credentials are included for session management
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };
  
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  console.log(`API Request: ${options.method || 'GET'} ${url}`);
  console.log('Request options:', finalOptions);

  const response = await fetch(url, finalOptions);
  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  return response;
}

// Convenience methods for common HTTP verbs
export const api = {
  get: (endpoint: string, options: RequestInit = {}) => 
    apiRequest(endpoint, { ...options, method: 'GET' }),
    
  post: (endpoint: string, data?: any, options: RequestInit = {}) => 
    apiRequest(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  put: (endpoint: string, data?: any, options: RequestInit = {}) => 
    apiRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  delete: (endpoint: string, options: RequestInit = {}) => 
    apiRequest(endpoint, { ...options, method: 'DELETE' }),
};
