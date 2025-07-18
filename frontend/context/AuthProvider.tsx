// Path: /context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../utils/api';

// Constants for SecureStore keys
const REFRESH_TOKEN_KEY = 'refreshToken';

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
  setRefreshToken: (token: string | null) => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => Promise<void>;
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
      
      const requestInit: RequestInit = {
        ...init,
        headers,
      };
      
      let response = await originalFetch(input, requestInit);
      
      // Handle 403 Unauthorized
      if (response.status === 403 && authContext) {
        try {
          console.log('Token expired, attempting refresh...');
          
          // Get refresh token from SecureStore
          const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
          
          if (!refreshToken) {
            console.log('No refresh token found, logging out...');
            await authContext.clearAuth();
            return response;
          }
          
          // Try to refresh the token with custom header
          const refreshResponse = await originalFetch(`${API_BASE_URL}/api/v1/auth/access-token`, {
            method: 'GET',
            headers: {
              'refreshToken': refreshToken,
            },
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
            await authContext.clearAuth();
          }
        } catch (error) {
          console.error('Token refresh error:', error);
          await authContext.clearAuth();
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
      setRefreshToken,
      logout,
      clearAuth,
    };
  }, [user, accessToken, isLoading, isAuthenticated]);

  const setRefreshToken = async (token: string | null): Promise<void> => {
    try {
      if (token) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
      } else {
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error managing refresh token in SecureStore:', error);
    }
  };

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Try to get refresh token from SecureStore
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      
      if (refreshToken) {
        // Try to refresh token on app start
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/access-token`, {
          method: 'GET',
          headers: {
            'refreshToken': refreshToken,
          },
        });

        if (response.ok) {
          const result = await response.json();
          const newToken = result.data.accessToken;
          setAccessToken(newToken);
          
          // If you have a "get current user" endpoint, call it here
          // For now, we'll assume login/register will set the user
          console.log('Token refreshed on app start');
        } else {
          // Refresh token is invalid, clear it
          await setRefreshToken(null);
        }
      }
    } catch (error) {
      console.log('No valid session found on startup');
      await setRefreshToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuth = async (): Promise<void> => {
    setAccessToken(null);
    setUser(null);
    await setRefreshToken(null);
  };

  const logout = async (): Promise<void> => {
    try {
      // Get refresh token for logout call
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      
      // Call logout endpoint to invalidate tokens
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'refreshToken': refreshToken || '',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      await clearAuth();
    }
  };

  const contextValue: AuthContextType = {
    user,
    accessToken,
    isLoading,
    isAuthenticated,
    setUser,
    setAccessToken,
    setRefreshToken,
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