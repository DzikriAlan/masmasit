'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Heart, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { toneOf } from '@/shared/lib/tones';
import { LoadData } from '@/components/load-data';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, loginHref } from '@/shared/lib/utils';

import { useBuildsControllers } from '@/features/builds/controllers/buildsControllers';

// REST.md Bagian 2/9: work-in-progress feed. Checking "Show in Spotlight"
// is how a post also becomes a Spotlight submission (source_type flips to
// 'solo_builder') — see BuildsPreview copy this replaces: "Graduates to
// Spotlight".
export default function BuildsList() {
  const { user } = useAuth();
  const { t } = useLang();
  const { fetchBuilds, fetchBuildsLiked, storeBuilds, storeBuildsLike, removeBuildsLike } = useBuildsControllers(user?.id);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', link_url: '', spotlight: false });

  const builds = fetchBuilds.data ?? [];
  const likedIds = new Set((fetchBuildsLiked.data ?? []).map((l) => l.build_id));
  const loading = fetchBuilds.isPending;

  const openComposer = () => {
    if (!user) { window.location.href = loginHref(); return; }
    setOpen((v) => !v);
  };

  const submitBuild = async () => {
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
    setForm({ title: '', description: '', link_url: '', spotlight: false });
    setOpen(false);
    toast.success(t('Posted to the feed', 'Diposting ke feed'));
  };

  const toggleLike = (buildId: string) => {
    if (!user) { window.location.href = loginHref(); return; }
    if (likedIds.has(buildId)) removeBuildsLike.mutate(buildId);
    else storeBuildsLike.mutate(buildId);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          tone={toneOf('builds')}
          title={t('Builds', 'Builds')}
          subtitle={t('What everyone is building, while they are still building it.', 'Yang lagi dibangun semua orang, selagi masih dibangun.')}
          action={
            <Button onClick={openComposer}>{t('Share progress', 'Bagikan progres')}</Button>
          }
        />

        {open && (
          <Card className="glass mb-6">
            <CardContent className="space-y-3 p-6">
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={t('What are you building?', 'Apa yang sedang kamu bangun?')} />
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={t('Tell the community where it stands.', 'Ceritakan progresnya ke komunitas.')}
                className="min-h-[80px]"
              />
              <Input value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))} placeholder={t('Link (optional)', 'Tautan (opsional)')} />
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={form.spotlight} onCheckedChange={(v) => setForm((f) => ({ ...f, spotlight: v === true }))} />
                {t('Also show this on Spotlight', 'Tampilkan juga di Spotlight')}
              </label>
              <Button onClick={submitBuild} disabled={storeBuilds.isPending} className="gap-2">
                {storeBuilds.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('Post', 'Posting')}
              </Button>
            </CardContent>
          </Card>
        )}

        <LoadData
          hideIcon
          response={{
            isLoading: loading,
            isEmpty: builds.length === 0,
            emptyTitle: t('Nobody has posted a build yet.', 'Belum ada yang memposting build.'),
          }}
        >
          <div className="divide-y divide-border border-y border-border">
            {builds.map((b) => {
              const initial = (b.profiles?.full_name ?? '?').charAt(0).toUpperCase();
              const liked = likedIds.has(b.id);
              return (
                <div key={b.id} className="flex items-start gap-3 py-5">
                  <Avatar className="h-9 w-9 shrink-0">
                    {b.profiles?.avatar_url && <AvatarImage src={b.profiles.avatar_url} />}
                    <AvatarFallback className="bg-primary/15 text-xs text-primary">{initial}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">{b.profiles?.full_name ?? t('Anonymous', 'Anonim')}</p>
                    <p className="mt-0.5 font-medium text-foreground">{b.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">{b.description}</p>
                    <div className="mt-3 flex items-center gap-4">
                      <button
                        onClick={() => toggleLike(b.id)}
                        className={cn('flex items-center gap-1.5 text-xs font-medium transition-colors', liked ? 'text-destructive' : 'text-muted-foreground hover:text-foreground')}
                      >
                        <Heart className={cn('h-3.5 w-3.5', liked && 'fill-current')} /> {b.likes_count}
                      </button>
                      {b.link_url && (
                        <a href={b.link_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-3.5 w-3.5" /> {t('Link', 'Tautan')}
                        </a>
                      )}
                      {b.promoted_to_spotlight && (
                        <Link href="/spotlight" className="text-xs font-medium text-primary hover:underline">
                          {t('On Spotlight', 'Di Spotlight')}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </LoadData>
      </div>
    </AppShell>
  );
}
