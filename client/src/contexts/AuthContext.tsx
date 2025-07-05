import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Organization } from '@shared/schema';
import { Permission } from '@shared/tenant-utils';

interface AuthUser extends Omit<User, 'password'> {
  permissions: Permission[];
}

interface AuthContextType {
  user: AuthUser | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, organizationSlug?: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check if user has specific permission
  const hasPermission = (permission: Permission): boolean => {
    return user?.permissions?.includes(permission) || false;
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user?.permissions) return false;
    return permissions.some(permission => user.permissions.includes(permission));
  };

  // Get current user info
  const refreshUser = async (): Promise<void> => {
    try {
      const orgSlug = getOrganizationSlug();
      if (!orgSlug) {
        setUser(null);
        setOrganization(null);
        return;
      }

      const response = await fetch(`/api/auth/me?org=${orgSlug}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setOrganization(data.organization);
      } else {
        setUser(null);
        setOrganization(null);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
      setOrganization(null);
    }
  };

  // Login function
  const login = async (email: string, password: string, organizationSlug?: string): Promise<void> => {
    const orgSlug = organizationSlug || getOrganizationSlug();
    if (!orgSlug) {
      throw new Error('Organization not specified');
    }

    const response = await fetch(`/api/auth/login?org=${orgSlug}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, organizationSlug: orgSlug }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    setUser(data.user);
    setOrganization(data.organization);

    // Redirect to organization subdomain if not already there
    if (window.location.hostname !== `${orgSlug}.${getBaseDomain()}`) {
      window.location.href = `${window.location.protocol}//${orgSlug}.${getBaseDomain()}`;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setOrganization(null);
      
      // Redirect to main domain
      window.location.href = `${window.location.protocol}//${getBaseDomain()}`;
    }
  };

  // Get organization slug from subdomain or URL
  const getOrganizationSlug = (): string | null => {
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
    return urlParams.get('org');
  };

  // Get base domain (without subdomain)
  const getBaseDomain = (): string => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    if (parts.length > 2) {
      return parts.slice(1).join('.');
    }
    
    return hostname;
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const value: AuthContextType = {
    user,
    organization,
    isLoading,
    isAuthenticated,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth() {
  const auth = useAuth();
  
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Redirect to login
      const orgSlug = window.location.hostname.split('.')[0];
      if (orgSlug && orgSlug !== 'www') {
        window.location.href = `/login?org=${orgSlug}`;
      } else {
        window.location.href = '/login';
      }
    }
  }, [auth.isLoading, auth.isAuthenticated]);

  return auth;
}

// Hook for permission-based access
export function usePermission(permission: Permission) {
  const auth = useAuth();
  return auth.hasPermission(permission);
}

// Hook for role-based access
export function useRole(roles: string | string[]) {
  const auth = useAuth();
  const userRole = auth.user?.role;
  
  if (!userRole) return false;
  
  if (typeof roles === 'string') {
    return userRole === roles;
  }
  
  return roles.includes(userRole);
}
