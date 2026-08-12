import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { GalleryVerticalEndIcon } from "lucide-react";
import LogoutButton from './logout-button';
import { Session, User } from 'better-auth';
import { apiRoot } from '@/lib/env';

export default async function DashboardPage() {
  const reqHeaders = await headers();
  
  // Validate session against the backend with an explicit timeout (fail closed)
  const sessionController = new AbortController();
  const sessionTimeoutId = setTimeout(() => sessionController.abort(), 3000);

  let sessionResult: { session: Session; user: User } | null = null;
  try {
    const { data, error } = await authClient.getSession({
      fetchOptions: {
        headers: reqHeaders,
        signal: sessionController.signal,
      }
    });
    if (!error && data) {
      sessionResult = data;
    }
  } catch (e) {
    console.error('Session validation timed out or failed:', e);
  } finally {
    clearTimeout(sessionTimeoutId);
  }

  if (!sessionResult) {
    redirect('/login?error=session_expired');
  }

  // Perform server-side call to the protected backend /dashboard API endpoint
  const backendBaseUrl = apiRoot;
  
  let dashboardData: { message: string; user: unknown } | null = null;
  let fetchError = '';

  const dashboardController = new AbortController();
  const dashboardTimeoutId = setTimeout(() => dashboardController.abort(), 3000);

  try {0
    const res = await fetch(`${backendBaseUrl}/dashboard`, {
      headers: {
        cookie: reqHeaders.get('cookie') || '',
      },
      cache: 'no-store', // Always get fresh data
      signal: dashboardController.signal,
    });

    if (res.ok) {
      dashboardData = await res.json();
    } else if (res.status === 401 || res.status === 403) {
      redirect('/login?error=session_expired');
    } else {
      fetchError = 'Unable to fetch secure workspace information.';
    }
  } catch (e) {
    console.error('Error fetching dashboard data from backend:', e);
    fetchError = 'Secure backend data service is currently unreachable.';
  } finally {
    clearTimeout(dashboardTimeoutId);
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-8 items-center justify-center rounded-md bg-indigo-600 text-white">
            <GalleryVerticalEndIcon className="size-6" />
          </div>
          <h1 className="text-xl font-bold">Dashboard</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Your secure workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center py-6">
             {fetchError ? (
               <p className="text-sm text-destructive">{fetchError}</p>
             ) : (
               <>
                 <p className="text-lg font-semibold text-indigo-600">
                   {dashboardData?.message || `Welcome back, ${sessionResult.user.name || sessionResult.user.email}!`}
                 </p>
                 <p className="text-xs text-muted-foreground">
                   Authenticated Securely as: <span className="font-mono">{sessionResult.user.email}</span>
                 </p>
               </>
             )}
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <LogoutButton />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
