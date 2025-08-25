// Path: /context/AuthProvider.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../utils/api";

/* ----------------------------- SecureStore keys ----------------------------- */
const REFRESH_TOKEN_KEY = "refreshToken";

/* ---------------------------------- Types ---------------------------------- */
interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => Promise<void>;
  signIn: (
    userData: User,
    accessToken: string,
    refreshToken?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => Promise<void>;
}

/* ------------------------------- Auth context ------------------------------- */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/*
  Global reference that the fetch interceptor reads from.
  We update it from the provider via useEffect.
*/
let authContext: AuthContextType | null = null;

/*
  Single-flight refresh: all 401s wait for the same refresh.
  Resolves to a string accessToken on success, or null on failure.
*/
let refreshPromise: Promise<string | null> | null = null;

/*
  Make fetch patch idempotent so we don't wrap multiple times in fast refresh/dev.
*/
let fetchPatched = false;

/* Augment RequestInit so we can mark retried requests */
interface RetriableRequestInit extends RequestInit {
  _retry?: boolean;
}

/* ----------------------- Install authenticated fetch ----------------------- */
const createAuthenticatedFetch = () => {
  if (fetchPatched) return;
  fetchPatched = true;

  const originalFetch = global.fetch;

  // Helper: perform the refresh using the original fetch
  const doRefresh = async (): Promise<string | null> => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;

      const res = await originalFetch(
        `${API_BASE_URL}/api/v1/auth/access-token`,
        {
          method: "GET",
          // Server expects lowercase 'refreshtoken'
          headers: { refreshtoken: refreshToken },
        }
      );

      if (!res.ok) return null;

      const json = await res.json();
      const newAccess = json?.data?.accessToken as string | undefined;
      const newRefresh = json?.data?.refreshToken as string | undefined;

      if (!newAccess) return null;

      // Update context with new tokens
      authContext?.setAccessToken(newAccess);
      if (newRefresh) {
        await authContext?.setRefreshToken(newRefresh);
      }

      return newAccess;
    } catch {
      return null;
    }
  };

  global.fetch = async (
    input: RequestInfo | URL,
    init?: RetriableRequestInit
  ): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();

    // Only intercept calls to our API
    if (!url.startsWith(API_BASE_URL)) {
      return originalFetch(input, init);
    }

    // Never intercept the refresh endpoint to avoid loops
    const isRefreshEndpoint = url.includes("/api/v1/auth/access-token");
    if (isRefreshEndpoint) {
      return originalFetch(input, init);
    }

    // Prepare headers; attach Authorization if we have a token and it isn't already set
    const headers = new Headers(init?.headers);
    if (authContext?.accessToken && !headers.get("Authorization")) {
      headers.set("Authorization", `Bearer ${authContext.accessToken}`);
    }

    const firstTryInit: RetriableRequestInit = {
      ...init,
      headers,
    };

    // First attempt
    let response = await originalFetch(input, firstTryInit);

    // If not 401, or we already retried, return it
    if (response.status !== 401 || init?._retry) {
      return response;
    }

    // On 401 — try to refresh once, shared among all callers
    try {
      if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => {
          // Allow a new refresh attempt for future 401s
          refreshPromise = null;
        });
      }

      const newAccess = await refreshPromise;

      // If refresh failed, clear auth and return original 401
      if (!newAccess) {
        await authContext?.clearAuth();
        return response;
      }

      // Refresh succeeded — retry original request with new token
      const retryHeaders = new Headers(firstTryInit.headers);
      retryHeaders.set("Authorization", `Bearer ${newAccess}`);

      const retryInit: RetriableRequestInit = {
        ...firstTryInit,
        headers: retryHeaders,
        _retry: true,
      };

      return await originalFetch(input, retryInit);
    } catch {
      // If anything goes wrong here, do not loop — clear auth and return the original response
      await authContext?.clearAuth();
      return response;
    }
  };
};

/* ----------------------------- AuthProvider ----------------------------- */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!accessToken;

  const setAccessToken = (token: string | null) => {
    setAccessTokenState(token);
    if (!token) setIsLoading(false);
  };

  const setUserWithLoadingState = (userData: User | null) => {
    setUser(userData);
    if (!userData) setIsLoading(false);
  };

  const setRefreshToken = async (token: string | null): Promise<void> => {
    if (token) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  };

  const clearAuth = async (): Promise<void> => {
    setAccessTokenState(null);
    setUser(null);
    await setRefreshToken(null);
  };

  const logout = async (): Promise<void> => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken ?? ""}`,
          // Server expects lowercase 'refreshtoken'
          refreshtoken: refreshToken ?? "",
        },
      });
    } catch {
      // ignore network/logout errors
    } finally {
      await clearAuth();
    }
  };

  const signIn = useCallback(
    async (userData: User, accessTokenData: string, refreshTokenData?: string) => {
      setUser(userData);
      setAccessTokenState(accessTokenData);
      if (refreshTokenData) {
        await setRefreshToken(refreshTokenData);
      }
      setIsLoading(false);
    },
    []
  );

  // Initialize + patch fetch once
  useEffect(() => {
    initializeAuth();
    createAuthenticatedFetch();
    // no unpatch in RN; safe to keep patched until app exit
  }, []);

  // Keep global reference fresh for the interceptor
  useEffect(() => {
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
  }, [user, accessToken, isLoading, isAuthenticated, signIn, logout]);

  useEffect(() => {
    if (user && accessToken) {
      setIsLoading(false);
    }
  }, [user, accessToken]);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        // Try to get a fresh access token on startup
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/access-token`, {
          method: "GET",
          // Server expects lowercase 'refreshtoken'
          headers: { refreshtoken: refreshToken },
        });

        if (res.ok) {
          const data = await res.json();
          const newAccess = data?.data?.accessToken as string | undefined;
          const newRefresh = data?.data?.refreshToken as string | undefined;

          if (newAccess) setAccessTokenState(newAccess);
          if (newRefresh) await setRefreshToken(newRefresh);

          // Optional: fetch profile here to auto-populate user on cold start
          // If you have an endpoint like /me, you can setUserWithLoadingState(...)
        } else {
          await setRefreshToken(null);
        }
      }
    } catch {
      await setRefreshToken(null);
    } finally {
      setIsLoading(false);
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

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

/* ------------------------------ Public hook ------------------------------ */
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export default AuthProvider;