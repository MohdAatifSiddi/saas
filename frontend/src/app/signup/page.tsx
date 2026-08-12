import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Session, User } from 'better-auth';
import { SignupForm } from '@/components/signup-form';
import { authClient } from '@/lib/auth-client';

const sessionCookieNames = [
  'saas-platform.session_token',
  '__Secure-saas-platform.session_token',
  'better-auth.session_token',
  '__Secure-better-auth.session_token',
] as const;

type SessionData = {
  session: Session;
  user: User;
};

export const metadata: Metadata = {
  title: 'Create your account',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SignupPage() {
  const cookieStore = await cookies();
  const hasSessionCookie = sessionCookieNames.some((name) => cookieStore.has(name));

  let activeSession: SessionData | null = null;

  if (hasSessionCookie) {
    const requestHeaders = await headers();
    const cookieHeader = requestHeaders.get('cookie') ?? '';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2_000);

    try {
      const { data } = await authClient.getSession({
        fetchOptions: {
          headers: { cookie: cookieHeader },
          signal: controller.signal,
          cache: 'no-store',
        },
      });
      activeSession = (data as SessionData | null) ?? null;
    } catch {
      // A failed session check should fail open to the public signup page;
      // protected resources must still validate sessions independently.
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (activeSession) redirect('/dashboard');

  return (
    <main className="w-full">
      <SignupForm />
    </main>
  );
}
