/**
 * Public API origin used by browser code and server-side callers.
 * Browser bundles use NEXT_PUBLIC_API_URL; AUTH_API_URL remains server-only.
 */
const candidate =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3001');

if (!candidate) {
  throw new Error('Missing NEXT_PUBLIC_API_URL in production.');
}

function normalizeApiRoot(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('API URL must be an absolute http(s) URL.');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('API URL must use http:// or https://.');
  }
  if (url.username || url.password) {
    throw new Error('API URL must not contain embedded credentials.');
  }
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]';
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:' && !isLocalhost) {
    throw new Error('Production API URL must use HTTPS.');
  }

  const path = url.pathname.replace(/\/+$/, '');
  if (path !== '' && path !== '/api' && path !== '/api/auth') {
    throw new Error('API URL path must be empty, /api, or /api/auth.');
  }

  url.pathname = '';
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

export const apiRoot = normalizeApiRoot(candidate);
export const apiBaseUrl = `${apiRoot}/api`;
export const authBaseUrl = `${apiBaseUrl}/auth`;
