import '@/shared/styles/globals.css';
import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { LanguageProvider } from '@/components/language-provider';
import { Toaster } from '@/components/ui/sonner';

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'masmasit.online — Hire Experts & Build Digital Solutions',
  description:
    'Hybrid IT Community, Talent & Agency Ecosystem for Indonesian IT practitioners. Hire talent, build digital solutions, join the community.',
  openGraph: {
    title: 'masmasit.online',
    description: 'Hybrid IT Community, Talent & Agency Ecosystem for Indonesian IT practitioners.',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} ${spaceGrotesk.variable} antialiased`}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
