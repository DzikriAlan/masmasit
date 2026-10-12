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

  // Supabase reports provider/database failures as ?error=&error_description=
  // instead of a code. Keep the reason so /login can show it.
  let reason = searchParams.get('error_description') || searchParams.get('error');

  if (code) {
    const flowId = searchParams.get('sb_flow_id');
    const { error } = await supabase.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
    if (!error) return res;
    reason = error.message;
  } else if (!reason) {
    reason = 'No authorization code returned';
  }

  // The same callback URL can be hit twice (redirect replays, a reopened tab).
  // The code is single-use, so the second exchange fails even though the first
  // already signed the user in. A valid session in the cookies means success.
  const { data } = await supabase.auth.getUser();
  if (data.user) return res;

  console.error('[auth/callback] sign-in failed:', reason);
  const login = new URL('/login', origin);
  login.searchParams.set('error', 'oauth');
  login.searchParams.set('error_description', reason.slice(0, 200));
  if (next !== '/') login.searchParams.set('redirect', next);
  const fail = NextResponse.redirect(login);
  fail.cookies.set('auth_next', '', { path: '/', maxAge: 0 });
  return fail;
}
