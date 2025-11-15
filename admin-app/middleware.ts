import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isProtected = pathname.startsWith('/users') || pathname.startsWith('/stores') || pathname.startsWith('/products') || pathname.startsWith('/orders') || pathname.startsWith('/dashboard');
  const isAuth = pathname.startsWith('/login');

  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (isAuth && token) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
