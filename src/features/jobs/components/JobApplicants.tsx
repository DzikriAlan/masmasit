'use client';

import { useState } from 'react';
import { Loader2, Users, Briefcase, Check, X, Eye, MapPin, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { usePostJobControllers, useJobsEmployerControllers } from '@/features/jobs/controllers/jobsControllers';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'outline',
  reviewing: 'secondary',
  accepted: 'default',
  rejected: 'destructive',
};

export default function JobApplicants() {
  const { user } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [openLetterId, setOpenLetterId] = useState<string | null>(null);

  const { fetchJobsCompany } = usePostJobControllers(user?.id);
  const company = fetchJobsCompany.data ?? null;

  const { fetchJobsOwned, fetchJobsApplicants, changeJobsApplicationStatus, changeJobsStatus } =
    useJobsEmployerControllers(company?.id, selectedJobId);

  const jobs = fetchJobsOwned.data ?? [];
  const applicants = fetchJobsApplicants.data ?? [];
  const loading = fetchJobsCompany.isPending || fetchJobsOwned.isPending;
  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;

  const modifyApplicationStatus = async (applicationId: string, status: string) => {
    try {
      await changeJobsApplicationStatus.mutateAsync({ applicationId, status });
    } catch {
      toast.error(t('Failed to update application', 'Gagal memperbarui lamaran'));
      return;
    }
    toast.success(t('Application updated', 'Lamaran diperbarui'));
  };

  const modifyJobStatus = async (jobId: string, status: string) => {
    try {
      await changeJobsStatus.mutateAsync({ jobId, status });
    } catch {
      toast.error(t('Failed to update job', 'Gagal memperbarui lowongan'));
      return;
    }
    toast.success(status === 'closed' ? t('Job closed', 'Lowongan ditutup') : t('Job reopened', 'Lowongan dibuka'));
  };

  if (loading) {
    return <AppShell><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppShell>;
  }

  if (!company) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <Briefcase className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold">{t('No company yet', 'Belum ada perusahaan')}</h1>
          <p className="mt-2 text-muted-foreground">
            {t('Register a company before you can post jobs and review applicants.', 'Daftarkan perusahaan sebelum dapat memasang lowongan dan meninjau pelamar.')}
          </p>
          <Button onClick={() => router.push('/jobs/post')} className="mt-6">
            {t('Register Company', 'Daftarkan Perusahaan')}
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> {t('Back', 'Kembali')}
        </Button>

        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">{t('Applicants', 'Pelamar')}</h1>
          <p className="mt-1 text-muted-foreground">{company.name}</p>
        </div>

        {jobs.length === 0 ? (
          <Card className="glass">
            <CardContent className="py-16 text-center text-muted-foreground">
              <Briefcase className="mx-auto mb-3 h-10 w-10 opacity-50" />
              <p>{t('You have not posted any jobs yet.', 'Anda belum memasang lowongan.')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-[320px_1fr]">
            <div className="space-y-3">
              {jobs.map((job) => (
                <Card
                  key={job.id}
                  className={`glass cursor-pointer transition-all hover:border-primary/40 ${selectedJobId === job.id ? 'border-primary/60' : ''}`}
                  onClick={() => setSelectedJobId(job.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{job.title}</p>
                      <Badge variant={job.status === 'open' ? 'default' : 'secondary'} className="text-xs capitalize">
                        {job.status}
                      </Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" /> {job.job_applications.length} {t('applicants', 'pelamar')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="glass">
              {!selectedJob ? (
                <CardContent className="py-20 text-center text-muted-foreground">
                  <p className="text-sm">{t('Select a job to see its applicants.', 'Pilih lowongan untuk melihat pelamarnya.')}</p>
                </CardContent>
              ) : (
                <>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle>{selectedJob.title}</CardTitle>
                      <CardDescription>{applicants.length} {t('applicants', 'pelamar')}</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => modifyJobStatus(selectedJob.id, selectedJob.status === 'open' ? 'closed' : 'open')}
                    >
                      {selectedJob.status === 'open' ? t('Close job', 'Tutup lowongan') : t('Reopen job', 'Buka lagi')}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {fetchJobsApplicants.isPending ? (
                      <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : applicants.length === 0 ? (
                      <p className="py-10 text-center text-sm text-muted-foreground">
                        {t('No applicants yet.', 'Belum ada pelamar.')}
                      </p>
                    ) : (
                      applicants.map((app) => (
                        <div key={app.id} className="rounded-lg border border-border/60 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{app.profiles?.full_name ?? t('Anonymous', 'Anonim')}</p>
                              {app.profiles?.location && (
                                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" /> {app.profiles.location}
                                </p>
                              )}
                            </div>
                            <Badge variant={STATUS_VARIANT[app.status] ?? 'outline'} className="capitalize">
                              {app.status}
                            </Badge>
                          </div>

                          {app.cover_letter && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="mt-2 gap-1 px-0"
                                onClick={() => setOpenLetterId(openLetterId === app.id ? null : app.id)}
                              >
                                <Eye className="h-3.5 w-3.5" /> {t('Cover letter', 'Surat lamaran')}
                              </Button>
                              {openLetterId === app.id && (
                                <p className="mt-2 whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm">
                                  {app.cover_letter}
                                </p>
                              )}
                            </>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => modifyApplicationStatus(app.id, 'reviewing')} className="gap-1">
                              {t('Reviewing', 'Ditinjau')}
                            </Button>
                            <Button size="sm" onClick={() => modifyApplicationStatus(app.id, 'accepted')} className="gap-1">
                              <Check className="h-3.5 w-3.5" /> {t('Accept', 'Terima')}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => modifyApplicationStatus(app.id, 'rejected')} className="gap-1">
                              <X className="h-3.5 w-3.5" /> {t('Reject', 'Tolak')}
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </>
              )}
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
