'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TONE_CHIP, toneOf } from '@/shared/lib/tones';

import type { DataFeed, FeedKind } from '@/features/feed/types/feedTypes';

const AREA: Record<FeedKind, string> = { job: 'jobs', project: 'projects', build: 'builds', event: 'events' };

/** Wording shared by the homepage strip and /feed, so both read the same. */
export const useFeedLabels = () => {
  const { t } = useLang();

  const verbs: Record<FeedKind, string> = {
    job: t('posted a job', 'memposting lowongan'),
    project: t('opened a project', 'membuka proyek'),
    build: t('shared a build', 'membagikan build'),
    event: t('announced an event', 'mengumumkan event'),
  };

  const fallbackActors: Record<FeedKind, string> = {
    job: t('A company', 'Sebuah perusahaan'),
    project: t('A client', 'Seorang klien'),
    build: t('A member', 'Seorang member'),
    event: t('MasmasIT', 'MasmasIT'),
  };

  const kinds: Record<FeedKind, string> = {
    job: t('Jobs', 'Lowongan'),
    project: t('Projects', 'Proyek'),
    build: t('Builds', 'Builds'),
    event: t('Events', 'Event'),
  };

  const getRelativeTime = (iso: string) => {
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
    if (minutes < 1) return t('just now', 'baru saja');
    if (minutes < 60) return t(`${minutes}m`, `${minutes} mnt`);
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t(`${hours}h`, `${hours} jam`);
    const days = Math.floor(hours / 24);
    if (days < 7) return t(`${days}d`, `${days} hari`);
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return { verbs, fallbackActors, kinds, getRelativeTime, area: AREA };
};

/** One activity row on /feed. */
export function FeedItem({ item }: Readonly<{ item: DataFeed }>) {
  const { verbs, fallbackActors, kinds, getRelativeTime } = useFeedLabels();
  const actor = item.actor ?? fallbackActors[item.kind];
  const tone = TONE_CHIP[toneOf(AREA[item.kind])];

  return (
    <Link
      href={item.href}
      className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/25"
    >
      <Avatar className="h-10 w-10 shrink-0">
        {item.avatarUrl && <AvatarImage src={item.avatarUrl} alt="" />}
        <AvatarFallback className={tone}>{actor.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug text-muted-foreground">
          <span className="font-medium text-foreground">{actor}</span> {verbs[item.kind]}{' '}
          <span className="font-medium text-foreground">{item.title}</span>
        </p>
        <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{kinds[item.kind]}</span>
          <span className="tnum">{getRelativeTime(item.created_at)}</span>
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
