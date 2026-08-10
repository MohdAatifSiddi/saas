import useSWRMutation from 'swr/mutation';
import { authClient } from '@/lib/auth-client';

export interface ForgotPasswordVars {
  email: string;
  redirectTo: string;
}

async function forgotPasswordFetcher(
  key: string,
  { arg }: { arg: ForgotPasswordVars }
) {
  // Better Auth SDK handles the fetch. We throw the error if one is returned
  // to ensure SWR handles it appropriately.
  // @ts-expect-error - forgetPassword is not inferred correctly without the server config
  const { data, error } = await authClient.forgetPassword({
    email: arg.email,
    redirectTo: arg.redirectTo,
  });

  if (error) {
    // If the error code or status suggests rate-limiting, return a customized message
    if (error.status === 429) {
      throw new Error('Too many reset requests. Please wait before trying again.');
    }
    throw new Error(error.message || 'Unable to send the reset email. Please try again.');
  }

  return data;
}

export function useForgotPassword() {
  const { trigger, isMutating, error, data } = useSWRMutation(
    'auth/forgot-password',
    forgotPasswordFetcher
  );

  return {
    trigger,
    isMutating,
    error,
    data,
  };
}
