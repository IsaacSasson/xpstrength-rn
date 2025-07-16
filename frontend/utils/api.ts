// API Configuration
const LOCALHOST = 'http://localhost:4000'; // iOS simulator or web
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? LOCALHOST;

// Simple API utility functions - auth is handled automatically by the AuthProvider interceptor
export const api = {
  // Helper to construct full URLs
  url: (endpoint: string) => `${API_BASE_URL}${endpoint}`,

  // Convenience methods for common HTTP verbs
  get: (endpoint: string, options?: RequestInit) =>
    fetch(api.url(endpoint), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    }),

  post: (endpoint: string, data?: any, options?: RequestInit) =>
    fetch(api.url(endpoint), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),

  put: (endpoint: string, data?: any, options?: RequestInit) =>
    fetch(api.url(endpoint), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),

  patch: (endpoint: string, data?: any, options?: RequestInit) =>
    fetch(api.url(endpoint), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),

  delete: (endpoint: string, options?: RequestInit) =>
    fetch(api.url(endpoint), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    }),

  // Special method for FormData (like file uploads)
  postFormData: (endpoint: string, formData: FormData, options?: RequestInit) =>
    fetch(api.url(endpoint), {
      method: 'POST',
      body: formData,
      // Don't set Content-Type for FormData, let browser set it with boundary
      ...options,
    }),
};