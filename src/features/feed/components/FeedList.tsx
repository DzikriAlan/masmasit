'use client';

import { useMemo, useState } from 'react';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { LoadData } from '@/components/load-data';
import { RowSkeleton } from '@/components/card-skeleton';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { TONE_CHIP, toneOf } from '@/shared/lib/tones';
import { cn } from '@/shared/lib/utils';

import type { FeedKind } from '@/features/feed/types/feedTypes';
import { useFeedControllers } from '@/features/feed/controllers/feedControllers';
import { FeedItem, useFeedLabels } from '@/features/feed/components/FeedItem';

const KINDS: FeedKind[] = ['job', 'project', 'build', 'event'];

/**
 * Public activity feed (TC-10-06): what is happening across MasmasIT, open
 * to guests. Distinct from /activity, which is a member's own history.
 */
export default function FeedList() {
  const { t } = useLang();
  const { kinds, area } = useFeedLabels();
  const { fetchFeed, payloadGetFeed, setGetFeed } = useFeedControllers();

  const [filters, setFilters] = useState({ filter: { kind: 'all' as FeedKind | 'all' } });

  const data = useMemo(() => {
    const all = fetchFeed.data ?? [];
    const list = filters.filter.kind === 'all' ? all : all.filter((item) => item.kind === filters.filter.kind);

    return {
      data: list,
      isLoading: fetchFeed.isPending,
      isError: fetchFeed.isError,
      isEmpty: !fetchFeed.isPending && !fetchFeed.isError && list.length === 0,
      canLoadMore: all.length >= payloadGetFeed.limit && payloadGetFeed.limit < 200,
      errorTitle: t('Could not load the feed.', 'Gagal memuat feed.'),
      errorSubtitle: t('Check your connection and try again.', 'Periksa koneksi lalu coba lagi.'),
      emptyTitle: t('Nothing here yet.', 'Belum ada aktivitas.'),
      emptySubtitle: t('New jobs, projects, builds and events will show up here.', 'Lowongan, proyek, build, dan event baru akan muncul di sini.'),
    };
  }, [fetchFeed.data, fetchFeed.isPending, fetchFeed.isError, filters, payloadGetFeed.limit, t]);

  const editFeedKind = (kind: FeedKind | 'all') => setFilters((prev) => ({ ...prev, filter: { ...prev.filter, kind } }));
  const loadFeedMore = () => setGetFeed({ limit: payloadGetFeed.limit + 40 });

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={t('Live activity', 'Aktivitas terkini')}
          title={t('Happening on MasmasIT', 'Yang sedang terjadi di MasmasIT')}
          subtitle={t(
            'New jobs, client projects, member builds and events — newest first.',
            'Lowongan, proyek klien, build member, dan event terbaru — paling baru di atas.'
          )}
        />

        <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => editFeedKind('all')}
            className={cn(
              'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              filters.filter.kind === 'all' ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/40'
            )}
          >
            {t('All', 'Semua')}
          </button>
          {KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => editFeedKind(kind)}
              className={cn(
                'shrink-0 rounded-full border border-transparent px-4 py-1.5 text-sm font-medium transition-colors',
                TONE_CHIP[toneOf(area[kind])],
                filters.filter.kind === kind && 'border-current'
              )}
            >
              {kinds[kind]}
            </button>
          ))}
        </div>

        <LoadData hideIcon customLoader response={data}>
          {data.isLoading ? (
            <RowSkeleton count={6} />
          ) : (
            <div className="flex flex-col gap-3">
              {data.data.map((item) => (
                <FeedItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </LoadData>

        {data.canLoadMore && !data.isLoading && (
          <div className="mt-6 flex justify-center">
            <Button variant="outline" onClick={loadFeedMore} disabled={fetchFeed.isFetching}>
              {t('Load more', 'Muat lebih banyak')}
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
