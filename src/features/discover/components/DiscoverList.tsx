'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Calendar, MapPin, Search } from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { LoadData } from '@/components/load-data';
import { useLang } from '@/components/language-provider';
import { useAuth } from '@/components/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TONE_CHIP, TONE_TEXT, toneOf } from '@/shared/lib/tones';
import { unwrapApiResponse } from '@/shared/lib/apiResponse';
import { cn } from '@/shared/lib/utils';

import { useCaseStudiesControllers } from '@/features/case-studies/controllers/caseStudiesControllers';
import { useArticlesControllers } from '@/features/articles/controllers/articlesControllers';
import { useDiscussionsFeaturedControllers } from '@/features/discussions/controllers/discussionsControllers';
import { useEventsControllers } from '@/features/events/controllers/eventsControllers';
import { useTalentsControllers } from '@/features/talents/controllers/talentsControllers';
import { getSearch } from '@/features/search/services/searchServices';
import { getJobs } from '@/features/jobs/services/jobsServices';

/**
 * Discover was one page with three strands of reading (REST.md Bagian 3/9).
 * It's now also the ecosystem's front door — a hub to browse everywhere
 * else on MasmasIT, not just read — while keeping those three strands
 * intact further down. Every section here pulls real data through the
 * feature's own controller/service; nothing on this page is invented.
 */

const QUICK_LINKS: { href: string; en: string; id: string; area: string }[] = [
  { href: '/jobs', en: 'Jobs', id: 'Lowongan', area: 'jobs' },
  { href: '/projects', en: 'Projects', id: 'Proyek', area: 'projects' },
  { href: '/team-builder', en: 'Team Builder', id: 'Team Builder', area: 'team-builder' },
  { href: '/team-collabs', en: 'Team Collabs', id: 'Team Collabs', area: 'team-collabs' },
  { href: '/talents', en: 'Talent', id: 'Talent', area: 'talents' },
  { href: '/courses', en: 'Courses', id: 'Kursus', area: 'courses' },
  { href: '/events', en: 'Events', id: 'Event', area: 'events' },
  { href: '/agency', en: 'Agency', id: 'Agency', area: 'agency' },
  { href: '/services', en: 'Services', id: 'Layanan', area: 'services' },
  { href: '/discussions', en: 'Discussions', id: 'Diskusi', area: 'discussions' },
  { href: '/directory', en: 'Members', id: 'Member', area: 'directory' },
  { href: '/builds', en: 'Builds', id: 'Builds', area: 'builds' },
  { href: '/spotlight', en: 'Spotlight', id: 'Spotlight', area: 'spotlight' },
];

type LatestKind = 'article' | 'case-study' | 'member';

interface LatestItem {
  id: string;
  kind: LatestKind;
  title: string;
  excerpt: string;
  image: string | null;
  created_at: string;
  href?: string;
  meta?: string;
}

const KIND_LABEL: Record<LatestKind, { en: string; id: string }> = {
  article: { en: 'Article', id: 'Artikel' },
  'case-study': { en: 'Case Study', id: 'Studi Kasus' },
  member: { en: 'Member Writing', id: 'Tulisan Member' },
};

export default function DiscoverList() {
  const { t } = useLang();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Inline hero search: its own debounced query against the same search
  // service the header dialog uses (not the dialog's shared store, so the
  // two never overwrite each other's term).
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 250);
    return () => clearTimeout(timeout);
  }, [searchTerm]);
  const fetchHeroSearch = useQuery({
    queryKey: ['discoverSearch', debouncedTerm],
    queryFn: async () => unwrapApiResponse(await getSearch(debouncedTerm)) ?? [],
    enabled: debouncedTerm.length >= 2,
  });
  const heroResults = debouncedTerm.length >= 2 ? fetchHeroSearch.data ?? [] : [];
  const searchLabels = { profile: t('Members', 'Member'), job: t('Jobs', 'Lowongan'), course: t('Courses', 'Kursus'), project: t('Projects', 'Proyek') };

  const { fetchCaseStudies } = useCaseStudiesControllers();
  const { fetchArticles } = useArticlesControllers();
  const { fetchDiscussionsFeatured } = useDiscussionsFeaturedControllers();
  const { fetchEvents } = useEventsControllers();
  const { fetchTalents } = useTalentsControllers();

  // A dedicated, always-unfiltered query — reusing the Jobs page's own
  // controller would inherit whatever type/location filter is still sitting
  // in its shared store from a previous visit to /jobs.
  const fetchOpenRoles = useQuery({
    queryKey: ['discoverOpenRoles'],
    queryFn: async () => unwrapApiResponse(await getJobs({ search: '', typeFilter: 'all', locationFilter: 'all' })) ?? [],
  });

  const studies = fetchCaseStudies.data ?? [];
  const articles = fetchArticles.data ?? [];
  const featured = fetchDiscussionsFeatured.data ?? [];
  const events = fetchEvents.data ?? [];
  const talents = fetchTalents.data ?? [];
  const openRoles = fetchOpenRoles.data ?? [];

  const readingLoading = fetchCaseStudies.isPending || fetchArticles.isPending || fetchDiscussionsFeatured.isPending;

  const latest = useMemo<LatestItem[]>(() => {
    const items: LatestItem[] = [
      ...articles.map((a) => ({
        id: `article-${a.id}`, kind: 'article' as const, title: a.title, excerpt: a.excerpt,
        image: a.cover_image_url, created_at: a.created_at,
      })),
      ...studies.map((cs) => ({
        id: `case-study-${cs.id}`, kind: 'case-study' as const, title: cs.title, excerpt: cs.result,
        image: cs.image_url, created_at: cs.created_at, meta: cs.client_name,
      })),
      ...featured.map((d) => ({
        id: `member-${d.id}`, kind: 'member' as const, title: d.title, excerpt: d.body,
        image: null, created_at: d.created_at, href: `/discussions/${d.id}`,
        meta: d.profiles?.full_name ?? t('Anonymous', 'Anonim'),
      })),
    ];
    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);
  }, [articles, studies, featured, t]);

  const upcomingEvents = useMemo(
    () => events.filter((e) => new Date(e.event_date) > new Date()).slice(0, 4),
    [events]
  );

  return (
    <AppShell>
      {/* 1 ── Hero: headline + the site's real search, just with a bigger
          trigger than the header's icon. */}
      <div className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="eyebrow text-muted-foreground">{t('Discover', 'Discover')}</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-balance sm:text-5xl">
            {t('Whatever you need, MasmasIT has a corner for it.', 'Apapun yang kamu cari, MasmasIT punya tempatnya.')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-pretty">
            {t(
              'Jobs, talent, courses, communities, and everything members are building — one search away.',
              'Lowongan, talent, kursus, komunitas, dan semua yang sedang dibangun member — satu pencarian saja.'
            )}
          </p>

          {!authLoading && !user && (
            <div className="mx-auto mt-8 max-w-xl rounded-xl border border-border bg-card px-5 py-4 text-left">
              <p className="text-sm font-semibold">
                {t('Sign in to see what is live right now.', 'Masuk untuk melihat apa yang sedang berjalan.')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">
                {t(
                  'Search, listings and member profiles are open to members. The sections below fill in once you are signed in.',
                  'Pencarian, listing dan profil member terbuka untuk member. Bagian di bawah akan terisi setelah kamu masuk.'
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/register">
                  <Button size="sm" className="h-9 rounded-full px-4 font-semibold">{t('Get Started', 'Daftar')}</Button>
                </Link>
                <Link href="/login">
                  <Button size="sm" variant="outline" className="h-9 rounded-full px-4 font-semibold">{t('Sign in', 'Masuk')}</Button>
                </Link>
              </div>
            </div>
          )}

          <div className={cn('relative mx-auto mt-8 max-w-xl text-left', (!authLoading && !user) && 'hidden')}>
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('Search jobs, talent, courses, members…', 'Cari lowongan, talent, kursus, member…')}
              aria-label={t('Search', 'Cari')}
              className="h-12 rounded-full bg-card pl-12 pr-5 text-sm shadow-sm"
            />
            {debouncedTerm.length >= 2 && (
              <div className="absolute inset-x-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-xl">
                {fetchHeroSearch.isFetching && heroResults.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">{t('Searching…', 'Mencari…')}</p>
                ) : heroResults.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">{t('No results found', 'Tidak ada hasil')}</p>
                ) : (
                  heroResults.map((r) => (
                    <button
                      key={`${r.type}-${r.id}`}
                      onClick={() => router.push(r.href)}
                      className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{r.subtitle}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs">{searchLabels[r.type]}</Badge>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick links — every ecosystem area, coloured by the same tone
              its own page already uses (shared/lib/tones.ts) instead of an
              icon set of its own. */}
          <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:justify-center sm:overflow-x-visible">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'shrink-0 rounded-full border border-transparent px-4 py-2 text-sm font-medium transition-colors',
                  TONE_CHIP[toneOf(link.area)],
                  'hover:border-current/30'
                )}
              >
                {t(link.en, link.id)}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* 2 ── Latest across the ecosystem: articles, case studies and
            member writing, merged and sorted by date instead of split into
            tabs no one clicks between. */}
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold">{t('Latest from MasmasIT', 'Terbaru dari MasmasIT')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('Fresh writing from the platform, client work, and members themselves.', 'Tulisan segar dari platform, pekerjaan klien, dan member sendiri.')}
              </p>
            </div>
          </div>

          <LoadData
            hideIcon
            response={{
              isLoading: readingLoading,
              isEmpty: latest.length === 0,
              emptyTitle: t('Nothing published yet.', 'Belum ada yang dipublikasikan.'),
              emptySubtitle: t('Articles, case studies and member writing will show up here.', 'Artikel, studi kasus, dan tulisan member akan muncul di sini.'),
            }}
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((item) => {
                const tone = item.kind === 'case-study' ? toneOf('case-studies') : item.kind === 'member' ? toneOf('discussions') : toneOf('discover');
                const body = (
                  <Card className="glass group h-full overflow-hidden transition-all hover:border-primary/40 hover:-translate-y-0.5">
                    {item.image && (
                      <div className="relative h-36 overflow-hidden">
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <Badge variant="outline" className={cn('text-[11px]', TONE_CHIP[tone])}>
                        {t(KIND_LABEL[item.kind].en, KIND_LABEL[item.kind].id)}
                      </Badge>
                      <h3 className="mt-2.5 font-display text-base font-semibold leading-snug">{item.title}</h3>
                      {item.meta && <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p>}
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground text-pretty">{item.excerpt}</p>
                    </CardContent>
                  </Card>
                );
                return item.href ? <Link key={item.id} href={item.href}>{body}</Link> : <div key={item.id}>{body}</div>;
              })}
            </div>
          </LoadData>
        </section>

        {/* 3 ── Featured practitioners: real Talent profiles, not stock
            portraits. */}
        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold">{t('Featured practitioners', 'Praktisi Pilihan')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('IT practitioners open to 1-on-1 bookings.', 'Praktisi IT yang bisa di-booking 1-on-1.')}</p>
            </div>
            <Link href="/talents" className="shrink-0 text-sm font-medium text-primary hover:underline">
              {t('See all', 'Lihat semua')}
            </Link>
          </div>

          <LoadData
            hideIcon
            response={{
              isLoading: fetchTalents.isPending,
              isEmpty: talents.length === 0,
              emptyTitle: t('No practitioners listed yet.', 'Belum ada praktisi yang terdaftar.'),
            }}
          >
            <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
              {talents.slice(0, 8).map((talent) => (
                <Link
                  key={talent.id}
                  href={`/talents/${talent.id}`}
                  className="w-40 shrink-0 rounded-xl border border-border p-4 text-center transition-colors hover:border-primary/40"
                >
                  <Avatar className="mx-auto h-16 w-16">
                    {talent.avatar_url && <AvatarImage src={talent.avatar_url} alt={talent.full_name ?? ''} />}
                    <AvatarFallback className={TONE_CHIP[toneOf('talents')]}>
                      {(talent.full_name ?? '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="mt-3 truncate text-sm font-semibold">{talent.full_name ?? t('Practitioner', 'Praktisi')}</p>
                  {talent.location && <p className="truncate text-xs text-muted-foreground">{talent.location}</p>}
                </Link>
              ))}
            </div>
          </LoadData>
        </section>

        {/* 4 ── CTA: MasmasIT's own dark/accent-green closing-stage
            treatment (see globals.css), not a borrowed blue banner. */}
        <section className="dark accent-green relative mt-16 overflow-hidden rounded-2xl bg-background">
          <div className="flex flex-col items-center gap-5 px-6 py-12 text-center sm:px-12">
            <h2 className="font-display text-2xl font-bold text-balance sm:text-3xl">
              {t('Shipped something? Put it on Spotlight.', 'Baru rilis sesuatu? Pajang di Spotlight.')}
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {t('Products and services members are shipping, ranked by Hot Rank.', 'Produk dan jasa yang dirilis member, diurut berdasarkan Hot Rank.')}
            </p>
            <Link href="/spotlight">
              <Button size="lg" className="rounded-full px-8">
                {t('Go to Spotlight', 'Ke Spotlight')}
              </Button>
            </Link>
          </div>
        </section>

        {/* 5 ── Two real, live rails: open roles and upcoming events. */}
        <div className="mt-16 grid gap-10 lg:grid-cols-2">
          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 className={cn('font-display text-xl font-semibold', TONE_TEXT[toneOf('jobs')])}>{t('Open roles', 'Lowongan Terbuka')}</h2>
              <Link href="/jobs" className="shrink-0 text-sm font-medium text-primary hover:underline">{t('See all', 'Lihat semua')}</Link>
            </div>
            <LoadData
              hideIcon
              response={{
                isLoading: fetchOpenRoles.isPending,
                isEmpty: openRoles.length === 0,
                emptyTitle: t('No open roles right now.', 'Belum ada lowongan terbuka.'),
              }}
            >
              <div className="flex flex-col gap-3">
                {openRoles.slice(0, 4).map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center gap-3 rounded-lg border border-border p-3.5 transition-colors hover:border-primary/40">
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', TONE_CHIP[toneOf('jobs')])}>
                      {job.companies?.logo_url ? (
                        <img src={job.companies.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <span className="text-sm font-semibold">{(job.companies?.name ?? '?').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{job.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{job.companies?.name ?? t('Unknown company', 'Perusahaan tidak diketahui')}{job.location ? ` · ${job.location}` : ''}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </LoadData>
          </section>

          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 className={cn('font-display text-xl font-semibold', TONE_TEXT[toneOf('events')])}>{t('Upcoming events', 'Event Mendatang')}</h2>
              <Link href="/events" className="shrink-0 text-sm font-medium text-primary hover:underline">{t('See all', 'Lihat semua')}</Link>
            </div>
            <LoadData
              hideIcon
              response={{
                isLoading: fetchEvents.isPending,
                isEmpty: upcomingEvents.length === 0,
                emptyTitle: t('No upcoming events.', 'Belum ada event mendatang.'),
              }}
            >
              <div className="flex flex-col gap-3">
                {upcomingEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 rounded-lg border border-border p-3.5">
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', TONE_CHIP[toneOf('events')])}>
                      <Calendar className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {new Date(e.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        {e.regions?.name ? ` · ${e.regions.name}` : ''}
                      </p>
                    </div>
                    {e.is_paid ? (
                      <Badge variant="outline" className="shrink-0 text-[11px]">{t('Paid', 'Berbayar')}</Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0 text-[11px]">{t('Free', 'Gratis')}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </LoadData>
          </section>
        </div>

        {/* 6 ── The original three reading strands, still fully browsable
            (REST.md Bagian 3/9) — just further down the page now that the
            top handles "what's new" and "where do I go". */}
        <section className="mt-16">
          <div className="mb-6 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-2xl font-semibold">{t('Explore reading', 'Jelajahi Bacaan')}</h2>
          </div>

          <Tabs defaultValue="case-study">
            <TabsList>
              <TabsTrigger value="article">{t('Article', 'Artikel')}</TabsTrigger>
              <TabsTrigger value="case-study">{t('Case Study', 'Studi Kasus')}</TabsTrigger>
              <TabsTrigger value="member">{t('Member writing', 'Tulisan Member')}</TabsTrigger>
            </TabsList>

            <TabsContent value="article" className="mt-8">
              <LoadData
                hideIcon
                response={{
                  isLoading: fetchArticles.isPending,
                  isEmpty: articles.length === 0,
                  emptyTitle: t('No articles published yet.', 'Belum ada artikel yang dipublikasikan.'),
                  emptySubtitle: t(
                    'Platform articles will appear here once the first ones are published.',
                    'Artikel dari platform akan muncul di sini setelah yang pertama dipublikasikan.'
                  ),
                }}
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {articles.map((a) => (
                    <Card key={a.id} className="glass group h-full overflow-hidden transition-all hover:border-primary/40 hover:-translate-y-0.5">
                      {a.cover_image_url && (
                        <div className="relative h-40 overflow-hidden">
                          <img src={a.cover_image_url} alt={a.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        </div>
                      )}
                      <CardContent className="p-6">
                        <h3 className="font-display text-lg font-semibold">{a.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">{a.excerpt}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </LoadData>
            </TabsContent>

            <TabsContent value="case-study" className="mt-8">
              <LoadData
                hideIcon
                response={{
                  isLoading: fetchCaseStudies.isPending,
                  isEmpty: studies.length === 0,
                  emptyTitle: t('No case studies published yet.', 'Belum ada studi kasus yang dipublikasikan.'),
                  emptySubtitle: t(
                    'Real projects with a stated challenge, solution and result will be collected here.',
                    'Proyek nyata dengan tantangan, solusi dan hasil yang jelas akan dikumpulkan di sini.'
                  ),
                }}
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {studies.map((cs) => (
                    <Card key={cs.id} className="glass group h-full overflow-hidden transition-all hover:border-primary/40 hover:-translate-y-0.5">
                      {cs.image_url && (
                        <div className="relative h-40 overflow-hidden">
                          <img src={cs.image_url} alt={cs.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                          {cs.category && <Badge variant="secondary" className="absolute left-3 top-3 backdrop-blur-md">{cs.category}</Badge>}
                        </div>
                      )}
                      <CardContent className="p-6">
                        {!cs.image_url && cs.category && <Badge variant="secondary" className="mb-3">{cs.category}</Badge>}
                        <h3 className="font-display text-lg font-semibold">{cs.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{t('Client', 'Klien')}: {cs.client_name}</p>

                        <div className="mt-4 space-y-3">
                          <div>
                            <div className="text-xs font-semibold text-destructive">{t('Challenge', 'Tantangan')}</div>
                            <p className="mt-1 text-sm text-muted-foreground">{cs.challenge}</p>
                          </div>
                          <div>
                            <div className={`text-xs font-semibold ${TONE_TEXT[toneOf('discover')]}`}>{t('Solution', 'Solusi')}</div>
                            <p className="mt-1 text-sm text-muted-foreground">{cs.solution}</p>
                          </div>
                          <div className="rounded-lg bg-success/10 p-3">
                            <div className="text-xs font-semibold text-success">{t('Result', 'Hasil')}</div>
                            <p className="mt-1 text-sm font-medium text-success">{cs.result}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </LoadData>
            </TabsContent>

            <TabsContent value="member" className="mt-8">
              <LoadData
                hideIcon
                response={{
                  isLoading: fetchDiscussionsFeatured.isPending,
                  isEmpty: featured.length === 0,
                  emptyTitle: t('No member writing yet.', 'Belum ada tulisan member.'),
                  emptySubtitle: t(
                    'Threads worth keeping from Discussions, written up by the members who started them.',
                    'Utas yang layak disimpan dari Discussions, ditulis ulang oleh member yang memulainya.'
                  ),
                }}
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {featured.map((d) => (
                    <Link key={d.id} href={`/discussions/${d.id}`}>
                      <Card className="glass group h-full transition-all hover:border-primary/40 hover:-translate-y-0.5">
                        <CardContent className="p-6">
                          <div className={`text-xs font-semibold ${TONE_TEXT[toneOf('discover')]}`}>
                            {t('Member writing', 'Tulisan Member')}
                          </div>
                          <h3 className="mt-2 font-display text-lg font-semibold">{d.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{d.profiles?.full_name ?? t('Anonymous', 'Anonim')}</p>
                          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground text-pretty">{d.body}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </LoadData>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </AppShell>
  );
}
