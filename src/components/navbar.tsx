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
import { GlobalSearch } from '@/features/search/components/GlobalSearch';
import { StableLabel, StableText } from '@/components/stable-label';
import { waLink } from '@/shared/lib/external';
import { cn } from '@/shared/lib/utils';
import mmitLogo from '@/shared/images/mmit-transparent.png';
import mmitLogoWhite from '@/shared/images/mmitwhite-transparent.png';

/* Header structure is fixed by the PRD: two dropdowns (Product, Ecosystem)
   and three direct links (About, Discover, Contact Us). No "Home" — the
   wordmark on the left is the way back to the landing page. */

type MenuItem = { href: string; en: string; id: string; descEn: string; descId: string; external?: boolean };

const productItems: MenuItem[] = [
  {
    href: '/team-builder',
    en: 'Team Builder', id: 'Team Builder',
    descEn: 'Assemble a team, roles graded automatically', descId: 'Susun tim, grade tiap role otomatis',
  },
  {
    href: '/spotlight',
    en: 'Spotlight', id: 'Spotlight',
    descEn: 'Products and services members are shipping', descId: 'Produk dan jasa yang dirilis member',
  },
];

const ecosystemColumns: { eyebrowEn: string; eyebrowId: string; items: MenuItem[] }[] = [
  {
    eyebrowEn: 'Work', eyebrowId: 'Kerja',
    items: [
      { href: '/jobs', en: 'Jobs', id: 'Lowongan', descEn: 'Full-time & freelance roles', descId: 'Peran full-time & freelance' },
      { href: '/projects', en: 'Projects', id: 'Proyek', descEn: 'Client projects open for bids', descId: 'Proyek klien yang dibuka' },
      { href: '/team-collabs', en: 'Team Collabs', id: 'Team Collabs', descEn: 'Teams building R&D together', descId: 'Tim yang bangun R&D bareng' },
    ],
  },
  {
    eyebrowEn: 'Talent', eyebrowId: 'Talent',
    items: [
      { href: '/talents', en: 'Talent', id: 'Talent', descEn: 'Book IT practitioners 1-on-1', descId: 'Booking praktisi IT 1-on-1' },
      { href: '/courses', en: 'Courses', id: 'Kursus', descEn: 'Courses by practitioners', descId: 'Kursus dari para praktisi' },
    ],
  },
  {
    eyebrowEn: 'Business', eyebrowId: 'Bisnis',
    items: [
      { href: '/agency', en: 'Agency', id: 'Agency', descEn: 'Approved agencies and their catalogues', descId: 'Agency terverifikasi & katalognya' },
      { href: '/services', en: 'Services', id: 'Layanan', descEn: 'Professional IT services', descId: 'Layanan IT profesional' },
    ],
  },
  {
    eyebrowEn: 'Community', eyebrowId: 'Komunitas',
    items: [
      { href: '/discussions', en: 'Discussions', id: 'Diskusi', descEn: 'Ask, answer, argue well', descId: 'Tanya, jawab, berdebat sehat' },
      { href: '/directory', en: 'Members', id: 'Member', descEn: 'Who is on the platform', descId: 'Siapa saja yang ada di sini' },
      { href: '/builds', en: 'Builds', id: 'Builds', descEn: 'What members are building now', descId: 'Yang lagi dibangun member' },
      { href: '/events', en: 'Events', id: 'Event', descEn: 'Meetups & hackathons', descId: 'Meetup & hackathon' },
    ],
  },
];

const CONTACT_WA = waLink('Halo MasmasIT, saya ingin bertanya.');

export function Navbar() {
  const [open, setOpen] = useState(false);
  /* One dropdown at a time; the id is the trigger that owns the open panel. */
  const [menu, setMenu] = useState<'product' | 'ecosystem' | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
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
    setMenu(null);
  }, [pathname]);

  useEffect(() => {
    if (!menu) return;
    const onOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMenu(null);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [menu]);

  // Mouse users open the menu by hovering, so their click on the trigger
  // must not toggle it straight back closed. Touch and keyboard still toggle.
  const lastPointer = useRef<string>('');
  const openMenu = (id: 'product' | 'ecosystem') => (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenu(id);
  };
  const scheduleCloseMenu = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMenu(null), 150);
  };
  const onTriggerClick = (id: 'product' | 'ecosystem') => (e: React.MouseEvent) => {
    const viaMouse = e.detail > 0 && lastPointer.current === 'mouse';
    setMenu((v) => (viaMouse ? id : v === id ? null : id));
  };

  /* Mobile drawer: the same structure, flattened into one scrollable list. */
  const mobileGroups = [
    { titleEn: 'Product', titleId: 'Product', items: productItems },
    ...ecosystemColumns.map((c) => ({ titleEn: c.eyebrowEn, titleId: c.eyebrowId, items: c.items })),
  ];

  const triggerClass = (active: boolean) =>
    cn(
      'rounded-md px-3.5 py-2 text-base font-medium transition-all hover:bg-muted/50 hover:text-foreground',
      active ? 'bg-muted/60 text-foreground' : 'text-foreground/70'
    );

  const linkClass = (active: boolean) =>
    cn(
      'relative rounded-md px-3.5 py-2 text-base font-medium transition-all hover:bg-muted/50 hover:text-foreground',
      active ? 'text-foreground' : 'text-foreground/70'
    );

  const panelItem = (item: MenuItem) => (
    <Link
      key={item.href}
      href={item.href}
      className="group -mx-2 block rounded-md p-2 transition-colors hover:bg-muted/50"
    >
      <span>
        <span className="block text-base font-medium text-foreground">{t(item.en, item.id)}</span>
        <span className="block text-xs text-muted-foreground">{t(item.descEn, item.descId)}</span>
      </span>
    </Link>
  );

  // Only the homepage has a dark hero for the bar to float over transparently
  // — every other page's content starts right below it with no backdrop to
  // blend into, so the bar must stay solid there from scroll position zero,
  // or page content scrolling up underneath a transparent bar looks like it
  // collides with the nav links.
  const isHome = pathname === '/';
  const transparent = isHome && !scrolled && !menu && !open;
  const overDarkHero = transparent;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 w-full border-b text-foreground transition-[background-color,border-color,color] duration-300',
        transparent ? 'border-transparent bg-transparent' : 'border-border bg-white',
        overDarkHero && 'dark'
      )}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logomark + wordmark: Plus Jakarta Sans ExtraBold, tightly tracked.
              This is also the only route home — there is no "Home" nav item. */}
          <Link href="/" aria-label="MasmasIT home" className="flex shrink-0 items-center gap-2">
            <img
              src={(overDarkHero ? mmitLogoWhite : mmitLogo).src}
              alt=""
              aria-hidden
              className="h-6 w-auto shrink-0"
            />
            <span className="font-brand text-[22px] font-extrabold leading-none tracking-[-0.035em]">
              MasmasIT
            </span>
          </Link>

          <nav ref={navRef} className="hidden items-center gap-0.5 lg:flex">
            <Link href="/about" className={linkClass(pathname === '/about')}>
              <StableLabel en="About" id="Tentang" />
              {pathname === '/about' && (
                <span className="absolute -bottom-px left-3.5 right-3.5 h-0.5 rounded-full bg-foreground" />
              )}
            </Link>

            <div className="relative" onPointerEnter={openMenu('product')} onPointerLeave={scheduleCloseMenu}>
              <button
                type="button"
                onPointerDown={(e) => { lastPointer.current = e.pointerType; }}
                onClick={onTriggerClick('product')}
                aria-expanded={menu === 'product'}
                className={triggerClass(menu === 'product')}
              >
                <StableLabel en="Product" id="Product" />
              </button>

              {menu === 'product' && (
                <div className="absolute left-1/2 top-full z-50 mt-2 w-[320px] -translate-x-1/2 animate-fade-up rounded-xl border border-border bg-white p-4 shadow-xl">
                  <div className="flex flex-col gap-1">{productItems.map(panelItem)}</div>
                </div>
              )}
            </div>

            <div className="relative" onPointerEnter={openMenu('ecosystem')} onPointerLeave={scheduleCloseMenu}>
              <button
                type="button"
                onPointerDown={(e) => { lastPointer.current = e.pointerType; }}
                onClick={onTriggerClick('ecosystem')}
                aria-expanded={menu === 'ecosystem'}
                className={triggerClass(menu === 'ecosystem')}
              >
                <StableLabel en="Ecosystem" id="Ekosistem" />
              </button>

              {menu === 'ecosystem' && (
                <div className="absolute left-1/2 top-full z-50 mt-2 w-[min(880px,calc(100vw-3rem))] -translate-x-1/2 animate-fade-up rounded-xl border border-border bg-white p-6 shadow-xl">
                  <div className="grid grid-cols-4 gap-6">
                    {ecosystemColumns.map((col, i) => (
                      <div
                        key={col.eyebrowEn}
                        /* Community is the ecosystem's own quarter, not a
                           fourth category of listings — a rule sets it apart. */
                        className={i === ecosystemColumns.length - 1 ? 'border-l border-border pl-6' : ''}
                      >
                        <p className="eyebrow text-muted-foreground">
                          {t(col.eyebrowEn, col.eyebrowId)}
                        </p>
                        <div className="mt-3 flex flex-col gap-1">{col.items.map(panelItem)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link href="/discover" className={linkClass(pathname === '/discover')}>
              <StableLabel en="Discover" id="Discover" />
              {pathname === '/discover' && (
                <span className="absolute -bottom-px left-3.5 right-3.5 h-0.5 rounded-full bg-foreground" />
              )}
            </Link>

            <a href={CONTACT_WA} target="_blank" rel="noreferrer" className={linkClass(false)}>
              <StableLabel en="Contact Us" id="Hubungi Kami" />
            </a>
          </nav>

          <div className="hidden shrink-0 items-center gap-1.5 lg:flex">
            <GlobalSearch />
            {user && (
              <Link href="/pesan">
                <Button variant="ghost" size="sm" className="h-10 text-base font-medium text-foreground/70">
                  <StableLabel en="Messages" id="Pesan" />
                </Button>
              </Link>
            )}
            {user && <NotificationBell />}
            <button
              onClick={toggleLang}
              className="rounded-md px-2.5 py-2 text-xs font-semibold"
              aria-label={t('Switch to Bahasa Indonesia', 'Ganti ke English')}
            >
              <span className={lang === 'en' ? 'text-foreground' : 'text-muted-foreground'}>EN</span>
              <span className="text-muted-foreground/60"> / </span>
              <span className={lang === 'id' ? 'text-foreground' : 'text-muted-foreground'}>ID</span>
            </button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-border/50 py-1 pl-1 pr-3 text-base font-medium transition-colors hover:bg-muted">
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
                  <Button variant="ghost" size="sm" className="h-10 px-3.5 text-base font-medium hover:bg-muted/50">
                    <StableLabel en="Sign in" id="Masuk" />
                  </Button>
                </Link>
                {/* Nearly every path through the site ends at a login wall, so
                    this is the primary route, not a secondary CTA: solid fill,
                    heavier type, never an outline. */}
                <Link href="/register">
                  <Button size="sm" className="h-10 rounded-full px-5 text-base font-semibold shadow-sm">
                    <StableLabel en="Get Started" id="Daftar" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="rounded-md px-2 py-1.5 text-base font-medium lg:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
          >
            <StableText show={open ? t('Close', 'Tutup') : 'Menu'} all={['Menu', 'Close', 'Tutup']} />
          </button>
        </div>

        {open && (
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-border bg-white lg:hidden animate-fade-up">
            <nav className="flex flex-col gap-0.5 px-4 py-4">
              <Link
                href="/about"
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-md px-3 py-2.5 text-base font-medium transition-colors hover:bg-muted',
                  pathname === '/about' ? 'bg-primary/5 text-primary' : 'text-foreground'
                )}
              >
                {t('About', 'Tentang')}
              </Link>

              {mobileGroups.map((group) => (
                <div key={group.titleEn} className="mt-3">
                  <p className="eyebrow px-3 text-muted-foreground">{t(group.titleEn, group.titleId)}</p>
                  <div className="mt-1 flex flex-col gap-0.5">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'rounded-md px-3 py-2.5 text-base font-medium transition-colors hover:bg-muted',
                          pathname === item.href ? 'bg-primary/5 text-primary' : 'text-muted-foreground'
                        )}
                      >
                        {t(item.en, item.id)}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              <div className="mt-3 flex flex-col gap-0.5 border-t border-border/40 pt-3">
                <Link
                  href="/discover"
                  onClick={() => setOpen(false)}
                  className={cn(
                    'rounded-md px-3 py-2.5 text-base font-medium transition-colors hover:bg-muted',
                    pathname === '/discover' ? 'bg-primary/5 text-primary' : 'text-foreground'
                  )}
                >
                  {t('Discover', 'Discover')}
                </Link>
                <a
                  href={CONTACT_WA}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {t('Contact Us', 'Hubungi Kami')}
                </a>
                {user && (
                  <Link
                    href="/pesan"
                    onClick={() => setOpen(false)}
                    className={cn(
                      'rounded-md px-3 py-2.5 text-base font-medium transition-colors hover:bg-muted',
                      pathname === '/pesan' ? 'bg-primary/5 text-primary' : 'text-muted-foreground'
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
                      'rounded-md px-3 py-2.5 text-base font-medium transition-colors hover:bg-muted',
                      pathname === '/profile' ? 'bg-primary/5 text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {t('Profile', 'Profil')}
                  </Link>
                )}
              </div>

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
              {/* Two rows, not one — Search/EN-ID/Sign in/Get Started never
                  fit on one line at phone width without wrapping mid-word. */}
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/40 pt-3">
                <div className="flex min-w-0 items-center gap-1">
                  <GlobalSearch />
                  {user && <NotificationBell />}
                </div>
                <button
                  onClick={toggleLang}
                  className="shrink-0 rounded-md px-2.5 py-2 text-xs font-semibold"
                  aria-label={t('Switch to Bahasa Indonesia', 'Ganti ke English')}
                >
                  <span className={lang === 'en' ? 'text-foreground' : 'text-muted-foreground'}>EN</span>
                  <span className="text-muted-foreground/60"> / </span>
                  <span className={lang === 'id' ? 'text-foreground' : 'text-muted-foreground'}>ID</span>
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {user ? (
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="flex-1">
                    <Button size="sm" className="w-full">
                      {t('Dashboard', 'Dashboard')}
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)} className="flex-1">
                      <Button variant="ghost" size="sm" className="h-10 w-full text-base font-medium hover:bg-transparent">{t('Sign in', 'Masuk')}</Button>
                    </Link>
                    <Link href="/register" onClick={() => setOpen(false)} className="flex-1">
                      <Button size="sm" className="h-10 w-full rounded-full text-base font-semibold shadow-sm">{t('Get Started', 'Daftar')}</Button>
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
