import useSWR from 'swr';
import { swrFetcher } from '@/lib/api-client';
import { Session, User } from 'better-auth';

interface SessionData {
  session: Session;
  user: User;
}

export function useSession() {
  const { data, error, isLoading, mutate } = useSWR<SessionData>('/get-session', swrFetcher);

  return {
    session: data?.session || null,
    user: data?.user || null,
    isLoading,
    error,
    mutate, // Expose mutate for cache synchronization
  };
}
