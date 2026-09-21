'use client';

import { useMemo } from 'react';
import Link from 'next/link';

import type { DataTeamCollabs } from '@/features/team-collabs/types/teamCollabsTypes';
import { useTeamCollabsControllers } from '@/features/team-collabs/controllers/teamCollabsControllers';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { LoadData } from '@/components/load-data';
import { CardGridSkeleton } from '@/components/card-skeleton';
import { MatchedBadge, MatchedHandoff } from '@/components/matched-handoff';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { signedOutState } from '@/shared/lib/browse-gate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TONE_CHIP, toneOf } from '@/shared/lib/tones';

// REST.md Bagian 6.2/7: teams registered to build R&D together. "Matched"
// is a distinct status from an instant booking — see MatchedHandoff, the
// same component Projects uses for an accepted bid.
export default function TeamCollabsList() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLang();
  const { fetchTeamCollabs, changeTeamCollabsWithdraw } = useTeamCollabsControllers();

  const data = useMemo(() => {
    const getMappedListing = (listing: DataTeamCollabs) => ({
      id: listing.id,
      focus: listing.focus,
      description: listing.description,
      status: listing.status,
      teamName: listing.teams?.name ?? t('A team', 'Sebuah tim'),
      initial: (listing.teams?.name ?? '?').charAt(0).toUpperCase(),
      isOwner: listing.created_by === user?.id,
    });

    const list = (fetchTeamCollabs.data ?? []).map(getMappedListing);

    return {
      data: list,
      isLoading: fetchTeamCollabs.isPending,
      isError: fetchTeamCollabs.isError,
      ...signedOutState(!authLoading && !user, t, t('collabs', 'kolaborasi')),
      isEmpty: !fetchTeamCollabs.isPending && !fetchTeamCollabs.isError && list.length === 0,
      errorTitle: t('Could not load listings.', 'Gagal memuat listing.'),
      errorSubtitle: t('Check your connection and try again.', 'Periksa koneksi lalu coba lagi.'),
      emptyTitle: t('No teams registered yet.', 'Belum ada tim yang mendaftar.'),
      emptySubtitle: t(
        'Build a team first, then list it here to find another team to build with.',
        'Bentuk tim dulu, lalu daftarkan di sini untuk cari tim lain.'
      ),
    };
  }, [fetchTeamCollabs.data, fetchTeamCollabs.isPending, fetchTeamCollabs.isError, user?.id, t, user, authLoading]);

  const clearTeamCollabs = (id: string) => {
    changeTeamCollabsWithdraw.mutate(id);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={t('Product · Build', 'Product · Bangun')}
          tone={toneOf('team-collabs')}
          title={t('Team Collabs', 'Team Collabs')}
          subtitle={t(
            'Teams looking for teams, to build R&D together. A match is handed over on WhatsApp within 1×24 hours.',
            'Tim mencari tim, untuk bangun R&D bareng. Match diteruskan lewat WhatsApp dalam 1×24 jam.'
          )}
          action={
            <Link href="/team-builder">
              <Button variant="outline">{t('Build a team first', 'Bentuk tim dulu')}</Button>
            </Link>
          }
        />

        <LoadData hideIcon customLoader response={data}>
          {data.isLoading ? (
            <CardGridSkeleton count={6} chips={1} lines={2} />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((listing) => (
                <div key={listing.id} className="flex h-full min-w-0 flex-col rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${TONE_CHIP[toneOf('team-collabs')]}`}>
                      {listing.initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 font-semibold leading-snug">{listing.focus}</h3>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">{listing.teamName}</p>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                    {listing.description}
                  </p>

                  <div className="mt-auto pt-4">
                    {listing.status === 'matched' && <MatchedBadge />}
                    {listing.status === 'closed' && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        {t('Withdrawn', 'Ditarik')}
                      </Badge>
                    )}
                    {listing.status === 'open' && (
                      <Badge variant="outline" className="text-xs">{t('Open', 'Terbuka')}</Badge>
                    )}

                    {listing.status === 'matched' && listing.isOwner && (
                      <MatchedHandoff subject={listing.focus} className="mt-3" />
                    )}
                    {listing.status === 'open' && listing.isOwner && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => clearTeamCollabs(listing.id)}
                        disabled={changeTeamCollabsWithdraw.isPending}
                      >
                        {t('Withdraw listing', 'Tarik listing')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </LoadData>
      </div>
    </AppShell>
  );
}
