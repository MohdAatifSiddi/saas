import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { LoginForm } from "@/components/login-form"
import { Session, User } from 'better-auth';
import { Suspense } from 'react';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const hasSessionCookie = 
    cookieStore.has('saas-platform_session_token') || 
    cookieStore.has('__Secure-saas-platform_session_token') ||
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
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
