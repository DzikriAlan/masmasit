import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// OAuth (Google) redirects back here with ?code=. Exchange it for a session,
// write the auth cookies, then send the user to `next` (default: landing page).
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const res = NextResponse.redirect(`${origin}${next}`);
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
