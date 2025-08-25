// Path: /utils/api.ts

// Base URL
const FALLBACK = "https://m7txxrts-4000.use.devtunnels.ms";
export const API_BASE_URL =
  (typeof process !== "undefined" && (process.env as any)?.EXPO_PUBLIC_API_URL) || FALLBACK;

// ---- Access token handling -------------------------------------------------
let _accessToken: string | null = null;

/**
 * Called by AuthProvider / UserProvider:
 *   (api as any).setAccessToken(token)
 */
function setAccessToken(token: string | null) {
  _accessToken = token || null;
}

function withAuthHeaders(extra?: Record<string, string>) {
  return {
    "Content-Type": "application/json",
    ...( _accessToken ? { Authorization: `Bearer ${_accessToken}` } : {} ),
    ...(extra || {}),
  };
}

function url(endpoint: string) {
  return `${API_BASE_URL}${endpoint}`;
}

// ---- Core request helpers --------------------------------------------------
async function request(
  endpoint: string,
  init: RequestInit
): Promise<Response> {
  const headers = withAuthHeaders(init.headers as Record<string, string>);
  return fetch(url(endpoint), { ...init, headers });
}

// ---- Public API ------------------------------------------------------------
export const api = {
  setAccessToken,

  url,

  get: (endpoint: string, options?: RequestInit) =>
    request(endpoint, { method: "GET", ...(options || {}) }),

  post: (endpoint: string, data?: any, options?: RequestInit) =>
    request(endpoint, {
      method: "POST",
      body: data !== undefined ? JSON.stringify(data) : undefined,
      ...(options || {}),
    }),

  put: (endpoint: string, data?: any, options?: RequestInit) =>
    request(endpoint, {
      method: "PUT",
      body: data !== undefined ? JSON.stringify(data) : undefined,
      ...(options || {}),
    }),

  patch: (endpoint: string, data?: any, options?: RequestInit) =>
    request(endpoint, {
      method: "PATCH",
      body: data !== undefined ? JSON.stringify(data) : undefined,
      ...(options || {}),
    }),

  delete: (endpoint: string, options?: RequestInit) =>
    request(endpoint, { method: "DELETE", ...(options || {}) }),

  // Do NOT set Content-Type for FormData — the browser/native sets the boundary
  postFormData: (endpoint: string, formData: FormData, options?: RequestInit) =>
    fetch(url(endpoint), {
      method: "POST",
      body: formData,
      headers: _accessToken ? { Authorization: `Bearer ${_accessToken}` } : undefined,
      ...(options || {}),
    }),
};
