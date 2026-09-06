import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const protectedPaths = ['/dashboard', '/admin', '/coach', '/pesan', '/profile', '/onboarding'];

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (!isProtected) return NextResponse.next();

  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll().map(({ name, value }) => ({ name, value })),
        setAll: (cookies) => cookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    }
  );
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/coach/:path*', '/pesan/:path*', '/profile/:path*', '/onboarding/:path*'],
};
