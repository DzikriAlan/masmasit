'use client';

import { useEffect, useState } from 'react';
import { Search, Briefcase, MapPin, Loader2, Building2, Clock, Wallet } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import type { JobWithCompany } from '@/features/jobs/types/jobsTypes';
import { getUserSkills, getJobs } from '@/features/jobs/services/jobsServices';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { calcMatchScore, matchScoreColor } from '@/shared/lib/match-score';

export default function JobsPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [userSkills, setUserSkills] = useState<{ skill_id: string; level: string }[]>([]);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (user) {
      getUserSkills(user.id).then(({ data }) => {
        setUserSkills((data as { skill_id: string; level: string }[]) ?? []);
      });
    }
  }, [user]);

  const loadJobs = async () => {
    setLoading(true);
    const { data } = await getJobs(search, typeFilter, locationFilter);
    setJobs((data as JobWithCompany[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(loadJobs, 300);
    return () => clearTimeout(timeout);
  }, [search, typeFilter, locationFilter]);

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
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">{t('Job Portal', 'Lowongan Pekerjaan')}</h1>
            <p className="mt-1 text-muted-foreground">{t('Discover opportunities from verified Indonesian tech companies — from startups to enterprises.', 'Temukan peluang dari perusahaan tech terverifikasi di Indonesia — dari startup hingga enterprise.')}</p>
          </div>
          <Link href="/jobs/post">
            <Button variant="outline" className="gap-2"><Building2 className="h-4 w-4" /> {t('Register Company', 'Daftar Perusahaan')}</Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={t('Search jobs...', 'Cari lowongan...')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger><SelectValue placeholder={t('Job Type', 'Tipe Pekerjaan')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All Types', 'Semua Tipe')}</SelectItem>
              {jobTypes.map((jt) => <SelectItem key={jt} value={jt} className="capitalize">{jt}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger><SelectValue placeholder={t('Location', 'Lokasi')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All Locations', 'Semua Lokasi')}</SelectItem>
              {locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : jobs.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <Briefcase className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p>{t('No jobs found. Check back soon!', 'Belum ada lowongan. Cek lagi nanti!')}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="glass group h-full transition-all hover:border-primary/40 hover:-translate-y-0.5">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        {job.companies?.logo_url ? (
                          <img src={job.companies.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="truncate font-semibold">{job.title}</h3>
                        <p className="text-sm text-muted-foreground">{job.companies?.name ?? t('Unknown company', 'Perusahaan tidak diketahui')}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="capitalize text-xs">{job.job_type.replace('-', ' ')}</Badge>
                      {job.location && <Badge variant="outline" className="gap-1 text-xs"><MapPin className="h-3 w-3" /> {job.location}</Badge>}
                    </div>
                    {formatSalary(job.salary_min, job.salary_max) && (
                      <p className="mt-2 flex items-center gap-1 text-sm text-success">
                        <Wallet className="h-3.5 w-3.5" /> {formatSalary(job.salary_min, job.salary_max)}
                      </p>
                    )}
                    {job.deadline && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {t('Deadline', 'Tenggat')}: {new Date(job.deadline).toLocaleDateString('id-ID')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
