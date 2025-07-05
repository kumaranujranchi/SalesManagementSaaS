import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
  organizationSlug: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginProps {
  onSuccess?: () => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizationSlug, setOrganizationSlug] = useState<string>('');
  const [showOrgInput, setShowOrgInput] = useState(false);
  
  const { login, isAuthenticated } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Get organization slug from URL
  useEffect(() => {
    const getOrgSlug = (): string => {
      // Try subdomain first
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      if (parts.length > 2 && parts[0] !== 'www') {
        return parts[0];
      }

      // Try URL path
      const pathMatch = window.location.pathname.match(/^\/org\/([^\/]+)/);
      if (pathMatch) {
        return pathMatch[1];
      }

      // Try query parameter
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('org') || '';
    };

    const slug = getOrgSlug();
    setOrganizationSlug(slug);
    setValue('organizationSlug', slug);
    
    // Show organization input if no slug is detected
    setShowOrgInput(!slug);
  }, [setValue]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = '/dashboard';
      }
    }
  }, [isAuthenticated, onSuccess]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(data.email, data.password, data.organizationSlug || organizationSlug);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getBaseDomain = (): string => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    if (parts.length > 2) {
      return parts.slice(1).join('.');
    }
    
    return hostname;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          {organizationSlug && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Organization: <span className="font-medium">{organizationSlug}</span>
            </p>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {showOrgInput && (
              <div>
                <label htmlFor="organizationSlug" className="block text-sm font-medium text-gray-700">
                  Organization
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    {...register('organizationSlug')}
                    type="text"
                    className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your-company"
                    value={organizationSlug}
                    onChange={(e) => {
                      setOrganizationSlug(e.target.value);
                      setValue('organizationSlug', e.target.value);
                    }}
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    .{getBaseDomain()}
                  </span>
                </div>
                {errors.organizationSlug && (
                  <p className="mt-1 text-sm text-red-600">{errors.organizationSlug.message}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || (!organizationSlug && showOrgInput)}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center space-y-2">
            {!organizationSlug && (
              <p className="text-sm text-gray-600">
                Don't have an organization?{' '}
                <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                  Create one here
                </a>
              </p>
            )}
            
            {showOrgInput && (
              <p className="text-sm text-gray-600">
                Know your organization URL?{' '}
                <button
                  type="button"
                  onClick={() => {
                    if (organizationSlug) {
                      window.location.href = `${window.location.protocol}//${organizationSlug}.${getBaseDomain()}/login`;
                    }
                  }}
                  className="font-medium text-blue-600 hover:text-blue-500"
                  disabled={!organizationSlug}
                >
                  Go to organization login
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
