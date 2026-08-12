'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

export default function LogoutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, startTransition] = useTransition();

  const isBusy = isSigningOut || isRefreshing;

  async function handleLogout() {
    if (isBusy) return;
    setErrorMessage(null);
    setIsSigningOut(true);

    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error('Unable to sign out.');

      startTransition(() => {
        router.replace('/login');
        router.refresh();
      });
    } catch {
      // Keep the message generic; do not expose provider or cookie details.
      setErrorMessage('Sign out failed. Please try again.');
      setIsSigningOut(false);
    }
  }

  return (
    <>
      {errorMessage ? (
        <p role="alert" className="mb-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
      <Button
      type="button"
      onClick={handleLogout}
      variant="destructive"
      className="w-full"
      disabled={isBusy}
      aria-busy={isBusy}
    >
        {isBusy ? 'Signing out…' : 'Log out'}
      </Button>
    </>
  );
}
