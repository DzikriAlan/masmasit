import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const protectedPaths = ['/app/dashboard', '/app/admin', '/app/coach', '/app/pesan', '/app/profile', '/app/onboarding', '/app/activity', '/app/jobs/applicants'];
const signedOutOnlyPaths = ['/login', '/register'];

// Same-origin paths only; a backslash is rejected because browsers read `/\x` as `//x`.
const getSignedInLanding = (target: string | null) =>
  target && target.startsWith('/') && !target.startsWith('//') && !target.includes('\\') && !signedOutOnlyPaths.includes(target.split(/[?#]/)[0])
    ? target
    : '/app/dashboard';

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Supabase drops the user on the Site URL (e.g. /?code=...) when the app's
  // redirect_to isn't in the allowlist. Forward the code to the exchange route
  // so login still completes wherever it lands. A failed sign-in lands the same
  // way with ?error_description= instead; forward it so /login can report it.
  const code = searchParams.get('code');
  // /login is where the callback reports the error, so never forward from it.
  const authError = pathname === '/login' ? null : searchParams.get('error_description');
  if ((code || authError) && pathname !== '/auth/callback') {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/callback';
    url.search = '';
    if (code) url.searchParams.set('code', code);
    if (authError) {
      url.searchParams.set('error', searchParams.get('error') ?? 'oauth');
      url.searchParams.set('error_description', authError);
    }
    const flowId = searchParams.get('sb_flow_id');
    if (flowId) url.searchParams.set('sb_flow_id', flowId);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isSignedOutOnly = signedOutOnlyPaths.includes(pathname);
  if (!isProtected && !isSignedOutOnly) return NextResponse.next();

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

  if (isSignedOutOnly) {
    if (!session) return res;
    const landing = NextResponse.redirect(new URL(getSignedInLanding(searchParams.get('redirect')), req.url));
    res.cookies.getAll().forEach((cookie) => landing.cookies.set(cookie));
    return landing;
  }

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
