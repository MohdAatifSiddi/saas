import { apiBaseUrl, apiRoot } from './env';

export class ApiError extends Error {
  public readonly status: number;
  public readonly data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const API_BASE_URL = apiBaseUrl;
const REQUEST_TIMEOUT_MS = 10_000;

export interface ApiClientOptions extends RequestInit {
  skipAuthRedirect?: boolean;
}

function resolveApiUrl(endpoint: string): string {
  if (endpoint.startsWith('/')) {
    return new URL(endpoint, `${apiBaseUrl}/`).toString();
  }

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new TypeError('API endpoint must be an absolute URL or a path beginning with /.');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new TypeError('API endpoint must use http:// or https://.');
  }
  if (url.origin !== apiRoot) {
    throw new TypeError('API endpoint origin is not allowed.');
  }
  return url.toString();
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) return undefined;

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  const text = await response.text();
  if (!text) return undefined;

  if (contentType.includes('application/json') || contentType.includes('+json')) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new ApiError(response.status, 'Server returned malformed JSON.');
    }
  }
  return text;
}

export async function apiClient<T>(
  endpoint: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const { skipAuthRedirect, ...requestInit } = options;
  const url = resolveApiUrl(endpoint);
  const headers = new Headers(requestInit.headers);

  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (
    requestInit.body !== undefined &&
    requestInit.body !== null &&
    !(requestInit.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const callerSignal = requestInit.signal;
  const abortCaller = () => controller.abort(callerSignal?.reason);
  callerSignal?.addEventListener('abort', abortCaller, { once: true });

  try {
    const response = await fetch(url, {
      ...requestInit,
      headers,
      signal: controller.signal,
      credentials: requestInit.credentials ?? 'include',
    });
    const data = await readResponseBody(response);

    if (!response.ok) {
      let message = response.statusText || 'API request failed';
      if (data && typeof data === 'object' && 'message' in data) {
        const candidate = (data as { message?: unknown }).message;
        if (typeof candidate === 'string' && candidate.length <= 500) message = candidate;
      } else if (typeof data === 'string' && data.length <= 500) {
        message = data;
      }

      if (
        response.status === 401 &&
        typeof window !== 'undefined' &&
        !skipAuthRedirect
      ) {
        window.location.replace('/login?error=session_expired');
      }
      throw new ApiError(response.status, message, data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, 'The API request timed out.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    callerSignal?.removeEventListener('abort', abortCaller);
  }
}

export const swrFetcher = async <T>(url: string): Promise<T> => apiClient<T>(url);
