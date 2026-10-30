'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Briefcase,
  Building2,
  Calendar,
  FolderKanban,
  Globe,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sparkles,
  Star,
  User,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { MessagesUnreadBadge } from '@/features/messages/components/MessagesUnreadBadge';
import { GlobalSearch } from '@/features/search/components/GlobalSearch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/shared/lib/utils';
import mmitLogo from '@/shared/images/mmit-transparent.png';

type NavItem = {
  href: string;
  labelEn: string;
  labelId: string;
  icon: LucideIcon;
  exact?: boolean;
  adminOnly?: boolean;
  companyOnly?: boolean;
};

type NavGroup = {
  key: string;
  labelEn: string;
  labelId: string;
  items: NavItem[];
};

const SECTIONS: NavGroup[] = [
  {
    key: 'main',
    labelEn: 'Main',
    labelId: 'Utama',
    items: [
      { href: '/dashboard', labelEn: 'Dashboard', labelId: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/activity', labelEn: 'My Activity', labelId: 'Aktivitas Saya', icon: Star },
      { href: '/profile', labelEn: 'Profile', labelId: 'Profil', icon: User },
      { href: '/pesan', labelEn: 'Messages', labelId: 'Pesan', icon: MessageCircle },
    ],
  },
  {
    key: 'product',
    labelEn: 'Product',
    labelId: 'Produk',
    items: [
      { href: '/team-builder', labelEn: 'Team Builder', labelId: 'Team Builder', icon: Users },
      { href: '/team-collabs', labelEn: 'Team Collabs', labelId: 'Team Collabs', icon: FolderKanban },
      { href: '/jobs', labelEn: 'Jobs', labelId: 'Lowongan', icon: Briefcase },
      { href: '/projects', labelEn: 'Projects', labelId: 'Proyek', icon: FolderKanban },
      { href: '/spotlight', labelEn: 'Spotlight', labelId: 'Spotlight', icon: Sparkles },
    ],
  },
  {
    key: 'ecosystem',
    labelEn: 'Ecosystem',
    labelId: 'Ekosistem',
    items: [
      { href: '/talents', labelEn: 'Talent', labelId: 'Talent', icon: GraduationCap },
      { href: '/courses', labelEn: 'Courses', labelId: 'Kursus', icon: GraduationCap },
      { href: '/agency', labelEn: 'Agency', labelId: 'Agency', icon: Building2 },
      { href: '/services', labelEn: 'Services', labelId: 'Layanan', icon: Wrench },
    ],
  },
  {
    key: 'community',
    labelEn: 'Community',
    labelId: 'Komunitas',
    items: [
      { href: '/discussions', labelEn: 'Discussions', labelId: 'Diskusi', icon: MessagesSquare },
      { href: '/directory', labelEn: 'Members', labelId: 'Member', icon: Users },
      { href: '/builds', labelEn: 'Builds', labelId: 'Builds', icon: FolderKanban },
      { href: '/events', labelEn: 'Events', labelId: 'Event', icon: Calendar },
      { href: '/discover', labelEn: 'Discover', labelId: 'Discover', icon: Search },
    ],
  },
  {
    key: 'manage',
    labelEn: 'Manage',
    labelId: 'Kelola',
    items: [
      { href: '/jobs/applicants', labelEn: 'Job Applicants', labelId: 'Pelamar Lowongan', icon: Briefcase, companyOnly: true },
      { href: '/admin', labelEn: 'Admin Panel', labelId: 'Panel Admin', icon: Settings, adminOnly: true },
    ],
  },
];

const COLLAPSED_COOKIE = 'mm:sidebar-collapsed';

function readCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return document.cookie.split('; ').some((c) => c === `${COLLAPSED_COOKIE}=1`);
  } catch {
    return false;
  }
}

function writeCollapsed(val: boolean) {
  const maxAge = 365 * 24 * 60 * 60;
  document.cookie = `${COLLAPSED_COOKIE}=${val ? '1' : '0'}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function NavSectionBlock({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <nav aria-label={label} className="grid gap-0.5 px-2">
      {collapsed ? null : (
        <p className="px-3 py-1.5 text-[11px] font-semibold tracking-wider uppercase text-sidebar-muted">
          {label}
        </p>
      )}
      {children}
    </nav>
  );
}

function SidebarBody({
  collapsed,
  onToggleCollapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
}) {
  const { user, profile, roles, signOut } = useAuth();
  const { lang, toggleLang, t } = useLang();
  const pathname = usePathname();
  const router = useRouter();

  const isAdmin = roles.includes('super_admin') || roles.includes('regional_admin');
  const isCompany = roles.includes('company');
  const displayName = profile?.full_name || user?.email?.split('@')[0] || '';
  const initial = (profile?.full_name || user?.email || '?').charAt(0).toUpperCase();

  const handleSignOut = async () => {
    onNavigate?.();
    await signOut();
    router.push('/');
    router.refresh();
  };

  const toggleLabel = collapsed ? t('Expand sidebar', 'Perlebar sidebar') : t('Collapse sidebar', 'Perkecil sidebar');

  const toggle = onToggleCollapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={toggleLabel}
          onClick={onToggleCollapsed}
          className={cn('text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent', collapsed && 'size-10')}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={6}>
        {toggleLabel}
      </TooltipContent>
    </Tooltip>
  ) : null;

  const renderLink = (item: NavItem) => {
    const active = item.exact ? pathname === item.href : pathname === item.href || pathname?.startsWith(`${item.href}/`);
    const Icon = item.icon;
    const label = t(item.labelEn, item.labelId);

    if (collapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center justify-center rounded-lg p-2.5 transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-active font-semibold'
                  : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <Icon className="size-4" />
              <span className="sr-only">{label}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={6}>
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors',
          active
            ? 'bg-sidebar-accent text-sidebar-active font-semibold'
            : 'text-sidebar-muted font-medium hover:bg-sidebar-accent hover:text-sidebar-foreground'
        )}
      >
        <Icon className="size-4 shrink-0" />
        {label}
        {item.href === '/pesan' && <MessagesUnreadBadge className="ml-auto" />}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col">
      {collapsed ? (
        <div className="flex shrink-0 flex-col items-center gap-1 py-2">
          {toggle}
        </div>
      ) : (
        <div className="flex h-14 shrink-0 items-center gap-2 px-5">
          <img src={mmitLogo.src} alt="" aria-hidden className="h-5 w-auto shrink-0" />
          <span className="font-brand text-lg font-extrabold tracking-tight text-sidebar-foreground">MasmasIT</span>
          {toggle && (
            <div className="-mr-2 ml-auto flex items-center">
              {toggle}
            </div>
          )}
        </div>
      )}

      <Separator className="bg-sidebar-border" />

      <div
        className={cn(
          'flex-1 overflow-y-auto py-3',
          collapsed ? 'divide-y divide-sidebar-border [&>nav]:py-2' : 'space-y-4'
        )}
      >
        {SECTIONS.map((section) => {
          const filtered = section.items.filter((item) => {
            if (item.adminOnly && !isAdmin) return false;
            if (item.companyOnly && !isCompany) return false;
            return true;
          });
          if (filtered.length === 0) return null;
          return (
            <NavSectionBlock key={section.key} label={t(section.labelEn, section.labelId)} collapsed={collapsed}>
              {filtered.map(renderLink)}
            </NavSectionBlock>
          );
        })}
      </div>

      <Separator className="bg-sidebar-border" />

      <div className={cn('shrink-0', collapsed ? 'py-2' : 'p-3')}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleLang}
                  className="rounded-md p-2 text-xs font-semibold text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  {lang === 'en' ? 'EN' : 'ID'}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={6}>
                {t('Switch language', 'Ganti bahasa')}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/profile"
                  onClick={onNavigate}
                  className="flex items-center justify-center rounded-md p-1.5 hover:bg-sidebar-accent"
                >
                  <Avatar className="size-8">
                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
                    <AvatarFallback className="bg-sidebar-accent text-xs text-sidebar-foreground">{initial}</AvatarFallback>
                  </Avatar>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={6}>
                {displayName}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSignOut}
                  className="rounded-md p-2.5 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-destructive"
                >
                  <LogOut className="size-4" />
                  <span className="sr-only">{t('Sign out', 'Keluar')}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={6}>
                {t('Sign out', 'Keluar')}
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-1 py-2">
              <Avatar className="size-8">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
                <AvatarFallback className="bg-sidebar-accent text-xs text-sidebar-foreground">{initial}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">{displayName}</p>
                <p className="truncate text-xs text-sidebar-muted">{user?.email}</p>
              </div>
              <button
                onClick={toggleLang}
                className="shrink-0 rounded-md px-1.5 py-1 text-xs font-semibold"
              >
                <span className={lang === 'en' ? 'text-sidebar-foreground' : 'text-sidebar-muted'}>EN</span>
                <span className="text-sidebar-muted"> / </span>
                <span className={lang === 'id' ? 'text-sidebar-foreground' : 'text-sidebar-muted'}>ID</span>
              </button>
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-destructive"
            >
              <LogOut className="size-4" />
              {t('Sign out', 'Keluar')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const { t } = useLang();

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    writeCollapsed(next);
  }

  return (
    <div className="min-h-svh">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-in-out motion-reduce:transition-none md:flex',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div
          className={cn(
            'h-full shrink-0',
            collapsed ? 'w-16' : 'w-64'
          )}
        >
          <TooltipProvider delayDuration={150}>
            <SidebarBody
              collapsed={collapsed}
              onToggleCollapsed={toggleCollapsed}
            />
          </TooltipProvider>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background px-4 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t('Open navigation', 'Buka navigasi')}>
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[17rem] max-w-[85vw] bg-sidebar p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>{t('Navigation', 'Navigasi')}</SheetTitle>
            </SheetHeader>
            <SidebarBody
              collapsed={false}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <img src={mmitLogo.src} alt="" aria-hidden className="h-5 w-auto" />
          <span className="font-brand text-lg font-extrabold tracking-tight">MasmasIT</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <GlobalSearch />
          <NotificationBell />
        </div>
      </header>

      {/* Main content */}
      <main
        className={cn(
          'transition-[padding] duration-300 ease-in-out motion-reduce:transition-none',
          collapsed ? 'md:pl-16' : 'md:pl-64'
        )}
      >
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
