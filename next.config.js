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

// Internal pages moved under /app. Old paths keep working (shared links,
// bookmarks, and the notification links database triggers still write).
const INTERNAL_SEGMENTS = [
  'activity', 'admin', 'agency', 'articles', 'builds', 'case-studies', 'coach',
  'courses', 'dashboard', 'directory', 'discover', 'discussions', 'events', 'feed',
  'jobs', 'onboarding', 'pesan', 'profile', 'projects', 'services', 'spotlight',
  'talents', 'team-builder', 'team-collabs',
];

const nextConfig = {
  async redirects() {
    return [
      // The bare prefix opens the dashboard.
      { source: '/app', destination: '/app/dashboard', permanent: false },
      ...INTERNAL_SEGMENTS.flatMap((segment) => [
        { source: `/${segment}`, destination: `/app/${segment}`, permanent: true },
        { source: `/${segment}/:path*`, destination: `/app/${segment}/:path*`, permanent: true },
      ]),
    ];
  },
  // A cached service worker keeps an old one running for up to a day.
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
    ];
  },
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
