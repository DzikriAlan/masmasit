'use client';

import Link from 'next/link';

import { useLang } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';

import { ACTIVITY_STATUS_VARIANT, type DataActivityTeams } from '@/features/activity/types/activityTypes';
import { ActivityPanel, ActivityRow } from '@/features/activity/components/ActivityPanel';

interface Props {
  teams: DataActivityTeams;
  isLoading: boolean;
  isError: boolean;
}

/** Teams owned / joined and the member's Team Collabs listings. */
export function ActivityTeams({ teams, isLoading, isError }: Props) {
  const { t } = useLang();
  const teamCount = teams.owned.length + teams.joined.length;

  return (
    <div className="space-y-6">
      <ActivityPanel
        title={t('Your Teams', 'Tim Anda')}
        isLoading={isLoading}
        isError={isError}
        isEmpty={teamCount === 0}
        emptyTitle={t('You are not in a team yet.', 'Anda belum tergabung di tim.')}
      >
        {teams.owned.map((team) => (
          <ActivityRow key={`own-${team.id}`}>
            <Link href={`/team-builder/${team.id}`} className="font-medium hover:underline">{team.name}</Link>
            <Badge variant="default">{t('Owner', 'Pemilik')}</Badge>
          </ActivityRow>
        ))}
        {teams.joined.map((m) => (
          <ActivityRow key={`member-${m.id}`}>
            <Link href={m.teams ? `/team-builder/${m.teams.id}` : '/team-builder'} className="font-medium hover:underline">
              {m.teams?.name ?? t('Team removed', 'Tim dihapus')}
            </Link>
            <Badge variant="secondary">{m.role_title}</Badge>
          </ActivityRow>
        ))}
      </ActivityPanel>

      {teams.collabs.length > 0 && (
        <ActivityPanel
          title={t('Team Collabs Listings', 'Listing Team Collabs')}
          isLoading={false}
          isEmpty={false}
          emptyTitle=""
        >
          {teams.collabs.map((c) => (
            <ActivityRow key={c.id}>
              <div className="min-w-0">
                <Link href="/team-collabs" className="font-medium hover:underline">{c.focus}</Link>
                <p className="text-xs text-muted-foreground">
                  {c.teams?.name ?? '—'} · {new Date(c.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
              <Badge variant={ACTIVITY_STATUS_VARIANT[c.status] ?? 'outline'} className="capitalize">{c.status}</Badge>
            </ActivityRow>
          ))}
        </ActivityPanel>
      )}
    </div>
  );
}
