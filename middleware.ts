import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === 'production',
    });

    const { pathname } = req.nextUrl;
    const isAuthenticated = !!token;
    const userRole = token?.role as string | undefined;
    const onboarded = token?.onboarded as boolean | undefined;

    const guestRoutes = ['/login', '/register'];
    const protectedRoutes = ['/dashboard'];
    const adminRoutes = ['/admin'];
    const onboardingRoute = '/onboarding';
    console.log(token)

    // 1️⃣ Redirect authenticated users away from guest routes
    if (isAuthenticated && guestRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // 2️⃣ Redirect unauthenticated users away from protected/admin/onboarding routes
    if (!isAuthenticated && (
        protectedRoutes.some(route => pathname.startsWith(route)) ||
        adminRoutes.some(route => pathname.startsWith('/admin')) ||
        pathname.startsWith(onboardingRoute)
    )) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // 3️⃣ Redirect non-admin users away from admin pages
    if (isAuthenticated && adminRoutes.some(route => pathname.startsWith('/admin')) && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // 4️⃣ Redirect users to onboarding if not onboarded
    if (isAuthenticated && !onboarded && pathname !== onboardingRoute) {
        return NextResponse.redirect(new URL(onboardingRoute, req.url));
    }

    // 5️⃣ Redirect onboarded users away from onboarding page
    if (isAuthenticated && onboarded && pathname === onboardingRoute) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/login',
        '/register',
        '/dashboard/:path*',
        '/admin/:path*',
        '/onboarding/:path*', // include onboarding so we can control access
    ],
};
