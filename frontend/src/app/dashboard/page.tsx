import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { GalleryVerticalEndIcon } from "lucide-react";
import LogoutButton from './logout-button';

export default async function DashboardPage() {
  const reqHeaders = await headers();
  // Validate session against the backend
  const { data: session, error } = await authClient.getSession({
    fetchOptions: {
      headers: reqHeaders,
    }
  });

  if (error || !session) {
    redirect('/login');
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
          <CardContent className="space-y-3 text-sm flex flex-col items-center py-6">
             <p className="text-lg">Hello, {session.user.name || session.user.email}</p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <LogoutButton />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
