// Path: /context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../utils/api';

// Types
interface User {
  id: string;
  username: string;
  email: string;
  profilePic?: string;
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  logout: () => Promise<void>;
  clearAuth: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a custom fetch function that will be used throughout the app
let authContext: AuthContextType | null = null;

// Enhanced fetch function with automatic token handling
const createAuthenticatedFetch = () => {
  const originalFetch = global.fetch;
  
  global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    
    // Only intercept API calls to your backend
    if (url.startsWith(API_BASE_URL)) {
      const headers = new Headers(init?.headers);
      
      // Add Authorization header if we have a token and it's not already set
      if (authContext?.accessToken && !headers.get('Authorization')) {
        headers.set('Authorization', `Bearer ${authContext.accessToken}`);
      }
      
      // Always include credentials for httpOnly cookies
      const requestInit: RequestInit = {
        ...init,
        headers,
        credentials: 'include',
      };
      
      let response = await originalFetch(input, requestInit);
      
      // Handle 403 Unauthorized
      if (response.status === 403 && authContext) {
        try {
          console.log('Token expired, attempting refresh...');
          
          // Try to refresh the token
          const refreshResponse = await originalFetch(`${API_BASE_URL}/api/v1/auth/access-token`, {
            method: 'GET',
            credentials: 'include',
          });
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            const newToken = refreshData.data.accessToken;
            
            // Update the token in context
            authContext.setAccessToken(newToken);
            
            // Retry the original request with the new token
            headers.set('Authorization', `Bearer ${newToken}`);
            requestInit.headers = headers;
            
            response = await originalFetch(input, requestInit);
          } else {
            // Refresh failed, clear auth and logout
            console.log('Token refresh failed, logging out...');
            authContext.clearAuth();
          }
        } catch (error) {
          console.error('Token refresh error:', error);
          authContext.clearAuth();
        }
      }
      
      return response;
    }
    
    // For non-API calls, use original fetch
    return originalFetch(input, init);
  };
};

// AuthProvider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!accessToken;

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
    
    // Set up the fetch interceptor
    createAuthenticatedFetch();
    
    // Clean up on unmount
    return () => {
      // Reset fetch to original if needed (though this rarely happens in React Native)
      // global.fetch = originalFetch;
    };
  }, []);

  // Update the global auth context reference whenever state changes
  useEffect(() => {
    authContext = {
      user,
      accessToken,
      isLoading,
      isAuthenticated,
      setUser,
      setAccessToken,
      logout,
      clearAuth,
    };
  }, [user, accessToken, isLoading, isAuthenticated]);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Try to refresh token on app start (this will work if refresh token exists in httpOnly cookie)
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/access-token`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        const newToken = result.data.accessToken;
        setAccessToken(newToken);
        
        // If you have a "get current user" endpoint, call it here
        // For now, we'll assume login/register will set the user
        console.log('Token refreshed on app start');
      }
    } catch (error) {
      console.log('No valid session found on startup');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuth = () => {
    setAccessToken(null);
    setUser(null);
  };

  const logout = async (): Promise<void> => {
    try {
      // Call logout endpoint to clear refresh token
      await fetch(`${API_BASE_URL}/api/v1/network/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      clearAuth();
    }
  };

  const contextValue: AuthContextType = {
    user,
    accessToken,
    isLoading,
    isAuthenticated,
    setUser,
    setAccessToken,
    logout,
    clearAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;