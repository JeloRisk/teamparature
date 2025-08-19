// middleware.ts
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === 'production',
    });
    console.log('Token in middleware:', token);
    const { pathname } = req.nextUrl;

    const isAuthenticated = !!token;
    const userRole = token?.role as string | undefined;

    const guestRoutes = ['/login', '/register'];
    const protectedRoutes = ['/dashboard'];
    const adminRoutes = ['/admin'];

    // If logged in user tries to access guest pages, redirect to dashboard
    if (isAuthenticated && guestRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // If unauthenticated user tries to access protected or admin routes, redirect to login
    if (!isAuthenticated && (protectedRoutes.some(route => pathname.startsWith(route)) || adminRoutes.some(route => pathname.startsWith(route)))) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // If authenticated non-admin tries to access admin routes, redirect to dashboard
    if (isAuthenticated && adminRoutes.some(route => pathname.startsWith(route)) && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
}


// This config applies the middleware to all the routes you want to manage.
export const config = {
    matcher: [
        '/login',
        '/register',
        '/dashboard/:path*',
        '/admin/:path*',
    ],
};