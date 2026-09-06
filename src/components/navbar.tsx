'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Moon, Sun, Code2, Globe, MessageCircle, LayoutDashboard, LogIn, LogOut, UserPlus, User, ChevronDown } from 'lucide-react';
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
import { NotificationBell } from '@/components/notification-bell';
import { GlobalSearch } from '@/components/global-search';
import { cn } from '@/shared/lib/utils';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
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
  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled || !isHome
          ? 'border-b border-border/40 glass'
          : 'border-b border-transparent bg-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-[1.02]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary transition-shadow hover:shadow-lg hover:shadow-primary/30">
            <Code2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            masmasit<span className="text-primary">.online</span>
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
                  <Link href="/pesan"><MessageCircle className="mr-2 h-4 w-4" /> {t('Messages', 'Pesan')}</Link>
                </DropdownMenuItem>
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
        <div className="border-t border-border/40 bg-card/95 backdrop-blur-xl lg:hidden animate-fade-up">
          <nav className="mx-auto flex max-w-7xl flex-col gap-0.5 px-4 py-4">
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
    </header>
  );
}
