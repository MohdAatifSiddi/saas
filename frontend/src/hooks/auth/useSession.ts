import useSWR from 'swr';
import { swrFetcher } from '@/lib/api-client';
import type { Session, User } from 'better-auth';

interface SessionData {
  session: Session;
  user: User;
}

export function useSession() {
  const { data, error, isLoading, mutate } = useSWR<SessionData | null>(
    // Better Auth exposes get-session beneath /api/auth, not /api directly.
    '/auth/get-session',
    swrFetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
      keepPreviousData: true,
    },
  );

  return {
    session: data?.session ?? null,
    user: data?.user ?? null,
    isLoading,
    error,
    mutate,
  };
}
