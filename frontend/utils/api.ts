// Path: /utils/api.ts

// Base URL resolution: prefer env, fall back to your dev tunnel
const LOCALHOST = "https://tg1bczp0-4000.use.devtunnels.ms";
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? LOCALHOST;

/** Case-insensitive header merge; later values override earlier ones. */
function mergeHeaders(a?: HeadersInit, b?: HeadersInit): Headers {
  const out = new Headers(a || {});
  if (b) new Headers(b).forEach((v, k) => out.set(k, v));
  return out;
}

/** Build URL with optional query params. */
function buildUrl(endpoint: string, params?: Record<string, any>): string {
  const base = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  if (!params || Object.keys(params).length === 0) return base;

  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) value.forEach((v) => url.searchParams.append(key, String(v)));
    else url.searchParams.set(key, String(value));
  });
  return url.toString();
}

type RequestOptions = Omit<RequestInit, "headers" | "body" | "method"> & {
  headers?: HeadersInit;
  /** GET query params */
  params?: Record<string, any>;
  /** JSON body (non-GET). If you pass this, we JSON.stringify it for you. */
  data?: unknown;
  /** FormData for uploads; we DO NOT set a Content-Type when this is used. */
  formData?: FormData;
  /** Raw body passthrough for full backward compatibility. */
  body?: BodyInit;
};

/**
 * Core request helper with backward compatibility:
 * - Keeps `Content-Type: application/json` on GET (some backends expect it).
 * - Accepts either `data` (preferred) or a raw `body` (legacy).
 * - For FormData, never sets Content-Type (let fetch add boundary).
 * - Auth header is injected by the AuthProvider fetch interceptor.
 */
async function request(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  endpoint: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { headers: extraHeaders, params, data, formData, body: rawBody, ...rest } = options;

  const url = buildUrl(endpoint, params);

  // Defaults: keep JSON content-type even on GET for compatibility
  const defaultHeaders =
    method === "GET" ? { "Content-Type": "application/json" } : { "Content-Type": "application/json" };

  const headers = mergeHeaders(defaultHeaders, extraHeaders);

  let body: BodyInit | undefined;

  if (rawBody !== undefined) {
    // Legacy pass-through (e.g. workoutApi.delete used this)
    body = rawBody;
    // If user supplied their own rawBody, don't touch Content-Type
  } else if (formData) {
    body = formData;
    headers.delete("Content-Type"); // boundary will be set by fetch
  } else if (data !== undefined && method !== "GET") {
    // Only send JSON for non-GET requests
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    body = JSON.stringify(data);
  }

  // No body is sent for GET unless caller explicitly passed `body`
  return fetch(url, { method, headers, body, ...rest });
}

/* ------------------------------- Public API ------------------------------- */

function normalizeDataAndOptions(
  dataOrOptions?: unknown,
  maybeOptions?: RequestOptions
): { data?: unknown; options?: RequestOptions } {
  // Two-call forms supported:
  //   post(url, payload)
  //   post(url, payload, options)
  //   post(url, { data: payload, headers, params, ... })
  if (maybeOptions !== undefined) {
    return { data: dataOrOptions, options: maybeOptions };
  }
  if (
    dataOrOptions &&
    typeof dataOrOptions === "object" &&
    ("data" in (dataOrOptions as any) ||
      "headers" in (dataOrOptions as any) ||
      "params" in (dataOrOptions as any) ||
      "body" in (dataOrOptions as any) ||
      "formData" in (dataOrOptions as any))
  ) {
    const o = dataOrOptions as RequestOptions;
    return { data: o.data, options: o };
  }
  return { data: dataOrOptions, options: undefined };
}

export const api = {
  /** Join base + endpoint (useful for non-fetch consumers) */
  url: (endpoint: string) => (endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`),

  get: (endpoint: string, options?: Omit<RequestOptions, "data" | "formData">) =>
    request("GET", endpoint, options),

  post: (endpoint: string, dataOrOptions?: unknown, maybeOptions?: RequestOptions) => {
    const { data, options } = normalizeDataAndOptions(dataOrOptions, maybeOptions);
    return request("POST", endpoint, { ...options, data });
  },

  put: (endpoint: string, dataOrOptions?: unknown, maybeOptions?: RequestOptions) => {
    const { data, options } = normalizeDataAndOptions(dataOrOptions, maybeOptions);
    return request("PUT", endpoint, { ...options, data });
  },

  patch: (endpoint: string, dataOrOptions?: unknown, maybeOptions?: RequestOptions) => {
    const { data, options } = normalizeDataAndOptions(dataOrOptions, maybeOptions);
    return request("PATCH", endpoint, { ...options, data });
  },

  // Accepts either { body } (legacy) OR { data } (preferred)
  delete: (endpoint: string, options?: RequestOptions) => request("DELETE", endpoint, options),

  /** For uploads; do not set content-type manually */
  postFormData: (endpoint: string, formData: FormData, options?: Omit<RequestOptions, "data">) =>
    request("POST", endpoint, { ...options, formData }),
};