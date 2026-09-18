'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { TONE_CHIP, TONE_TEXT, toneOf } from '@/shared/lib/tones';
import { LoadData } from '@/components/load-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExternalJobsList from '@/features/external-jobs/components/ExternalJobsList';
import type { DataJobs } from '@/features/jobs/types/jobsTypes';
import { useJobsControllers } from '@/features/jobs/controllers/jobsControllers';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MobileFilterDrawer, MobileFilterField } from '@/components/mobile-filter-drawer';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { calcMatchScore, matchScoreColor } from '@/shared/lib/match-score';

// Mirrors the real job card's shape (logo + title/subtitle, badge row,
// salary line) so the grid doesn't visibly reflow once data arrives.
function JobCardSkeleton() {
  return (
    <Card className="glass h-full">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="mt-3 h-4 w-24" />
      </CardContent>
    </Card>
  );
}

export default function JobsList() {
  const { t } = useLang();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const { fetchJobs, fetchJobsUserSkills, setGetJobs } = useJobsControllers(user?.id);

  const jobs: DataJobs[] = fetchJobs.data ?? [];
  const userSkills = fetchJobsUserSkills.data ?? [];
  const loading = fetchJobs.isPending;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setGetJobs({ search, typeFilter, locationFilter });
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, typeFilter, locationFilter, setGetJobs]);

  const jobTypes = ['full-time', 'part-time', 'contract', 'internship', 'remote'];
  const locations = ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Medan', 'Makassar', 'Bali', 'Remote'];

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `Rp ${(min / 1000000).toFixed(0)}-${(max / 1000000).toFixed(0)}M`;
    if (min) return `Rp ${(min / 1000000).toFixed(0)}M+`;
    return `Up to Rp ${(max! / 1000000).toFixed(0)}M`;
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* One header row, same shape as every other browse page (title
            left, actions right) — the MasmasIT/web tab switcher rides
            along on the right instead of adding its own full-width row, so
            the filters below start at the same height as Projects/Courses/
            etc. regardless of which page you land on. */}
        <Tabs defaultValue="masmasit">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className={`font-display text-3xl font-semibold ${TONE_TEXT[toneOf('jobs')]}`}>{t('Job Portal', 'Lowongan Pekerjaan')}</h1>
              <p className="mt-1 text-muted-foreground">{t('Discover opportunities from verified Indonesian tech companies — from startups to enterprises.', 'Temukan peluang dari perusahaan tech terverifikasi di Indonesia — dari startup hingga enterprise.')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <TabsList>
                <TabsTrigger value="masmasit">{t('Posted on MasmasIT', 'Diposting di MasmasIT')}</TabsTrigger>
                <TabsTrigger value="external">{t('From around the web', 'Dari seluruh web')}</TabsTrigger>
              </TabsList>
              <Link href="/jobs/post">
                <Button variant="outline">{t('Register Company', 'Daftar Perusahaan')}</Button>
              </Link>
            </div>
          </div>

          <TabsContent value="masmasit">
        {/* Filters: search always shows; Job Type/Location ride inline from sm
            up, and collapse into a bottom-sheet triggered by a Filter button
            below sm. */}
        <div className="mb-6 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={t('Search jobs...', 'Cari lowongan...')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="hidden sm:flex"><SelectValue placeholder={t('Job Type', 'Tipe Pekerjaan')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All Types', 'Semua Tipe')}</SelectItem>
                {jobTypes.map((jt) => <SelectItem key={jt} value={jt} className="capitalize">{jt}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="hidden sm:flex"><SelectValue placeholder={t('Location', 'Lokasi')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All Locations', 'Semua Lokasi')}</SelectItem>
                {locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <MobileFilterDrawer
            triggerLabel={t('Filter', 'Filter')}
            title={t('Filter your search', 'Filter pencarianmu')}
            applyLabel={t('Refine Jobs', 'Perbarui Lowongan')}
            activeCount={(typeFilter !== 'all' ? 1 : 0) + (locationFilter !== 'all' ? 1 : 0)}
          >
            <MobileFilterField label={t('Job Type', 'Tipe Pekerjaan')}>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue placeholder={t('Job Type', 'Tipe Pekerjaan')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All Types', 'Semua Tipe')}</SelectItem>
                  {jobTypes.map((jt) => <SelectItem key={jt} value={jt} className="capitalize">{jt}</SelectItem>)}
                </SelectContent>
              </Select>
            </MobileFilterField>
            <MobileFilterField label={t('Location', 'Lokasi')}>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger><SelectValue placeholder={t('Location', 'Lokasi')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All Locations', 'Semua Lokasi')}</SelectItem>
                  {locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </MobileFilterField>
          </MobileFilterDrawer>
        </div>

        <LoadData
          hideIcon
          customLoader
          response={{
            isLoading: loading,
            isEmpty: jobs.length === 0,
            emptyTitle: t('No jobs found. Check back soon!', 'Belum ada lowongan. Cek lagi nanti!'),
          }}
        >
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="glass group h-full transition-all hover:border-primary/40 hover:-translate-y-0.5">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${TONE_CHIP[toneOf('jobs')]}`}>
                        {job.companies?.logo_url ? (
                          <img src={job.companies.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <span className="text-sm font-semibold">{(job.companies?.name ?? '?').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="truncate font-semibold">{job.title}</h3>
                        <p className="text-sm text-muted-foreground">{job.companies?.name ?? t('Unknown company', 'Perusahaan tidak diketahui')}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="capitalize text-xs">{job.job_type.replace('-', ' ')}</Badge>
                      {job.location && <Badge variant="outline" className="text-xs">{job.location}</Badge>}
                    </div>
                    {formatSalary(job.salary_min, job.salary_max) && (
                      <p className="mt-2 text-sm text-success">
                        {formatSalary(job.salary_min, job.salary_max)}
                      </p>
                    )}
                    {job.deadline && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('Deadline', 'Tenggat')}: {new Date(job.deadline).toLocaleDateString('id-ID')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          )}
        </LoadData>
          </TabsContent>

          <TabsContent value="external">
            <ExternalJobsList />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
