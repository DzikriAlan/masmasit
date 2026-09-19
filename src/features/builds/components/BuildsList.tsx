'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import type { DataBuilds } from '@/features/builds/types/buildsTypes';
import { useBuildsControllers } from '@/features/builds/controllers/buildsControllers';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { LoadData } from '@/components/load-data';
import { RowSkeleton } from '@/components/card-skeleton';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TONE_CHIP, toneOf } from '@/shared/lib/tones';
import { cn, loginHref } from '@/shared/lib/utils';

const EMPTY_FORM = { title: '', description: '', link_url: '', spotlight: false };

// REST.md Bagian 2/9: work-in-progress feed. Checking "Show in Spotlight"
// is how a post also becomes a Spotlight submission (source_type flips to
// 'solo_builder').
export default function BuildsList() {
  const { user } = useAuth();
  const { t } = useLang();
  const { fetchBuilds, fetchBuildsLiked, storeBuilds, storeBuildsLike, removeBuildsLike } = useBuildsControllers(user?.id);

  const [filters, setFilters] = useState({ isComposerOpen: false });
  const [form, setForm] = useState(EMPTY_FORM);

  const data = useMemo(() => {
    const likedIds = new Set((fetchBuildsLiked.data ?? []).map((like) => like.build_id));

    const getRelativeTime = (iso: string) => {
      const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
      if (minutes < 1) return t('just now', 'baru saja');
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}j`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}h`;
      return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    const getMappedBuild = (build: DataBuilds) => ({
      id: build.id,
      title: build.title,
      description: build.description,
      linkUrl: build.link_url,
      author: build.profiles?.full_name ?? t('Anonymous', 'Anonim'),
      avatarUrl: build.profiles?.avatar_url ?? null,
      initial: (build.profiles?.full_name ?? '?').charAt(0).toUpperCase(),
      likes: build.likes_count,
      isLiked: likedIds.has(build.id),
      isOnSpotlight: build.promoted_to_spotlight,
      postedAt: getRelativeTime(build.created_at),
    });

    const list = (fetchBuilds.data ?? []).map(getMappedBuild);

    return {
      data: list,
      isLoading: fetchBuilds.isPending,
      isError: fetchBuilds.isError,
      isEmpty: !fetchBuilds.isPending && !fetchBuilds.isError && list.length === 0,
      errorTitle: t('Could not load the feed.', 'Gagal memuat feed.'),
      errorSubtitle: t('Check your connection and try again.', 'Periksa koneksi lalu coba lagi.'),
      emptyTitle: t('Nobody has posted a build yet.', 'Belum ada yang memposting build.'),
      emptySubtitle: t(
        'Share what you are working on — unfinished is the point.',
        'Bagikan yang sedang kamu kerjakan — belum selesai justru intinya.'
      ),
    };
  }, [fetchBuilds.data, fetchBuilds.isPending, fetchBuilds.isError, fetchBuildsLiked.data, t]);

  const editBuildsComposer = () => {
    if (!user) {
      window.location.href = loginHref();
      return;
    }
    setFilters((prev) => ({ ...prev, isComposerOpen: !prev.isComposerOpen }));
  };

  const editBuildsForm = (patch: Partial<typeof EMPTY_FORM>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const clearBuildsForm = () => {
    setForm(EMPTY_FORM);
    setFilters((prev) => ({ ...prev, isComposerOpen: false }));
  };

  const editBuildsLike = (buildId: string, isLiked: boolean) => {
    if (!user) {
      window.location.href = loginHref();
      return;
    }
    if (isLiked) removeBuildsLike.mutate(buildId);
    else storeBuildsLike.mutate(buildId);
  };

  const submitBuilds = async () => {
    if (!user) return;

    if (!form.title.trim() || !form.description.trim()) {
      toast.error(t('Please fill in a title and description', 'Isi judul dan deskripsi'));
      return;
    }

    try {
      await storeBuilds.mutateAsync({
        user_id: user.id,
        title: form.title,
        description: form.description,
        link_url: form.link_url || null,
        promoted_to_spotlight: form.spotlight,
      });
    } catch {
      toast.error(t('Failed to post', 'Gagal memposting'));
      return;
    }

    toast.success(t('Posted to the feed', 'Diposting ke feed'));
    clearBuildsForm();
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={t('Ecosystem · Community', 'Ekosistem · Komunitas')}
          tone={toneOf('builds')}
          title={t('Builds', 'Builds')}
          subtitle={t(
            'What everyone is building, while they are still building it.',
            'Yang lagi dibangun semua orang, selagi masih dibangun.'
          )}
          action={
            <Button onClick={editBuildsComposer}>
              {filters.isComposerOpen ? t('Close', 'Tutup') : t('Share progress', 'Bagikan progres')}
            </Button>
          }
        />

        {filters.isComposerOpen && (
          <Card className="mb-8 border-dashed">
            <CardHeader>
              <CardTitle className="font-display text-xl">{t('Share progress', 'Bagikan progres')}</CardTitle>
              <CardDescription>
                {t('A work in progress counts — that is the whole feed.', 'Yang belum kelar pun boleh — memang itu isi feed-nya.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="build-title">{t('What are you building?', 'Apa yang sedang kamu bangun?')}</Label>
                <Input
                  id="build-title"
                  value={form.title}
                  onChange={(event) => editBuildsForm({ title: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="build-description">{t('Where does it stand?', 'Sudah sampai mana?')}</Label>
                <Textarea
                  id="build-description"
                  value={form.description}
                  onChange={(event) => editBuildsForm({ description: event.target.value })}
                  className="min-h-[96px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="build-link">{t('Link (optional)', 'Tautan (opsional)')}</Label>
                <Input
                  id="build-link"
                  value={form.link_url}
                  onChange={(event) => editBuildsForm({ link_url: event.target.value })}
                  placeholder="https://"
                />
              </div>
              <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Checkbox
                  checked={form.spotlight}
                  onCheckedChange={(value) => editBuildsForm({ spotlight: value === true })}
                />
                {t('Also show this on Spotlight', 'Tampilkan juga di Spotlight')}
              </label>
              <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                <Button onClick={submitBuilds} disabled={storeBuilds.isPending} className="gap-2">
                  {storeBuilds.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('Post', 'Posting')}
                </Button>
                <Button variant="ghost" onClick={clearBuildsForm}>{t('Cancel', 'Batal')}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <LoadData hideIcon customLoader response={data}>
          {data.isLoading ? (
            <RowSkeleton count={4} />
          ) : (
            <div className="flex flex-col gap-4">
              {data.data.map((build) => (
                <article key={build.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      {build.avatarUrl && <AvatarImage src={build.avatarUrl} alt="" />}
                      <AvatarFallback className={TONE_CHIP[toneOf('builds')]}>{build.initial}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                        <span className="truncate font-medium text-foreground">{build.author}</span>
                        <span aria-hidden>·</span>
                        <span>{build.postedAt}</span>
                      </p>
                      <h3 className="mt-1 font-semibold leading-snug">{build.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">{build.description}</p>

                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        <button
                          type="button"
                          onClick={() => editBuildsLike(build.id, build.isLiked)}
                          aria-pressed={build.isLiked}
                          className={cn(
                            'flex items-center gap-1.5 text-xs font-medium transition-colors',
                            build.isLiked ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <Heart className={cn('h-3.5 w-3.5', build.isLiked && 'fill-current')} />
                          {build.likes}
                        </button>

                        {build.linkUrl && (
                          <a
                            href={build.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {t('Link', 'Tautan')}
                          </a>
                        )}

                        {build.isOnSpotlight && (
                          <Link href="/spotlight" className="text-xs font-medium text-foreground hover:underline">
                            {t('On Spotlight', 'Di Spotlight')}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </LoadData>
      </div>
    </AppShell>
  );
}
