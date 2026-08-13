import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              W
            </div>
            <span className="text-xl font-bold text-foreground">Weybre Legal AI</span>
          </div>
          <div className="flex gap-2">
            <Link href="/login" passHref>
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl mb-6">
            Secure Authentication Foundation
          </h1>
          <p className="text-lg text-muted-foreground mb-10">
            A minimal, production-ready implementation featuring secure session management, email verification, and protected routing. Start building your next idea on a solid foundation.
          </p>
          <div className="flex justify-center">
            <Link href="/signup" passHref>
              <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Weybre Legal AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
