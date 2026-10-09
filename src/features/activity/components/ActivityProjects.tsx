'use client';

import Link from 'next/link';

import { useLang } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';

import { ACTIVITY_STATUS_VARIANT, type DataActivityProjects } from '@/features/activity/types/activityTypes';
import { ActivityPanel, ActivityRow } from '@/features/activity/components/ActivityPanel';

interface Props {
  projects: DataActivityProjects;
  isLoading: boolean;
  isError: boolean;
}

/** Projects posted and bids placed (TC-03-10). */
export function ActivityProjects({ projects, isLoading, isError }: Props) {
  const { t } = useLang();

  return (
    <div className="space-y-6">
      <ActivityPanel
        title={t('Projects You Posted', 'Proyek yang Anda Pasang')}
        isLoading={isLoading}
        isError={isError}
        isEmpty={projects.posted.length === 0}
        emptyTitle={t('You have not posted a project.', 'Anda belum memasang proyek.')}
      >
        {projects.posted.map((p) => (
          <ActivityRow key={p.id}>
            <div className="min-w-0">
              <Link href={`/projects/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
              <p className="text-xs text-muted-foreground">
                {(p.project_bids ?? []).length} {t('bids', 'bid')} · {new Date(p.created_at).toLocaleDateString('id-ID')}
              </p>
            </div>
            <Badge variant={ACTIVITY_STATUS_VARIANT[p.status] ?? 'outline'} className="capitalize">{p.status.replace('_', ' ')}</Badge>
          </ActivityRow>
        ))}
      </ActivityPanel>

      <ActivityPanel
        title={t('Your Bids', 'Bid Anda')}
        isLoading={isLoading}
        isError={isError}
        isEmpty={projects.bids.length === 0}
        emptyTitle={t('You have not bid on a project.', 'Anda belum mengajukan bid.')}
      >
        {projects.bids.map((b) => (
          <ActivityRow key={b.id}>
            <div className="min-w-0">
              <Link href={b.projects ? `/projects/${b.projects.id}` : '/projects'} className="font-medium hover:underline">
                {b.projects?.title ?? t('Project removed', 'Proyek dihapus')}
              </Link>
              <p className="text-xs text-muted-foreground">
                Rp {b.amount.toLocaleString('id-ID')} · {new Date(b.created_at).toLocaleDateString('id-ID')}
              </p>
            </div>
            <Badge variant={ACTIVITY_STATUS_VARIANT[b.status] ?? 'outline'} className="capitalize">{b.status}</Badge>
          </ActivityRow>
        ))}
      </ActivityPanel>
    </div>
  );
}
