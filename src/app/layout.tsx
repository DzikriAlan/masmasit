import '@/shared/styles/globals.css';
// Self-hosted via npm instead of next/font/google — the latter fetches font
// files from fonts.gstatic.com at compile time, which hangs indefinitely on
// networks that block that host (seen in dev: endless "Retrying 1/3...").
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { LanguageProvider } from '@/components/language-provider';
import { QueryProvider } from '@/components/query-provider';
import { Toaster } from '@/components/ui/sonner';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'masmasit — Hire Experts & Build Digital Solutions',
  description:
    'Hybrid IT Community, Talent & Agency Ecosystem for Indonesian IT practitioners. Hire talent, build digital solutions, join the community.',
  icons: {
    icon: [
      { url: '/icon-32.webp', sizes: '32x32', type: 'image/webp' },
      { url: '/icon-192.webp', sizes: '192x192', type: 'image/webp' },
      { url: '/icon-512.webp', sizes: '512x512', type: 'image/webp' },
    ],
    apple: [{ url: '/icon-180.webp', sizes: '180x180', type: 'image/webp' }],
    shortcut: ['/icon-32.webp'],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'masmasit',
    description: 'Hybrid IT Community, Talent & Agency Ecosystem for Indonesian IT practitioners.',
    images: [{ url: '/icon-512.webp', width: 512, height: 512, type: 'image/webp' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased">
        <QueryProvider>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                {children}
                <Toaster />
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
