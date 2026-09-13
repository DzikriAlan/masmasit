'use client';

import { usePathname } from 'next/navigation';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { cn } from '@/shared/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  // Navbar is a fixed overlay (so the homepage hero can sit under it,
  // transparent-to-black). Every other page has to reclaim that space
  // itself since it no longer pushes content down in normal flow.
  const isHome = usePathname() === '/';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className={cn('flex-1', !isHome && 'pt-16')}>{children}</main>
      <Footer />
    </div>
  );
}
