'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { StableLabel, StableText } from '@/components/stable-label';
import { cn } from '@/shared/lib/utils';

const ecosystemColumns = [
  {
    eyebrowEn: 'Career', eyebrowId: 'Karier',
    items: [
      { href: '/jobs', en: 'Jobs', id: 'Lowongan', descEn: 'Full-time & freelance roles', descId: 'Peran full-time & freelance' },
      { href: '/projects', en: 'Projects', id: 'Proyek', descEn: 'Real projects, real companies', descId: 'Proyek nyata, perusahaan nyata' },
    ],
  },
  {
    eyebrowEn: 'Grow', eyebrowId: 'Berkembang',
    items: [
      { href: '/talents', en: 'Talents', id: 'Talent', descEn: 'Vetted IT professionals', descId: 'Praktisi IT terverifikasi' },
      { href: '/courses', en: 'Learn', id: 'Belajar', descEn: 'Courses by practitioners', descId: 'Kursus dari para praktisi' },
    ],
  },
  {
    eyebrowEn: 'Connect', eyebrowId: 'Terhubung',
    items: [
      { href: '/events', en: 'Events', id: 'Event', descEn: 'Meetups & hackathons', descId: 'Meetup & hackathon' },
      { href: '/services', en: 'Services', id: 'Layanan', descEn: 'Professional IT services', descId: 'Layanan IT profesional' },
    ],
  },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Transparent while resting at the very top, solid white once scrolled.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [menuOpen]);

  // Mouse users open the menu by hovering, so their click on the trigger
  // must not toggle it straight back closed. Touch and keyboard still toggle.
  const lastPointer = useRef<string>('');
  const openMenu = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenuOpen(true);
  };
  const scheduleCloseMenu = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMenuOpen(false), 150);
  };
  const onTriggerClick = (e: React.MouseEvent) => {
    const viaMouse = e.detail > 0 && lastPointer.current === 'mouse';
    setMenuOpen((v) => (viaMouse ? true : !v));
  };

  const navLinks = [
    { href: '/directory', label: t('Members', 'Member') },
    { href: '/jobs', label: t('Jobs', 'Lowongan') },
    { href: '/projects', label: t('Projects', 'Proyek') },
    { href: '/courses', label: t('LMS', 'Kursus') },
    { href: '/events', label: t('Events', 'Event') },
    { href: '/talents', label: t('Talents', 'Talent') },
    { href: '/services', label: t('Services', 'Layanan') },
  ];

  // An open menu always gets the solid bar so its panel stays legible. On
  // the homepage the transparent bar floats over the dark hero, so it also
  // takes the dark token scope (white type); elsewhere it sits on the light
  // canvas and keeps ink type.
  const transparent = !scrolled && !menuOpen && !open;
  const overDarkHero = transparent && pathname === '/';

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 w-full border-b text-foreground transition-[background-color,border-color,color] duration-300',
        transparent ? 'border-transparent bg-transparent' : 'border-border bg-white',
        overDarkHero && 'dark'
      )}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-8">
          {/* Text-only wordmark: Plus Jakarta Sans ExtraBold, tightly tracked. */}
          <Link href="/" aria-label="MasmasIT home" className="w-fit font-brand text-[22px] font-extrabold leading-none tracking-[-0.035em]">
            MasmasIT
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            <div
              ref={menuRef}
              className="relative"
              onPointerEnter={openMenu}
              onPointerLeave={scheduleCloseMenu}
            >
              <button
                type="button"
                onPointerDown={(e) => { lastPointer.current = e.pointerType; }}
                onClick={onTriggerClick}
                aria-expanded={menuOpen}
                className={cn(
                  'rounded-md px-3.5 py-2 text-[15px] font-semibold transition-all hover:bg-muted/50 hover:text-foreground',
                  menuOpen ? 'bg-muted/60 text-foreground' : 'text-foreground/70'
                )}
              >
                <StableLabel en="Ecosystem" id="Ekosistem" />
              </button>

              {menuOpen && (
                <div className="absolute left-1/2 top-full z-50 mt-2 w-[600px] -translate-x-1/2 animate-fade-up rounded-xl border border-border bg-white p-6 shadow-xl">
                  <div className="grid grid-cols-3 gap-6">
                    {ecosystemColumns.map((col) => (
                      <div key={col.eyebrowEn}>
                        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                          {t(col.eyebrowEn, col.eyebrowId)}
                        </p>
                        <div className="mt-3 flex flex-col gap-1">
                          {col.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="group -mx-2 block rounded-md p-2 transition-colors hover:bg-muted/50"
                            >
                              <span>
                                <span className="block text-[15px] font-semibold text-foreground">{t(item.en, item.id)}</span>
                                <span className="block text-xs text-muted-foreground">{t(item.descEn, item.descId)}</span>
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/directory"
              className={cn(
                'relative rounded-md px-3.5 py-2 text-[15px] font-semibold transition-all hover:bg-muted/50 hover:text-foreground',
                pathname === '/directory' ? 'text-foreground' : 'text-foreground/70'
              )}
            >
              <StableLabel en="Members" id="Member" />
              {pathname === '/directory' && (
                <span className="absolute -bottom-px left-3.5 right-3.5 h-0.5 rounded-full bg-foreground" />
              )}
            </Link>
          </nav>

          <div className="hidden items-center justify-self-end gap-1.5 lg:flex">
            {user && (
              <Link href="/pesan">
                <Button variant="ghost" size="sm" className="h-10 text-[15px] font-semibold text-foreground/70">
                  <StableLabel en="Messages" id="Pesan" />
                </Button>
              </Link>
            )}
            {user && <NotificationBell />}
            <button
              onClick={toggleLang}
              className="rounded-md px-2.5 py-2 text-[13px] font-semibold tracking-wide"
              aria-label={t('Switch to Bahasa Indonesia', 'Ganti ke English')}
            >
              <span className={lang === 'en' ? 'text-foreground' : 'text-muted-foreground'}>EN</span>
              <span className="text-muted-foreground/60"> / </span>
              <span className={lang === 'id' ? 'text-foreground' : 'text-muted-foreground'}>ID</span>
            </button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-border/50 py-1 pl-1 pr-3 text-[15px] font-semibold transition-colors hover:bg-muted">
                    <Avatar className="h-7 w-7">
                      {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
                      <AvatarFallback className="bg-primary/15 text-xs text-primary">{initial}</AvatarFallback>
                    </Avatar>
                    <span className="max-w-[120px] truncate">{displayName}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="truncate">{displayName}</span>
                    <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">{t('Dashboard', 'Dashboard')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">{t('Profile', 'Profil')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/activity">{t('My Activity', 'Aktivitas Saya')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/pesan">{t('Messages', 'Pesan')}</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin">{t('Admin Panel', 'Panel Admin')}</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    {t('Sign out', 'Keluar')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="h-10 px-3.5 text-[15px] font-semibold hover:bg-muted/50">
                    <StableLabel en="Sign in" id="Masuk" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="h-10 rounded-full px-5 text-[15px] font-semibold">
                    <StableLabel en="Get started" id="Daftar" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="rounded-md px-2 py-1.5 text-[15px] font-semibold lg:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
          >
            <StableText show={open ? t('Close', 'Tutup') : 'Menu'} all={['Menu', 'Close', 'Tutup']} />
          </button>
        </div>

        {open && (
          <div className="border-t border-border bg-white lg:hidden animate-fade-up">
            <nav className="flex flex-col gap-0.5 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'rounded-md px-3 py-2.5 text-[15px] font-semibold transition-colors hover:bg-muted',
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
                    'rounded-md px-3 py-2.5 text-[15px] font-semibold transition-colors hover:bg-muted',
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
                    'rounded-md px-3 py-2.5 text-[15px] font-semibold transition-colors hover:bg-muted',
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
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-destructive">
                    {t('Sign out', 'Keluar')}
                  </Button>
                </div>
              )}
              <div className="mt-3 flex items-center gap-2 border-t border-border/40 pt-3">
                {user && <NotificationBell />}
                <button
                  onClick={toggleLang}
                  className="rounded-md px-2.5 py-2 text-[13px] font-semibold tracking-wide"
                  aria-label={t('Switch to Bahasa Indonesia', 'Ganti ke English')}
                >
                  <span className={lang === 'en' ? 'text-foreground' : 'text-muted-foreground'}>EN</span>
                  <span className="text-muted-foreground/60"> / </span>
                  <span className={lang === 'id' ? 'text-foreground' : 'text-muted-foreground'}>ID</span>
                </button>
                {user ? (
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="flex-1">
                    <Button size="sm" className="w-full">
                      {t('Dashboard', 'Dashboard')}
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)} className="flex-1">
                      <Button variant="ghost" size="sm" className="h-10 w-full text-[15px] font-semibold hover:bg-transparent">{t('Sign in', 'Masuk')}</Button>
                    </Link>
                    <Link href="/register" onClick={() => setOpen(false)} className="flex-1">
                      <Button size="sm" className="h-10 w-full rounded-full text-[15px] font-semibold">{t('Get started', 'Daftar')}</Button>
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
