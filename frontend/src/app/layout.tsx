import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

const siteUrlValue = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const siteUrl = new URL(siteUrlValue);
const isLocalhost = siteUrl.hostname === 'localhost' || siteUrl.hostname === '127.0.0.1' || siteUrl.hostname === '[::1]';
if (process.env.NODE_ENV === 'production' && siteUrl.protocol !== 'https:' && !isLocalhost) {
  throw new Error('NEXT_PUBLIC_SITE_URL must use HTTPS in production.');
}

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: 'Weybre Legal AI',
    template: '%s | Weybre Legal AI',
  },
  description: 'Secure account access for Weybre Legal AI.',
  applicationName: 'Weybre Legal AI',
  referrer: 'strict-origin-when-cross-origin',
  icons: {
    icon: '/favicon.ico',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#171717' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn('h-full antialiased', geistSans.variable, geistMono.variable)}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
