import { createAuthClient } from 'better-auth/react';
import { authBaseUrl } from './env';

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? `${window.location.origin}/api/auth` : authBaseUrl,
  advanced: {
    cookiePrefix: 'saas-platform',
  },
});
