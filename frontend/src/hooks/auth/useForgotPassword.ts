import useSWRMutation from 'swr/mutation';
import { authClient } from '@/lib/auth-client';

export interface ForgotPasswordVars {
  email: string;
  redirectTo: string;
}

function isSafeRedirectTo(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('//')) return false;

  try {
    const url = new URL(trimmed, window.location.origin);
    return url.origin === window.location.origin && url.protocol === window.location.protocol;
  } catch {
    return false;
  }
}

async function forgotPasswordFetcher(
  _key: string,
  { arg }: { arg: ForgotPasswordVars },
) {
  const email = arg.email.trim();
  const redirectTo = arg.redirectTo.trim();

  if (!email || email.length > 320 || !isSafeRedirectTo(redirectTo)) {
    throw new Error('Please enter a valid email address.');
  }

  const { data, error } = await authClient.requestPasswordReset({
    email,
    redirectTo,
  });

  if (error) {
    const errObj = error as any;
    console.error('Raw Better Auth forgotPassword error:', {
      message: errObj.message,
      status: errObj.status,
      code: errObj.code,
      statusText: errObj.statusText,
      body: errObj.body,
      raw: error,
    });
    // Keep account existence and provider details opaque to the user.
    if (error.status === 429) {
      throw new Error('Too many reset requests. Please wait before trying again.');
    }
    throw new Error('If an account matches, password-reset instructions will be sent shortly.');
  }

  return data;
}

export function useForgotPassword() {
  const { trigger, isMutating, error, data, reset } = useSWRMutation(
    'auth/forgot-password',
    forgotPasswordFetcher,
  );

  return { trigger, isMutating, error, data, reset };
}
