'use client';

import { useMemo, useState } from 'react';
import { Search, ExternalLink } from 'lucide-react';

import { LoadData } from '@/components/load-data';
import { useLang } from '@/components/language-provider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { MobileFilterDrawer, MobileFilterField } from '@/components/mobile-filter-drawer';
import { TONE_CHIP, toneOf } from '@/shared/lib/tones';

import { useExternalJobsControllers } from '@/features/external-jobs/controllers/externalJobsControllers';
import type { ExternalJobRole } from '@/features/external-jobs/types/externalJobsTypes';

// Remotive's own logo URLs (remotive.com/job/<id>/logo) sit behind a
// Cloudflare bot challenge that 403s any hotlinked <img> request, so they
// never render. `company_domain` — the company's own site, pulled server-side
// out of the job's description (see externalJobsService.ts) — drives a
// favicon lookup instead; onError (no domain found, or the lookup itself
// fails) falls back to a plain initial.
function CompanyLogo({ name, domain, toneClass }: Readonly<{ name: string; domain: string | null; toneClass: string }>) {
  const [failed, setFailed] = useState(false);
  const showFavicon = domain && !failed;
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md ${toneClass}`}>
      {showFavicon ? (
        <img
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
          alt=""
          className="h-5 w-5 object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-xs font-semibold">{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

// Mirrors the real job card's shape (logo + title/subtitle, badge row, tag
// row, footer line) so the grid doesn't visibly reflow once data arrives.
function ExternalJobCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border p-5">
      <div className="flex items-start gap-2.5">
        <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="mt-3 flex flex-wrap gap-1 border-t border-border/60 pt-3">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-8" />
      </div>
      <Skeleton className="mt-auto h-3 w-24 pt-3" />
    </div>
  );
}

const roleLabels: Record<ExternalJobRole, { en: string; id: string }> = {
  backend: { en: 'Backend', id: 'Backend' },
  frontend: { en: 'Frontend', id: 'Frontend' },
  fullstack: { en: 'Full Stack', id: 'Full Stack' },
  mobile: { en: 'Mobile', id: 'Mobile' },
  devops: { en: 'DevOps', id: 'DevOps' },
  data: { en: 'Data', id: 'Data' },
  software: { en: 'Software', id: 'Software' },
};

/**
 * Real remote engineer/developer listings, fetched live on every page load
 * (via /api/v1/external-jobs → Remotive's public API, cached ~1h server
 * side — see server/jobs/externalJobsService.ts) rather than stored in our
 * own database. Search and the country/role filters narrow the one fetched
 * batch client-side; applying leaves the site for the original posting.
 */
// Remotive's `location` is often several regions in one string, e.g.
// "LATAM, Europe, USA, Canada, APAC" — split so the filter dropdown lists
// individual countries/regions and a job matches on any one of them, instead
// of the dropdown showing that whole run-on string as a single option.
const splitLocations = (location: string): string[] =>
  location.split(',').map((s) => s.trim()).filter(Boolean);

export default function ExternalJobsList() {
  const { t } = useLang();
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('all');
  const [role, setRole] = useState('all');
  const { fetchExternalJobs } = useExternalJobsControllers();

  const allJobs = fetchExternalJobs.data ?? [];

  const countries = useMemo(
    () => Array.from(new Set(allJobs.flatMap((j) => splitLocations(j.location)))).sort((a, b) => a.localeCompare(b)),
    [allJobs]
  );

  const jobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allJobs.filter((job) => {
      if (country !== 'all' && !splitLocations(job.location).includes(country)) return false;
      if (role !== 'all' && job.role_category !== role) return false;
      if (q && !job.title.toLowerCase().includes(q) && !job.company_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allJobs, search, country, role]);

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        {t(
          'Fetched live from Remotive — applying takes you to the original posting.',
          'Diambil langsung dari Remotive — melamar akan membawamu ke postingan aslinya.'
        )}
      </p>

      {/* Search always shows; the country/role selects ride inline from sm up,
          and collapse into a bottom-sheet triggered by a Filter button below sm. */}
      <div className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Search title or company...', 'Cari judul atau perusahaan...')}
              className="pl-9"
            />
          </div>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="hidden sm:flex sm:w-52"><SelectValue placeholder={t('Country', 'Negara')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All countries', 'Semua negara')}</SelectItem>
              {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="hidden sm:flex sm:w-44"><SelectValue placeholder={t('Role', 'Peran')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All roles', 'Semua peran')}</SelectItem>
              {(Object.keys(roleLabels) as ExternalJobRole[]).map((r) => (
                <SelectItem key={r} value={r}>{t(roleLabels[r].en, roleLabels[r].id)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <MobileFilterDrawer
          triggerLabel={t('Filter', 'Filter')}
          title={t('Filter your search', 'Filter pencarianmu')}
          applyLabel={t('Show results', 'Tampilkan hasil')}
          activeCount={(country !== 'all' ? 1 : 0) + (role !== 'all' ? 1 : 0)}
        >
          <MobileFilterField label={t('Country', 'Negara')}>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger><SelectValue placeholder={t('Country', 'Negara')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All countries', 'Semua negara')}</SelectItem>
                {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </MobileFilterField>
          <MobileFilterField label={t('Role', 'Peran')}>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue placeholder={t('Role', 'Peran')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All roles', 'Semua peran')}</SelectItem>
                {(Object.keys(roleLabels) as ExternalJobRole[]).map((r) => (
                  <SelectItem key={r} value={r}>{t(roleLabels[r].en, roleLabels[r].id)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </MobileFilterField>
        </MobileFilterDrawer>
      </div>

      <LoadData
        className="mt-6"
        hideIcon
        customLoader
        response={{
          isLoading: fetchExternalJobs.isPending,
          isError: fetchExternalJobs.isError,
          isEmpty: jobs.length === 0,
          errorTitle: t('Could not load jobs right now.', 'Gagal memuat lowongan saat ini.'),
          errorSubtitle: t('Remotive may be briefly unavailable — try again shortly.', 'Remotive mungkin sedang tidak tersedia — coba lagi sebentar lagi.'),
          emptyTitle: t('No matching jobs found.', 'Tidak ada lowongan yang cocok.'),
          emptySubtitle: t('Try a different search or filter.', 'Coba pencarian atau filter lain.'),
        }}
      >
        {fetchExternalJobs.isPending ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <ExternalJobCardSkeleton key={i} />)}
          </div>
        ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <a
              key={job.id}
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="group flex h-full min-w-0 flex-col rounded-xl border border-border p-5 transition-colors hover:border-foreground/30 hover:bg-muted/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <CompanyLogo name={job.company_name} domain={job.company_domain} toneClass={TONE_CHIP[toneOf('external-jobs')]} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{job.title}</p>
                    <p className="truncate text-sm text-muted-foreground">{job.company_name}</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="outline" className={`text-xs capitalize ${TONE_CHIP[toneOf('external-jobs')]}`}>
                  {t(roleLabels[job.role_category].en, roleLabels[job.role_category].id)}
                </Badge>
                {splitLocations(job.location).map((loc) => (
                  <Badge key={loc} variant="outline" className="text-xs">
                    {loc}
                  </Badge>
                ))}
                {job.salary && <Badge variant="outline" className="text-xs">{job.salary}</Badge>}
              </div>

              {job.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1 border-t border-border/60 pt-3">
                  {job.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{tag}</span>
                  ))}
                </div>
              )}

              <p className="mt-auto pt-3 text-xs text-muted-foreground/70">
                {t('via Remotive', 'via Remotive')} · {new Date(job.published_at).toLocaleDateString('id-ID')}
              </p>
            </a>
          ))}
        </div>
        )}
      </LoadData>
    </div>
  );
}
