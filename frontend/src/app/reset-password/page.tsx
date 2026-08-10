'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useResetPassword } from '@/hooks/auth/useResetPassword';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Field,
  FieldLabel,
} from '@/components/ui/field';
import { GalleryVerticalEndIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const { trigger, isMutating } = useResetPassword();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invalidTokenState, setInvalidTokenState] = useState(false);
  const invalidToken = !token || invalidTokenState;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setSubmitError('');

    if (!token) {
      return;
    }

    // Validation using Zod
    const result = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const errors: { [key: string]: string } = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    try {
      await trigger({ newPassword: password, token });
      setSuccess(true);
      
      // Auto-redirect to login after 3 seconds on success
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message === 'INVALID_OR_EXPIRED_TOKEN') {
        setInvalidTokenState(true);
      } else {
        setSubmitError(error.message || 'Failed to reset password. Please try again.');
      }
    }
  };

  if (invalidToken) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="flex flex-col items-center gap-2 font-medium">
            <div className="flex size-8 items-center justify-center rounded-md bg-indigo-600 text-white">
              <GalleryVerticalEndIcon className="size-6" />
            </div>
          </div>
          <CardTitle className="text-xl mt-2">Reset link unavailable</CardTitle>
          <CardDescription>
            This password reset link is invalid, has expired, or has already been used.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          Please request a new password reset link to update your account password.
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full" onClick={() => router.push('/forgot-password')}>
            Request new link
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => router.push('/login')}>
            Back to sign in
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="flex flex-col items-center gap-2 font-medium">
            <div className="flex size-8 items-center justify-center rounded-md bg-indigo-600 text-white">
              <GalleryVerticalEndIcon className="size-6" />
            </div>
          </div>
          <CardTitle className="text-xl mt-2">Password reset successfully</CardTitle>
          <CardDescription>
            Your password has been successfully updated.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          Redirecting you to the login page shortly...
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => router.push('/login')}>
            Sign in now
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader className="text-center">
          <div className="flex flex-col items-center gap-2 font-medium">
            <div className="flex size-8 items-center justify-center rounded-md bg-indigo-600 text-white">
              <GalleryVerticalEndIcon className="size-6" />
            </div>
          </div>
          <CardTitle className="text-xl mt-2">Reset Password</CardTitle>
          <CardDescription>
            Create a new, highly-secure password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <Field>
            <FieldLabel htmlFor="password">New Password</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (validationErrors.password) {
                  setValidationErrors((prev) => ({ ...prev, password: '' }));
                }
              }}
              placeholder="••••••••"
              disabled={isMutating}
            />
            {validationErrors.password && (
              <p className="text-xs text-destructive mt-1">{validationErrors.password}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (validationErrors.confirmPassword) {
                  setValidationErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }
              }}
              placeholder="••••••••"
              disabled={isMutating}
            />
            {validationErrors.confirmPassword && (
              <p className="text-xs text-destructive mt-1">{validationErrors.confirmPassword}</p>
            )}
          </Field>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isMutating}>
            {isMutating ? 'Resetting password...' : 'Reset password'}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => router.push('/login')} disabled={isMutating}>
            Back to sign in
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Loading</CardTitle>
              <CardDescription>Validating recovery details...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-indigo-600"></div>
            </CardContent>
          </Card>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
