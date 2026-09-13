'use client';

import { usePathname } from 'next/navigation';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { cn } from '@/shared/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  // The navbar is fixed and transparent at the top of the page. The homepage
  // hero runs underneath it; every other page starts below the bar.
  const isHome = usePathname() === '/';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className={cn('flex-1', !isHome && 'pt-16')}>{children}</main>
      <Footer />
    </div>
  );
}
