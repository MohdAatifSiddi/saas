export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/auth';

/**
 * A centralized API fetcher abstraction.
 * Resolves base URLs, includes credentials, normalizes errors, and parses JSON.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    // Ensure credentials are sent for cross-origin requests
    credentials: options.credentials || 'include',
  });

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      (data && data.message) || response.statusText || 'API request failed',
      data
    );
  }

  return data as T;
}

/**
 * SWR fetcher compatible function.
 */
export const swrFetcher = async <T>(url: string): Promise<T> => apiClient<T>(url);
