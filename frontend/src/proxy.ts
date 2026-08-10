import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard'];
const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  
  const sessionCookie = request.cookies.get('better-auth.session_token') || request.cookies.get('__Secure-better-auth.session_token');

  let isValid = false;
  if (sessionCookie) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/auth';
      const response = await fetch(`${apiUrl}/get-session`, {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.session) {
          isValid = true;
        }
      }
    } catch (e) {
      console.error('Error validating session in middleware:', e);
      // Fallback: if backend is unreachable, we treat session as invalid
    }
  }

  if (isProtectedRoute && !isValid) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('better-auth.session_token');
    response.cookies.delete('__Secure-better-auth.session_token');
    return response;
  }

  if (isAuthRoute && isValid) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isAuthRoute && !isValid && sessionCookie) {
    const response = NextResponse.next();
    response.cookies.delete('better-auth.session_token');
    response.cookies.delete('__Secure-better-auth.session_token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
