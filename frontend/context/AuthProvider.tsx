// Path: /context/AuthProvider.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../utils/api';

// Constants for SecureStore keys
const REFRESH_TOKEN_KEY = 'refreshToken';

// Types
interface User {
  id: string;
  username: string;
  email: string;
  // Removed profilePic and other fields - we only need basic info
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => Promise<void>;
  signIn: (userData: User, accessToken: string, refreshToken?: string) => void;
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
      
      // Handle 401 Unauthorized
      if (response.status === 401 && authContext) {
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
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!accessToken;

  // Enhanced setAccessToken that manages loading state better
  const setAccessToken = (token: string | null) => {
    console.log('🔑 Setting access token:', !!token);
    setAccessTokenState(token);
    // Only set loading to false if we're clearing the token OR if we have both token and user
    if (!token) {
      setIsLoading(false);
    }
  };

  // Enhanced setUser that manages loading state better  
  const setUserWithLoadingState = (userData: User | null) => {
    console.log('👤 Setting user:', userData?.username || 'null');
    setUser(userData);
    // Only set loading to false if we're clearing the user OR if we have both user and token
    if (!userData) {
      setIsLoading(false);
    }
  };

  // Effect to manage loading state when both user and token are set
  useEffect(() => {
    if (user && accessToken) {
      console.log('✅ Both user and token set, authentication complete');
      setIsLoading(false);
    }
  }, [user, accessToken]);

  // Atomic function to set both user and token at once - helps with timing issues
  const signIn = useCallback((userData: User, accessTokenData: string, refreshTokenData?: string) => {
    console.log('🔐 Atomic sign in:', userData.username);
    setUser(userData);
    setAccessTokenState(accessTokenData);
    if (refreshTokenData) {
      setRefreshToken(refreshTokenData);
    }
    setIsLoading(false);
  }, []);

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
    console.log('🔄 Auth state changed:', { 
      hasUser: !!user, 
      hasToken: !!accessToken, 
      isAuthenticated, 
      isLoading 
    });
    
    authContext = {
      user,
      accessToken,
      isLoading,
      isAuthenticated,
      setUser: setUserWithLoadingState,
      setAccessToken,
      setRefreshToken,
      signIn,
      logout,
      clearAuth,
    };
  }, [user, accessToken, isLoading, isAuthenticated, signIn]);

  const setRefreshToken = async (token: string | null): Promise<void> => {
    try {
      if (token) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
        console.log('🔒 Refresh token stored');
      } else {
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        console.log('🔓 Refresh token cleared');
      }
    } catch (error) {
      console.error('Error managing refresh token in SecureStore:', error);
    }
  };

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      console.log('🚀 Initializing auth...');
      
      // Try to get refresh token from SecureStore
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      
      if (refreshToken) {
        console.log('🔄 Found refresh token, attempting to refresh...');
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
          setAccessTokenState(newToken);
          console.log('✅ Token refreshed on app start');
          
          // Note: We don't have user data here, but that's okay
          // The app will need to handle this state appropriately
          // For now, we'll just have the token without user data
        } else {
          console.log('❌ Refresh token invalid, clearing...');
          // Refresh token is invalid, clear it
          await setRefreshToken(null);
        }
      } else {
        console.log('ℹ️ No refresh token found');
      }
    } catch (error) {
      console.log('⚠️ No valid session found on startup:', error);
      await setRefreshToken(null);
    } finally {
      console.log('🏁 Auth initialization complete');
      setIsLoading(false);
    }
  };

  const clearAuth = async (): Promise<void> => {
    console.log('🧹 Clearing auth state');
    setAccessTokenState(null);
    setUser(null);
    await setRefreshToken(null);
    // Don't set loading to true here, as we want other contexts to know auth is cleared
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('👋 Logging out...');
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
    setUser: setUserWithLoadingState,
    setAccessToken,
    setRefreshToken,
    signIn,
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