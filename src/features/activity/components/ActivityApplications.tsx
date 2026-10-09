'use client';

import Link from 'next/link';

import { useLang } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';

import { ACTIVITY_STATUS_VARIANT } from '@/features/activity/types/activityTypes';
import { ActivityPanel, ActivityRow } from '@/features/activity/components/ActivityPanel';

interface ApplicationItem {
  id: string;
  status: string;
  created_at: string;
  jobs: { id: string; title: string; location: string | null; companies: { name: string } | null } | null;
}

interface Props {
  applications: ApplicationItem[];
  isLoading: boolean;
}

export function ActivityApplications({ applications, isLoading }: Props) {
  const { t } = useLang();

  return (
    <ActivityPanel
      title={t('Job Applications', 'Lamaran Kerja')}
      description={t('Track where each application stands.', 'Pantau status setiap lamaran.')}
      isLoading={isLoading}
      isEmpty={applications.length === 0}
      emptyTitle={t('You have not applied to any jobs yet.', 'Anda belum melamar pekerjaan.')}
    >
      {applications.map((app) => (
        <ActivityRow key={app.id}>
          <div className="min-w-0">
            <Link href={app.jobs ? `/jobs/${app.jobs.id}` : '/jobs'} className="font-medium hover:underline">
              {app.jobs?.title ?? t('Job removed', 'Lowongan dihapus')}
            </Link>
            <p className="text-xs text-muted-foreground">
              {app.jobs?.companies?.name ?? '—'}
              {app.jobs?.location ? ` · ${app.jobs.location}` : ''} · {new Date(app.created_at).toLocaleDateString('id-ID')}
            </p>
          </div>
          <Badge variant={ACTIVITY_STATUS_VARIANT[app.status] ?? 'outline'} className="capitalize">{app.status}</Badge>
        </ActivityRow>
      ))}
    </ActivityPanel>
  );
}
