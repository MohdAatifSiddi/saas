import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard'];
const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  
  const allCookies = request.cookies.getAll().map(c => `${c.name}=${c.value.substring(0, 10)}...`);
  console.log('Middleware Path:', pathname, 'All Cookies:', allCookies);

  const sessionCookie = 
    request.cookies.get('saas-platform_session_token') || 
    request.cookies.get('__Secure-saas-platform_session_token') ||
    request.cookies.get('better-auth.session_token') || 
    request.cookies.get('__Secure-better-auth.session_token');

  console.log('Detected Session Cookie:', sessionCookie?.name);

  let isValid = false;
  if (sessionCookie) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/auth';
      const response = await fetch(`${apiUrl}/get-session`, {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      });
      console.log('Get Session Status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Get Session Data:', data ? 'Has session data' : 'No session data');
        if (data && data.session) {
          isValid = true;
        }
      }
    } catch (e) {
      console.error('Error validating session in middleware:', e);
    }
  }

  console.log('Is Protected:', isProtectedRoute, 'Is Auth Route:', isAuthRoute, 'Is Valid:', isValid);

  if (isProtectedRoute && !isValid) {
    console.log('Redirecting to /login from protected route');
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('saas-platform_session_token');
    response.cookies.delete('__Secure-saas-platform_session_token');
    response.cookies.delete('better-auth.session_token');
    response.cookies.delete('__Secure-better-auth.session_token');
    return response;
  }

  if (isAuthRoute && isValid) {
    console.log('Redirecting to /dashboard from auth route');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isAuthRoute && !isValid && sessionCookie) {
    console.log('Deleting invalid session cookies on auth route');
    const response = NextResponse.next();
    response.cookies.delete('saas-platform_session_token');
    response.cookies.delete('__Secure-saas-platform_session_token');
    response.cookies.delete('better-auth.session_token');
    response.cookies.delete('__Secure-better-auth.session_token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
