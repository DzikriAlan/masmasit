'use client';

import Link from 'next/link';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { toneOf } from '@/shared/lib/tones';
import { LoadData } from '@/components/load-data';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { MatchedBadge, MatchedHandoff } from '@/components/matched-handoff';

import { useTeamCollabsControllers } from '@/features/team-collabs/controllers/teamCollabsControllers';

// REST.md Bagian 6.2/7: teams registered to build R&D together. "Matched"
// is a distinct status from an instant booking — see MatchedHandoff, the
// same component Projects uses for an accepted bid.
export default function TeamCollabsList() {
  const { user } = useAuth();
  const { t } = useLang();
  const { fetchTeamCollabs, changeTeamCollabsWithdraw } = useTeamCollabsControllers();

  const listings = fetchTeamCollabs.data ?? [];
  const loading = fetchTeamCollabs.isPending;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          tone={toneOf('team-collabs')}
          title={t('Team Collabs', 'Team Collabs')}
          subtitle={t('Teams looking for teams, to build R&D together.', 'Tim mencari tim, untuk bangun R&D bareng.')}
          action={
            <Link href="/team-builder">
              <Button variant="outline">{t('Build a team first', 'Bentuk tim dulu')}</Button>
            </Link>
          }
        />

        <LoadData
          hideIcon
          response={{
            isLoading: loading,
            isEmpty: listings.length === 0,
            emptyTitle: t('No teams registered yet.', 'Belum ada tim yang mendaftar.'),
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => {
              const isOwner = l.created_by === user?.id;
              return (
                <div key={l.id} className="flex h-full flex-col rounded-xl border border-border p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold">{l.focus}</p>
                    {l.status === 'matched' ? (
                      <MatchedBadge />
                    ) : l.status === 'closed' ? (
                      <span className="text-xs font-medium text-muted-foreground">{t('Withdrawn', 'Ditarik')}</span>
                    ) : (
                      <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">{t('Open', 'Terbuka')}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{l.teams?.name ?? t('A team', 'Sebuah tim')}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{l.description}</p>

                  {l.status === 'matched' && isOwner && (
                    <MatchedHandoff subject={l.focus} className="mt-4" />
                  )}
                  {l.status === 'open' && isOwner && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => changeTeamCollabsWithdraw.mutate(l.id)}
                      disabled={changeTeamCollabsWithdraw.isPending}
                    >
                      {t('Withdraw', 'Tarik listing')}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </LoadData>
      </div>
    </AppShell>
  );
}
