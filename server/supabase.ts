import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Request-scoped client that carries the caller's session cookies, so every
 * query still runs under that user's RLS policies. This is the client route
 * handlers should use — never the service-role one below.
 */
export const getServerSupabase = () => {
  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Route handlers rendered in a read-only cookie scope cannot refresh
          // the session here; middleware already handles rotation.
        }
      },
    },
  });
};

/**
 * Service-role client. Bypasses RLS, so it is only for operations that must
 * act outside the caller's permissions (granting admin roles, writing audit
 * rows). Throws rather than silently falling back to the anon key.
 */
export const getServiceSupabase = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set — this operation requires the service role key.'
    );
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};
