'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Moon, Sun, Globe, MessageCircle, LayoutDashboard, LogIn, LogOut, UserPlus, User, ChevronDown, ShieldCheck, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { GlobalSearch } from '@/features/search/components/GlobalSearch';
import { cn } from '@/shared/lib/utils';

export function Navbar() {
  const [open, setOpen] = useState(false);
  // Hidden while scrolling down, shown again while scrolling up — mirrors the
  // reference layout's floating bar that tucks away to give content room.
  const [hidden, setHidden] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, profile, roles, signOut } = useAuth();

  const isAdmin = roles.includes('super_admin') || roles.includes('regional_admin');
  const { lang, toggleLang, t } = useLang();
  const router = useRouter();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || '';
  const initial = (profile?.full_name || user?.email || '?').charAt(0).toUpperCase();

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    router.push('/');
    router.refresh();
  };
  const pathname = usePathname();

  // Mobile menu opening should always reveal the bar it hangs off of.
  useEffect(() => {
    if (open) setHidden(false);
  }, [open]);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const delta = y - lastY;

      if (!open) {
        // Stay visible near the top so the bar doesn't vanish right after load,
        // and ignore sub-pixel jitter so it doesn't flicker on tiny deltas.
        if (y < 96) setHidden(false);
        else if (delta > 4) setHidden(true);
        else if (delta < -4) setHidden(false);
      }

      lastY = y;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [open]);

  const navLinks = [
    { href: '/directory', label: t('Members', 'Member') },
    { href: '/jobs', label: t('Jobs', 'Lowongan') },
    { href: '/projects', label: t('Projects', 'Proyek') },
    { href: '/courses', label: t('LMS', 'Kursus') },
    { href: '/events', label: t('Events', 'Event') },
    { href: '/talents', label: t('Talents', 'Talent') },
    { href: '/services', label: t('Services', 'Layanan') },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full px-3 pt-3 transition-transform duration-300 ease-in-out will-change-transform sm:px-4 sm:pt-4',
        hidden ? '-translate-y-[200%]' : 'translate-y-0'
      )}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex h-16 items-center justify-between rounded-2xl border border-border bg-card px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-[1.02]">
            <img
              src="/icon-192.webp"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-[24%]"
            />
            <span className="font-display text-lg font-bold tracking-tight">
              masmasit
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-muted/50 hover:text-foreground',
                  pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="absolute -bottom-px left-3 right-3 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-1.5 lg:flex">
            <GlobalSearch />
            {user && (
              <Link href="/pesan">
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  {t('Messages', 'Pesan')}
                </Button>
              </Link>
            )}
            {user && <NotificationBell />}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Toggle language"
            >
              <Globe className="h-4 w-4" />
              <span className="uppercase text-xs">{lang}</span>
            </button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-border/50 py-1 pl-1 pr-2 text-sm font-medium transition-colors hover:bg-muted">
                    <Avatar className="h-7 w-7">
                      {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
                      <AvatarFallback className="bg-primary/15 text-xs text-primary">{initial}</AvatarFallback>
                    </Avatar>
                    <span className="max-w-[120px] truncate">{displayName}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="truncate">{displayName}</span>
                    <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> {t('Dashboard', 'Dashboard')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile"><User className="mr-2 h-4 w-4" /> {t('Profile', 'Profil')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/activity"><Activity className="mr-2 h-4 w-4" /> {t('My Activity', 'Aktivitas Saya')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/pesan"><MessageCircle className="mr-2 h-4 w-4" /> {t('Messages', 'Pesan')}</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin"><ShieldCheck className="mr-2 h-4 w-4" /> {t('Admin Panel', 'Panel Admin')}</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> {t('Sign out', 'Keluar')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <LogIn className="h-3.5 w-3.5" />
                    {t('Sign in', 'Masuk')}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="gap-1.5 glow-primary">
                    <UserPlus className="h-3.5 w-3.5" />
                    {t('Get started', 'Daftar')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="mt-2 rounded-2xl border border-border bg-card lg:hidden animate-fade-up">
            <nav className="flex flex-col gap-0.5 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted',
                    pathname === link.href ? 'text-primary bg-primary/5' : 'text-muted-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <Link
                  href="/pesan"
                  onClick={() => setOpen(false)}
                  className={cn(
                    'rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted',
                    pathname === '/pesan' ? 'text-primary bg-primary/5' : 'text-muted-foreground'
                  )}
                >
                  {t('Messages', 'Pesan')}
                </Link>
              )}
              {user && (
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className={cn(
                    'rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted',
                    pathname === '/profile' ? 'text-primary bg-primary/5' : 'text-muted-foreground'
                  )}
                >
                  {t('Profile', 'Profil')}
                </Link>
              )}
              {user && (
                <div className="mt-2 flex items-center gap-3 rounded-md border border-border/40 px-3 py-2">
                  <Avatar className="h-8 w-8">
                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
                    <AvatarFallback className="bg-primary/15 text-xs text-primary">{initial}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5 text-destructive">
                    <LogOut className="h-4 w-4" /> {t('Sign out', 'Keluar')}
                  </Button>
                </div>
              )}
              <div className="mt-3 flex items-center gap-2 border-t border-border/40 pt-3">
                <GlobalSearch />
                {user && <NotificationBell />}
                <button
                  onClick={toggleLang}
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Globe className="h-4 w-4" />
                  <span className="uppercase text-xs">{lang}</span>
                </button>
                <Button variant="ghost" size="icon" onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                {user ? (
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="flex-1">
                    <Button size="sm" className="w-full gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      {t('Dashboard', 'Dashboard')}
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)} className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full">{t('Sign in', 'Masuk')}</Button>
                    </Link>
                    <Link href="/register" onClick={() => setOpen(false)} className="flex-1">
                      <Button size="sm" className="w-full">{t('Get started', 'Daftar')}</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
