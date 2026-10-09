'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Heart } from 'lucide-react';

import type { DataSpotlightDetail } from '@/features/spotlight/types/spotlightDetailTypes';
import { useSpotlightDetailControllers } from '@/features/spotlight/controllers/spotlightDetailControllers';
import { AppShell } from '@/components/app-shell';
import { LoadData } from '@/components/load-data';
import { useLang } from '@/components/language-provider';
import { ShareButton } from '@/components/share-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TONE_CHIP, toneOf } from '@/shared/lib/tones';
import { cn } from '@/shared/lib/utils';

export default function SpotlightDetail() {
  const params = useParams();
  const router = useRouter();
  const { t, lang } = useLang();
  const { fetchSpotlightDetail } = useSpotlightDetailControllers(params.id as string | undefined);

  const data = useMemo(() => {
    const getSourceLabel = (source: DataSpotlightDetail['source_type']) => {
      if (source === 'agency') return t('Agency', 'Agency');
      if (source === 'solo_builder') return t('Solo builder', 'Solo builder');
      return t('From Builds', 'Dari Builds');
    };
    const getImages = (item: DataSpotlightDetail) => {
      const many = (item.image_urls ?? []).filter(Boolean);
      if (many.length) return many;
      return item.image_url ? [item.image_url] : [];
    };

    const item = fetchSpotlightDetail.data ?? null;
    const detail = item
      ? {
          id: item.id,
          title: item.title,
          description: item.description,
          linkUrl: item.link_url,
          likes: item.likes_count,
          images: getImages(item),
          sourceLabel: getSourceLabel(item.source_type),
          maker: item.agencies?.name ?? item.profiles?.full_name ?? t('A member', 'Seorang member'),
          makerHref: item.agencies?.slug ? `/agency/${item.agencies.slug}` : null,
          date: new Date(item.created_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
        }
      : null;

    return {
      data: detail,
      isLoading: fetchSpotlightDetail.isPending && Boolean(params.id),
      isError: fetchSpotlightDetail.isError,
      isEmpty: !fetchSpotlightDetail.isPending && !detail,
      errorTitle: t('Could not load this entry.', 'Gagal memuat entri ini.'),
      emptyTitle: t('Spotlight entry not found.', 'Entri Spotlight tidak ditemukan.'),
      emptySubtitle: t('It may have been removed from Spotlight.', 'Mungkin sudah diturunkan dari Spotlight.'),
    };
  }, [fetchSpotlightDetail.data, fetchSpotlightDetail.isPending, fetchSpotlightDetail.isError, params.id, t, lang]);

  if (!data.data) {
    return (
      <AppShell>
        <LoadData minHeight="60vh" response={data} />
      </AppShell>
    );
  }

  const item = data.data;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={() => router.push('/spotlight')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> {t('Spotlight', 'Spotlight')}
          </Button>
          <ShareButton
            url={`/spotlight/${item.id}`}
            title={`${item.title} — ${item.maker}`}
            text={t('Spotted on MasmasIT Spotlight', 'Tampil di Spotlight MasmasIT')}
          />
        </div>

        <Card className="glass">
          <CardContent className="space-y-5 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn('text-[11px]', TONE_CHIP[toneOf('spotlight')])}>
                {item.sourceLabel}
              </Badge>
              <span className="text-xs text-muted-foreground">{item.date}</span>
            </div>

            <div>
              <h1 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">{item.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('by', 'oleh')}{' '}
                {item.makerHref ? (
                  <Link href={item.makerHref} className="font-medium text-foreground hover:underline">{item.maker}</Link>
                ) : (
                  <span className="font-medium text-foreground">{item.maker}</span>
                )}
              </p>
            </div>

            {item.images.length > 0 && (
              <div className={cn('grid gap-3', item.images.length > 1 && 'sm:grid-cols-2')}>
                {item.images.map((url) => (
                  <img key={url} src={url} alt="" className="w-full rounded-lg border border-border/60 object-cover" />
                ))}
              </div>
            )}

            <p className="whitespace-pre-wrap text-sm leading-relaxed">{item.description}</p>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Heart className="h-3.5 w-3.5" /> {item.likes}
              </span>
              {item.linkUrl && (
                <a href={item.linkUrl} target="_blank" rel="noreferrer">
                  <Button className="gap-2">
                    {t('Visit', 'Kunjungi')} <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
