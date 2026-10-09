import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// OAuth (Google) redirects back here with ?code=. Exchange it for a session,
// write the auth cookies, then send the user to `next` (default: landing page).
// When the sign-in started from /login?redirect=..., auth-provider leaves that
// path in the `auth_next` cookie; it wins over the default landing page.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const getSafePath = (value: string | null | undefined) =>
    value && value.startsWith('/') && !value.startsWith('//') ? value : null;
  const cookieNext = getSafePath(decodeURIComponent(req.cookies.get('auth_next')?.value ?? ''));
  const queryNext = getSafePath(searchParams.get('next'));
  const next = (queryNext && queryNext !== '/' ? queryNext : cookieNext) ?? '/';

  if (code) {
    const res = NextResponse.redirect(`${origin}${next}`);
    res.cookies.set('auth_next', '', { path: '/', maxAge: 0 });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll().map(({ name, value }) => ({ name, value })),
          setAll: (cookies) =>
            cookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return res;
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
