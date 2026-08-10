'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GalleryVerticalEndIcon } from "lucide-react";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const emailQuery = searchParams.get('email') || '';

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResend = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    if (!emailQuery) {
      setError('No email address provided. Please return to login.');
      setLoading(false);
      return;
    }

    const { error: resendError } = await authClient.sendVerificationEmail({
      email: emailQuery,
      callbackURL: `${window.location.origin}/dashboard`,
    });

    if (resendError) {
      setError(resendError.message || 'Failed to resend verification email.');
    } else {
      setMessage('Verification email sent! Check your inbox.');
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex flex-col items-center gap-2 font-medium">
          <div className="flex size-8 items-center justify-center rounded-md bg-indigo-600 text-white">
            <GalleryVerticalEndIcon className="size-6" />
          </div>
        </div>
        <CardTitle className="text-xl mt-2">Verify Email</CardTitle>
        <CardDescription>We&apos;ve sent a verification link to your email.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
        )}
        {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <p className="text-sm text-center text-muted-foreground">
          Please check your inbox ({emailQuery}) and click the link to verify your account. If you didn&apos;t receive it, you can resend it.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button onClick={handleResend} disabled={loading || !emailQuery} className="w-full">
          {loading ? 'Sending...' : 'Resend Verification Email'}
        </Button>
        <Button variant="ghost" onClick={() => router.push('/login')} className="w-full">
          Back to Login
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <Suspense fallback={
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-indigo-600"></div>
            </CardContent>
          </Card>
        </div>
      }>
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}
