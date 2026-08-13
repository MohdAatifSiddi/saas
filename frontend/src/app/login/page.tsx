import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { LoginForm } from "@/components/login-form"
import { Session, User } from 'better-auth';
import { Suspense } from 'react';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const hasSessionCookie = 
    cookieStore.has('weybre-legal-ai_session_token') || 
    cookieStore.has('__Secure-weybre-legal-ai_session_token') ||
    cookieStore.has('better-auth.session_token') || 
    cookieStore.has('__Secure-better-auth.session_token');

  let session: { session: Session; user: User } | null = null;

  if (hasSessionCookie) {
    // Only check session on the server side if a session cookie actually exists
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      const { data } = await authClient.getSession({
        fetchOptions: {
          headers: await headers(),
          signal: controller.signal,
        }
      });
      session = data;
    } catch (e) {
      console.warn('Session check on login page timed out or failed:', e);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="w-full">
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
