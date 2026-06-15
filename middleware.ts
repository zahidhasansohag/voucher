// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value;
  const isAuth = verifySessionToken(token);

  if (req.nextUrl.pathname.startsWith('/admin') && !isAuth) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (req.nextUrl.pathname.startsWith('/login') && isAuth) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
