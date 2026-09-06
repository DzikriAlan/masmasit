import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  // Silent fallback made prod failures look like "OAuth goes to localhost:54321".
  console.error(
    '[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set — ' +
      'using placeholders. Set them in .env (local) and the Vercel project env vars (prod).'
  );
}

// Browser client stores the session in cookies (not localStorage) so the
// SSR middleware (createServerClient) can read it on protected routes.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-key',
  { auth: { autoRefreshToken: false, persistSession: false } }
);
