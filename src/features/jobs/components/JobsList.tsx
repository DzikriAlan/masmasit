'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import type { DataJobs } from '@/features/jobs/types/jobsTypes';
import { useJobsControllers } from '@/features/jobs/controllers/jobsControllers';
import { JobsCard } from '@/features/jobs/components/JobsCard';
import ExternalJobsList from '@/features/external-jobs/components/ExternalJobsList';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { LoadData } from '@/components/load-data';
import { BrowseToolbar } from '@/components/browse-toolbar';
import { CardGridSkeleton } from '@/components/card-skeleton';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toneOf } from '@/shared/lib/tones';

const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'remote'];
const LOCATIONS = ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Medan', 'Makassar', 'Bali', 'Remote'];

export default function JobsList() {
  const { t } = useLang();
  const { user } = useAuth();
  const { fetchJobs, setGetJobs } = useJobsControllers(user?.id);

  const [filters, setFilters] = useState({
    search: '',
    filter: { jobType: 'all', location: 'all' },
  });

  const data = useMemo(() => {
    const getSalary = (min: number | null, max: number | null) => {
      if (!min && !max) return t('Salary undisclosed', 'Gaji tidak disebutkan');
      if (min && max) return `Rp ${(min / 1000000).toFixed(0)}-${(max / 1000000).toFixed(0)} jt`;
      if (min) return `Rp ${(min / 1000000).toFixed(0)} jt+`;
      return `${t('Up to', 'Hingga')} Rp ${((max as number) / 1000000).toFixed(0)} jt`;
    };

    const getDeadline = (deadline: string | null) =>
      deadline ? `${t('Closes', 'Tutup')} ${new Date(deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}` : null;

    const getMappedJob = (job: DataJobs) => ({
      id: job.id,
      title: job.title,
      companyName: job.companies?.name ?? t('Unknown company', 'Perusahaan tidak diketahui'),
      companyLogo: job.companies?.logo_url ?? null,
      jobType: job.job_type.replace('-', ' '),
      location: job.location,
      salary: getSalary(job.salary_min, job.salary_max),
      deadline: getDeadline(job.deadline),
    });

    const list = (fetchJobs.data ?? []).map(getMappedJob);
    const isFiltered = Boolean(filters.search) || filters.filter.jobType !== 'all' || filters.filter.location !== 'all';

    return {
      data: list,
      isLoading: fetchJobs.isPending,
      isError: fetchJobs.isError,
      isEmpty: !fetchJobs.isPending && !fetchJobs.isError && list.length === 0,
      errorTitle: t('Could not load jobs.', 'Gagal memuat lowongan.'),
      errorSubtitle: t('Check your connection and try again.', 'Periksa koneksi lalu coba lagi.'),
      emptyTitle: isFiltered
        ? t('No jobs match these filters.', 'Tidak ada lowongan yang cocok.')
        : t('No roles posted yet.', 'Belum ada lowongan yang dipasang.'),
      emptySubtitle: isFiltered
        ? t('Try a broader search, or clear the filters.', 'Coba kata kunci lain, atau hapus filternya.')
        : t('Companies post here first — check back soon.', 'Perusahaan memasang di sini lebih dulu — cek lagi nanti.'),
      isFiltered,
    };
  }, [fetchJobs.data, fetchJobs.isPending, fetchJobs.isError, filters, t]);

  const toolbarFilters = useMemo(
    () => [
      {
        key: 'jobType',
        label: t('Job type', 'Tipe pekerjaan'),
        value: filters.filter.jobType,
        options: [
          { value: 'all', label: t('All types', 'Semua tipe') },
          ...JOB_TYPES.map((type) => ({ value: type, label: type.replace('-', ' ') })),
        ],
      },
      {
        key: 'location',
        label: t('Location', 'Lokasi'),
        value: filters.filter.location,
        options: [
          { value: 'all', label: t('All locations', 'Semua lokasi') },
          ...LOCATIONS.map((location) => ({ value: location, label: location })),
        ],
      },
    ],
    [filters.filter, t]
  );

  const editJobsSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const editJobsFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, filter: { ...prev.filter, [key]: value } }));
  };

  const clearJobsFilters = () => {
    setFilters({ search: '', filter: { jobType: 'all', location: 'all' } });
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setGetJobs({
        search: filters.search,
        typeFilter: filters.filter.jobType,
        locationFilter: filters.filter.location,
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [filters, setGetJobs]);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={t('Product · Work', 'Product · Kerja')}
          tone={toneOf('jobs')}
          title={t('Job Portal', 'Lowongan Pekerjaan')}
          subtitle={t(
            'Roles from verified Indonesian tech companies, plus remote roles from around the web.',
            'Lowongan dari perusahaan tech terverifikasi di Indonesia, plus peran remote dari seluruh web.'
          )}
          action={
            <Link href="/jobs/post">
              <Button variant="outline">{t('Register company', 'Daftar perusahaan')}</Button>
            </Link>
          }
        />

        <Tabs defaultValue="masmasit">
          <TabsList className="mb-6">
            <TabsTrigger value="masmasit">{t('Posted on MasmasIT', 'Diposting di MasmasIT')}</TabsTrigger>
            <TabsTrigger value="external">{t('From around the web', 'Dari seluruh web')}</TabsTrigger>
          </TabsList>

          <TabsContent value="masmasit">
            <BrowseToolbar
              searchValue={filters.search}
              searchPlaceholder={t('Search roles or companies…', 'Cari posisi atau perusahaan…')}
              onEditSearch={editJobsSearch}
              filters={toolbarFilters}
              onEditFilter={editJobsFilter}
              onClearFilters={clearJobsFilters}
            />

            <LoadData hideIcon customLoader response={data}>
              {data.isLoading ? (
                <CardGridSkeleton count={6} chips={2} lines={1} />
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {data.data.map((job) => (
                    <JobsCard key={job.id} job={job} />
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
