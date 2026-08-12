'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForgotPassword } from '@/hooks/auth/useForgotPassword';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Field,
  FieldLabel,
} from '@/components/ui/field';
import { GalleryVerticalEndIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { trigger, isMutating } = useForgotPassword();
  
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setSubmitError('');

    // Form validation using Zod
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setValidationError(result.error.issues[0].message);
      return;
    }

    try {
      // Better Auth redirects to the frontend's reset-password route after link click
      const redirectTo = `${window.location.origin}/reset-password`;
      await trigger({ email, redirectTo });
      
      // Generic success page is displayed unconditionally to prevent account enumeration
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Password reset request failed:', error);
      // We still transition to success state to satisfy the generic security requirements,
      // EXCEPT for rate-limiting errors which are helpful to surface.
      if (error.message && error.message.includes('Too many reset requests')) {
        setSubmitError(error.message);
      } else {
        // Fallback to generic success state to protect user identity/existence
        setSuccess(true);
      }
    }
  };

  if (success) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Check your email</CardTitle>
                <CardDescription>
                  If an account exists for {email}, we&apos;ve sent instructions to reset your password.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-center text-sm text-muted-foreground">
                <p>The secure reset link will expire shortly for security reasons.</p>
                <p>Didn&apos;t receive the email? Check your spam folder or try again.</p>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button variant="outline" className="w-full" onClick={() => setSuccess(false)}>
                  Try again
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => router.push('/login')}>
                  Back to sign in
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader className="text-center">
                <div className="flex flex-col items-center gap-2 font-medium">
                  <div className="flex size-8 items-center justify-center rounded-md bg-indigo-600 text-white">
                    <GalleryVerticalEndIcon className="size-6" />
                  </div>
                </div>
                <CardTitle className="text-xl mt-2">Forgot Password</CardTitle>
                <CardDescription>
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {submitError && (
                  <Alert variant="destructive">
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (validationError) setValidationError('');
                    }}
                    placeholder="m@example.com"
                    disabled={isMutating}
                  />
                  {validationError && (
                    <p className="text-xs text-destructive mt-1">{validationError}</p>
                  )}
                </Field>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={isMutating}>
                  {isMutating ? 'Sending...' : 'Send reset link'}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => router.push('/login')} disabled={isMutating}>
                  Back to sign in
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
