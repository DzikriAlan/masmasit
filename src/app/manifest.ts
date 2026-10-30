import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MasmasIT',
    short_name: 'MasmasIT',
    description: 'IT Community, Talent & Agency Ecosystem for Indonesian practitioners.',
    id: '/',
    start_url: '/app/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    // --primary in globals.css: hsl(345 75% 28%).
    theme_color: '#7d122d',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    // Long-press on the home-screen icon. Android only: iOS ignores shortcuts.
    shortcuts: [
      { name: 'Dashboard', url: '/app/dashboard' },
      { name: 'Pesan', url: '/app/pesan' },
      { name: 'Jobs', url: '/app/jobs' },
    ],
  };
}
