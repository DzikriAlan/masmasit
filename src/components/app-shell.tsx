'use client';

import { usePathname } from 'next/navigation';

import { useAuth } from '@/components/auth-provider';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { DashboardShell } from '@/components/dashboard-shell';
import { cn } from '@/shared/lib/utils';

const PUBLIC_PATHS = [
  '/',
  '/about',
  '/contact',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/privacy-policy',
  '/terms-of-service',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isHome = pathname === '/';

  if (!loading && user && !isPublicPath(pathname)) {
    return <DashboardShell>{children}</DashboardShell>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className={cn('flex-1', !isHome && 'pt-16')}>{children}</main>
      <Footer />
    </div>
  );
}
