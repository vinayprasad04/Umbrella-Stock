'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ClientAuth, TokenRefreshService } from './auth';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: any, user: User) => void;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = () => {
      try {
        const currentUser = ClientAuth.getCurrentUser();
        const isAuth = ClientAuth.isAuthenticated();
        
        if (isAuth && currentUser) {
          setUser(currentUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        // Check if access token needs refresh (1 minute before expiry)
        if (ClientAuth.isAccessTokenExpired() && !ClientAuth.isRefreshTokenExpired()) {
          await TokenRefreshService.refreshAccessToken();
          console.log('✅ Token refreshed automatically');
        }
      } catch (error) {
        console.error('❌ Automatic token refresh failed:', error);
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user]);

  // Set up visibility change listener for token refresh
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        try {
          // Check tokens when user comes back to the page
          if (ClientAuth.isRefreshTokenExpired()) {
            logout();
          } else if (ClientAuth.isAccessTokenExpired()) {
            await TokenRefreshService.refreshAccessToken();
            console.log('✅ Token refreshed on page focus');
          }
        } catch (error) {
          console.error('❌ Token refresh on focus failed:', error);
          logout();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const login = (tokens: any, userData: User) => {
    ClientAuth.setTokens(tokens);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    ClientAuth.clearTokens();
    setUser(null);
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const refreshToken = async () => {
    try {
      await TokenRefreshService.refreshAccessToken();
    } catch (error) {
      console.error('Manual token refresh failed:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && ClientAuth.isAuthenticated(),
    isLoading,
    login,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook for protected routes
export const useRequireAuth = (redirectUrl = '/login') => {
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = redirectUrl;
      }
    }
  }, [isAuthenticated, isLoading, redirectUrl]);

  return { user, isAuthenticated, isLoading };
};

// Hook for role-based access
export const useRequireRole = (requiredRoles: string[], redirectUrl = '/') => {
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const hasRequiredRole = requiredRoles.includes(user.role);
      if (!hasRequiredRole) {
        if (typeof window !== 'undefined') {
          window.location.href = redirectUrl;
        }
      }
    }
  }, [user, isAuthenticated, isLoading, requiredRoles, redirectUrl]);

  return { user, isAuthenticated, isLoading };
};