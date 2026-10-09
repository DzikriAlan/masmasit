'use client';

import Link from 'next/link';

import { useLang } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { ACTIVITY_STATUS_VARIANT, type DataActivityJobs } from '@/features/activity/types/activityTypes';
import { ActivityPanel, ActivityRow } from '@/features/activity/components/ActivityPanel';

interface Props {
  jobs: DataActivityJobs;
  isLoading: boolean;
  isError: boolean;
}

/** The company's posted jobs with applicant counts. */
export function ActivityJobs({ jobs, isLoading, isError }: Props) {
  const { t } = useLang();
  const isApproved = jobs.company?.approval_status === 'approved';
  const description = jobs.company
    ? `${jobs.company.name} · ${t('Status', 'Status')}: ${jobs.company.approval_status}`
    : t('Register your company to post jobs.', 'Daftarkan perusahaan untuk memasang lowongan.');

  return (
    <ActivityPanel
      title={t('Posted Jobs', 'Lowongan Dipasang')}
      description={description}
      isLoading={isLoading}
      isError={isError}
      isEmpty={jobs.jobs.length === 0}
      emptyTitle={t('No jobs posted yet.', 'Belum ada lowongan dipasang.')}
      action={
        <div className="flex gap-2">
          <Link href="/jobs/post"><Button size="sm" variant="outline">{isApproved ? t('Post a job', 'Pasang lowongan') : t('Company', 'Perusahaan')}</Button></Link>
          {isApproved && <Link href="/jobs/applicants"><Button size="sm">{t('Applicants', 'Pelamar')}</Button></Link>}
        </div>
      }
    >
      {jobs.jobs.map((job) => (
        <ActivityRow key={job.id}>
          <div className="min-w-0">
            <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">{job.title}</Link>
            <p className="text-xs text-muted-foreground">
              {(job.job_applications ?? []).length} {t('applicants', 'pelamar')} · {new Date(job.created_at).toLocaleDateString('id-ID')}
            </p>
          </div>
          <Badge variant={ACTIVITY_STATUS_VARIANT[job.status] ?? 'outline'} className="capitalize">{job.status}</Badge>
        </ActivityRow>
      ))}
    </ActivityPanel>
  );
}
