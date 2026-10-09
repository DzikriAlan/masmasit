'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { LoadData } from '@/components/load-data';
import { useLang } from '@/components/language-provider';
import { TONE_CHIP, toneOf } from '@/shared/lib/tones';
import { cn } from '@/shared/lib/utils';

import { useArticlesDetailControllers } from '@/features/articles/controllers/articlesControllers';

interface Props {
  slug: string;
}

/** A platform article in full: cover, title, publish date, body (TC-10-03). */
export default function ArticlesDetail({ slug }: Props) {
  const { t, lang } = useLang();
  const { fetchArticlesDetail } = useArticlesDetailControllers(slug);

  const data = useMemo(() => {
    const article = fetchArticlesDetail.data ?? null;
    const getPublishedDate = (iso: string) =>
      new Date(iso).toLocaleDateString(lang === 'en' ? 'en-GB' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    return {
      data: article,
      publishedAt: article ? getPublishedDate(article.created_at) : '',
      isLoading: fetchArticlesDetail.isPending,
      isError: fetchArticlesDetail.isError,
      isEmpty: !fetchArticlesDetail.isPending && !fetchArticlesDetail.isError && !article,
      errorTitle: t('Could not load this article.', 'Gagal memuat artikel ini.'),
      emptyTitle: t('Article not found.', 'Artikel tidak ditemukan.'),
      emptySubtitle: t('It may have been unpublished or moved.', 'Mungkin sudah tidak dipublikasikan atau dipindahkan.'),
    };
  }, [fetchArticlesDetail.data, fetchArticlesDetail.isPending, fetchArticlesDetail.isError, t, lang]);

  return (
    <AppShell>
      <LoadData minHeight="60vh" className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8" hideIcon response={data}>
        {data.data && (
          <article>
            <Link href="/discover" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              {t('Back to Discover', 'Kembali ke Discover')}
            </Link>

            <span className={cn('mt-6 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold', TONE_CHIP[toneOf('discover')])}>
              {t('Article', 'Artikel')}
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-balance sm:text-4xl">
              {data.data.title}
            </h1>
            <time dateTime={data.data.created_at} className="mt-3 block text-sm text-muted-foreground">
              {data.publishedAt}
            </time>

            {data.data.cover_image_url && (
              <img
                src={data.data.cover_image_url}
                alt={data.data.title}
                className="mt-8 aspect-[16/9] w-full rounded-xl border border-border object-cover"
              />
            )}

            {data.data.excerpt && (
              <p className="mt-8 text-lg leading-relaxed text-muted-foreground text-pretty">{data.data.excerpt}</p>
            )}
            <div className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-foreground text-pretty">
              {data.data.body}
            </div>
          </article>
        )}
      </LoadData>
    </AppShell>
  );
}
