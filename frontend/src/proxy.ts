import { getSessionCookie } from 'better-auth/cookies';
import { NextResponse, type NextRequest } from 'next/server';

const COOKIE_PREFIX = 'saas-platform';
const protectedRoutes = ['/dashboard'];
const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];

function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function clearSessionCookies(response: NextResponse): void {
  // Better Auth uses `${prefix}.${cookieName}`. The underscore forms are
  // retained only to invalidate cookies produced by the previous client.
  const names = [
    `${COOKIE_PREFIX}.session_token`,
    `__Secure-${COOKIE_PREFIX}.session_token`,
    `${COOKIE_PREFIX}_session_token`,
    `__Secure-${COOKIE_PREFIX}_session_token`,
    'better-auth.session_token',
    '__Secure-better-auth.session_token',
  ];

  for (const name of names) {
    response.cookies.set(name, '', {
      expires: new Date(0),
      maxAge: 0,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some((route) => matchesRoute(pathname, route));
  const isAuthRoute = authRoutes.some((route) => matchesRoute(pathname, route));

  // This is an optimistic routing hint only. It does not validate the token.
  // Every protected page, server action, and API route must validate the
  // Better Auth session and authorize the requested resource independently.
  const sessionCookie = getSessionCookie(request, { cookiePrefix: COOKIE_PREFIX });

  if (isProtectedRoute && !sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    const returnTo = `${pathname}${search}`;
    if (returnTo.length <= 2048) loginUrl.searchParams.set('redirect', returnTo);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute) {
    const sessionExpired = request.nextUrl.searchParams.get('error') === 'session_expired';

    if (sessionExpired && sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      clearSessionCookies(response);
      return response;
    }

    if (sessionCookie && !sessionExpired) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login/:path*',
    '/signup/:path*',
    '/forgot-password/:path*',
    '/reset-password/:path*',
    '/verify-email/:path*',
  ],
};
