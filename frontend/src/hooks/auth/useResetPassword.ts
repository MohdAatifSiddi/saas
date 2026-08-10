import useSWRMutation from 'swr/mutation';
import { authClient } from '@/lib/auth-client';

export interface ResetPasswordVars {
  newPassword: string;
  token: string;
}

async function resetPasswordFetcher(
  key: string,
  { arg }: { arg: ResetPasswordVars }
) {
  const { data, error } = await authClient.resetPassword({
    newPassword: arg.newPassword,
    token: arg.token,
  });

  if (error) {
    if (error.status === 429) {
      throw new Error('Too many requests. Please wait before trying again.');
    }
    // Safeguard for invalid/expired token responses
    if (error.code === 'INVALID_TOKEN' || error.code === 'EXPIRED_TOKEN') {
      throw new Error('INVALID_OR_EXPIRED_TOKEN');
    }
    throw new Error(error.message || 'Unable to reset your password. Please try again.');
  }

  return data;
}

export function useResetPassword() {
  const { trigger, isMutating, error, data } = useSWRMutation(
    'auth/reset-password',
    resetPasswordFetcher
  );

  return {
    trigger,
    isMutating,
    error,
    data,
  };
}
