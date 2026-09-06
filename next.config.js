/** @type {import('next').NextConfig} */

// Bridge alternate env var names (as set in Vercel) to the NEXT_PUBLIC_* names
// the app reads. NEXT_PUBLIC_* must be inlined at build time to reach the
// browser bundle; a plain SUPABASE_PROJECT_URL never would.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
  },
};

module.exports = nextConfig;
