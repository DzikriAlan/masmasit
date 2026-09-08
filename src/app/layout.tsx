import '@/shared/styles/globals.css';
import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { LanguageProvider } from '@/components/language-provider';
import { QueryProvider } from '@/components/query-provider';
import { Toaster } from '@/components/ui/sonner';

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });

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
      <body className={`${inter.className} ${spaceGrotesk.variable} antialiased`}>
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
