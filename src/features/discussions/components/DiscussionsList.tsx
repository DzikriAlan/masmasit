'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

import type { DataDiscussions } from '@/features/discussions/types/discussionsTypes';
import { useDiscussionsControllers } from '@/features/discussions/controllers/discussionsControllers';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { LoadData } from '@/components/load-data';
import { BrowseToolbar } from '@/components/browse-toolbar';
import { RowSkeleton } from '@/components/card-skeleton';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TONE_CHIP, toneOf } from '@/shared/lib/tones';
import { cn, loginHref } from '@/shared/lib/utils';

// REST.md Bagian 4/9: "forum ringan (topik + komentar)" — deliberately just
// a title, a body, and a reply thread. No sub-forums, no reputation points.
export default function DiscussionsList() {
  const { user } = useAuth();
  const { t } = useLang();
  const { fetchDiscussions, storeDiscussions } = useDiscussionsControllers();

  const [filters, setFilters] = useState({
    search: '',
    filter: { scope: 'all' },
    isComposerOpen: false,
  });
  const [form, setForm] = useState({ title: '', body: '' });

  const data = useMemo(() => {
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

    const getMappedTopic = (topic: DataDiscussions) => ({
      id: topic.id,
      title: topic.title,
      body: topic.body,
      author: topic.profiles?.full_name ?? t('Anonymous', 'Anonim'),
      avatarUrl: topic.profiles?.avatar_url ?? null,
      initial: (topic.profiles?.full_name ?? '?').charAt(0).toUpperCase(),
      replies: topic.discussion_comments?.[0]?.count ?? 0,
      isFeatured: topic.is_featured,
      postedAt: getRelativeTime(topic.created_at),
    });

    const getMatchesFilters = (topic: ReturnType<typeof getMappedTopic>) => {
      const query = filters.search.trim().toLowerCase();
      if (query && !topic.title.toLowerCase().includes(query) && !topic.body.toLowerCase().includes(query)) return false;
      if (filters.filter.scope === 'featured' && !topic.isFeatured) return false;
      return true;
    };

    const list = (fetchDiscussions.data ?? []).map(getMappedTopic).filter(getMatchesFilters);
    const isFiltered = Boolean(filters.search) || filters.filter.scope !== 'all';

    return {
      data: list,
      isLoading: fetchDiscussions.isPending,
      isError: fetchDiscussions.isError,
      isEmpty: !fetchDiscussions.isPending && !fetchDiscussions.isError && list.length === 0,
      errorTitle: t('Could not load topics.', 'Gagal memuat topik.'),
      errorSubtitle: t('Check your connection and try again.', 'Periksa koneksi lalu coba lagi.'),
      emptyTitle: isFiltered
        ? t('No topics match that search.', 'Tidak ada topik yang cocok.')
        : t('No topics yet.', 'Belum ada topik.'),
      emptySubtitle: isFiltered
        ? t('Try different words, or show all topics.', 'Coba kata lain, atau tampilkan semua topik.')
        : t('Ask the first question — someone here has the answer.', 'Ajukan pertanyaan pertama — ada yang tahu jawabannya.'),
    };
  }, [fetchDiscussions.data, fetchDiscussions.isPending, fetchDiscussions.isError, filters, t]);

  const toolbarFilters = useMemo(
    () => [
      {
        key: 'scope',
        label: t('Show', 'Tampilkan'),
        value: filters.filter.scope,
        options: [
          { value: 'all', label: t('All topics', 'Semua topik') },
          { value: 'featured', label: t('Featured only', 'Unggulan saja') },
        ],
      },
    ],
    [filters.filter.scope, t]
  );

  const editDiscussionsSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const editDiscussionsFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, filter: { ...prev.filter, [key]: value } }));
  };

  const clearDiscussionsFilters = () => {
    setFilters((prev) => ({ ...prev, search: '', filter: { scope: 'all' } }));
  };

  const editDiscussionsComposer = () => {
    if (!user) {
      window.location.href = loginHref();
      return;
    }
    setFilters((prev) => ({ ...prev, isComposerOpen: !prev.isComposerOpen }));
  };

  const editDiscussionsForm = (patch: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const clearDiscussionsForm = () => {
    setForm({ title: '', body: '' });
    setFilters((prev) => ({ ...prev, isComposerOpen: false }));
  };

  const submitDiscussions = async () => {
    if (!user) return;

    if (!form.title.trim() || !form.body.trim()) {
      toast.error(t('Please fill in a title and a body', 'Isi judul dan isi topik'));
      return;
    }

    try {
      await storeDiscussions.mutateAsync({ user_id: user.id, title: form.title, body: form.body });
    } catch {
      toast.error(t('Failed to post', 'Gagal memposting'));
      return;
    }

    toast.success(t('Topic posted', 'Topik diposting'));
    clearDiscussionsForm();
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow={t('Ecosystem · Community', 'Ekosistem · Komunitas')}
          tone={toneOf('discussions')}
          title={t('Discussions', 'Diskusi')}
          subtitle={t('A light forum — topics and comments, nothing else.', 'Forum ringan — topik dan komentar, tidak lebih.')}
          action={
            <Button onClick={editDiscussionsComposer}>
              {filters.isComposerOpen ? t('Close', 'Tutup') : t('New topic', 'Topik baru')}
            </Button>
          }
        />

        {filters.isComposerOpen && (
          <Card className="mb-8 border-dashed">
            <CardHeader>
              <CardTitle className="font-display text-xl">{t('Start a topic', 'Mulai topik')}</CardTitle>
              <CardDescription>{t('Be specific — it gets better answers.', 'Spesifik saja — jawabannya jadi lebih bagus.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="topic-title">{t('Title', 'Judul')}</Label>
                <Input
                  id="topic-title"
                  value={form.title}
                  onChange={(event) => editDiscussionsForm({ title: event.target.value })}
                  placeholder={t('e.g. How do you handle Supabase RLS for multi-tenant?', 'mis. Bagaimana handle RLS Supabase untuk multi-tenant?')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic-body">{t('Body', 'Isi')}</Label>
                <Textarea
                  id="topic-body"
                  value={form.body}
                  onChange={(event) => editDiscussionsForm({ body: event.target.value })}
                  placeholder={t('What do you want to ask or say?', 'Apa yang ingin kamu tanyakan atau sampaikan?')}
                  className="min-h-[120px]"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                <Button onClick={submitDiscussions} disabled={storeDiscussions.isPending} className="gap-2">
                  {storeDiscussions.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('Post topic', 'Posting topik')}
                </Button>
                <Button variant="ghost" onClick={clearDiscussionsForm}>{t('Cancel', 'Batal')}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <BrowseToolbar
          searchValue={filters.search}
          searchPlaceholder={t('Search topics…', 'Cari topik…')}
          onEditSearch={editDiscussionsSearch}
          filters={toolbarFilters}
          onEditFilter={editDiscussionsFilter}
          onClearFilters={clearDiscussionsFilters}
        />

        <LoadData hideIcon customLoader response={data}>
          {data.isLoading ? (
            <RowSkeleton count={5} />
          ) : (
            <div className="flex flex-col gap-3">
              {data.data.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/discussions/${topic.id}`}
                  className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/25"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    {topic.avatarUrl && <AvatarImage src={topic.avatarUrl} alt="" />}
                    <AvatarFallback className={TONE_CHIP[toneOf('discussions')]}>{topic.initial}</AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="min-w-0 flex-1 truncate font-semibold group-hover:underline">{topic.title}</p>
                      {topic.isFeatured && (
                        <Badge variant="outline" className={cn('shrink-0 text-[11px]', TONE_CHIP[toneOf('discussions')])}>
                          {t('Featured', 'Unggulan')}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground text-pretty">{topic.body}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="truncate">{topic.author}</span>
                      <span aria-hidden>·</span>
                      <span>{topic.postedAt}</span>
                      <span aria-hidden>·</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {topic.replies} {t('replies', 'balasan')}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </LoadData>
      </div>
    </AppShell>
  );
}
