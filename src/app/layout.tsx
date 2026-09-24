import '@/shared/styles/globals.css';
// Self-hosted via npm instead of next/font/google — the latter fetches font
// files from fonts.gstatic.com at compile time, which hangs indefinitely on
// networks that block that host (seen in dev: endless "Retrying 1/3...").
// Two faces, both variable:
// - Golos Text (text/UI): drawn for interfaces — large x-height, compact
//   width, tabular figures — so dense cards and navigation stay legible at
//   13–15px.
// - Familjen Grotesk (headings): a compact Swedish grotesk with real
//   character in the bowls and terminals; carries the hero and section
//   titles at 600–700 without needing extra weight or tracking.
import '@fontsource-variable/golos-text';
import '@fontsource-variable/familjen-grotesk';
// Wordmark face only — Plus Jakarta Sans, by Indonesian foundry Tokotype.
import '@fontsource/plus-jakarta-sans/800.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth-provider';
import { LanguageProvider } from '@/components/language-provider';
import { QueryProvider } from '@/components/query-provider';
import { Toaster } from '@/components/ui/sonner';
import OnboardingPopup from '@/features/onboarding/components/OnboardingPopup';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'MasmasIT — Hire Experts & Build Digital Solutions',
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
    title: 'MasmasIT',
    description: 'Hybrid IT Community, Talent & Agency Ecosystem for Indonesian IT practitioners.',
    images: [{ url: '/icon-512.webp', width: 512, height: 512, type: 'image/webp' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <QueryProvider>
          <LanguageProvider>
            <AuthProvider>
              {children}
              <OnboardingPopup />
              <Toaster />
            </AuthProvider>
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
