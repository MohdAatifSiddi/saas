import useSWRMutation from 'swr/mutation';
import { authClient } from '@/lib/auth-client';

export interface ResetPasswordVars {
  newPassword: string;
  token: string;
}

async function resetPasswordFetcher(
  _key: string,
  { arg }: { arg: ResetPasswordVars },
) {
  // Do not log these values. The token is a credential and the password must
  // never be copied, transformed, or persisted by this hook.
  if (!arg.token || arg.token.length > 4096 || !arg.newPassword) {
    throw new Error('The reset link is invalid or has expired.');
  }

  const { data, error } = await authClient.resetPassword({
    newPassword: arg.newPassword,
    token: arg.token,
  });

  if (error) {
    console.error('Raw Better Auth resetPassword error:', error);
    if (error.status === 429) {
      throw new Error('Too many requests. Please wait before trying again.');
    }
    if (error.code === 'INVALID_TOKEN' || error.code === 'EXPIRED_TOKEN') {
      throw new Error('The reset link is invalid or has expired.');
    }
    throw new Error('Unable to reset your password. Please try again.');
  }

  return data;
}

export function useResetPassword() {
  const { trigger, isMutating, error, data, reset } = useSWRMutation(
    'auth/reset-password',
    resetPasswordFetcher,
  );

  return { trigger, isMutating, error, data, reset };
}
