import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const protectedPaths = ['/dashboard', '/admin', '/coach', '/pesan', '/profile', '/onboarding', '/activity', '/jobs/applicants'];

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Supabase drops the user on the Site URL (e.g. /?code=...) when the app's
  // redirect_to isn't in the allowlist. Forward the code to the exchange route
  // so login still completes wherever it lands.
  const code = searchParams.get('code');
  if (code && pathname !== '/auth/callback') {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/callback';
    url.search = `?code=${code}&next=${encodeURIComponent(pathname === '/' ? '/' : pathname)}`;
    return NextResponse.redirect(url);
  }

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
  // Run on everything except Next internals and static files, so the ?code=
  // catch above works on any landing path (not just the protected ones).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
