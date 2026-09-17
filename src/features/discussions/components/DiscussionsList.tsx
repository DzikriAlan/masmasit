'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { TONE_CHIP, toneOf } from '@/shared/lib/tones';
import { LoadData } from '@/components/load-data';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { loginHref } from '@/shared/lib/utils';

import { useDiscussionsControllers } from '@/features/discussions/controllers/discussionsControllers';

// REST.md Bagian 4/9: "forum ringan (topik + komentar)" — deliberately just
// a title, a body, and a reply thread. No sub-forums, no reputation points.
export default function DiscussionsList() {
  const { user } = useAuth();
  const { t } = useLang();
  const { fetchDiscussions, storeDiscussions } = useDiscussionsControllers();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });

  const discussions = fetchDiscussions.data ?? [];
  const loading = fetchDiscussions.isPending;

  const openComposer = () => {
    if (!user) { window.location.href = loginHref(); return; }
    setOpen((v) => !v);
  };

  const submitDiscussion = async () => {
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
    setForm({ title: '', body: '' });
    setOpen(false);
    toast.success(t('Topic posted', 'Topik diposting'));
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          tone={toneOf('discussions')}
          title={t('Discussions', 'Diskusi')}
          subtitle={t('A light forum — topics and comments, nothing else.', 'Forum ringan — topik dan komentar, tidak lebih.')}
          action={
            <Button onClick={openComposer}>{t('New topic', 'Topik baru')}</Button>
          }
        />

        {open && (
          <Card className="glass mb-6">
            <CardContent className="space-y-3 p-6">
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={t('Title', 'Judul')}
              />
              <Textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder={t('What do you want to ask or say?', 'Apa yang ingin kamu tanyakan atau sampaikan?')}
                className="min-h-[100px]"
              />
              <Button onClick={submitDiscussion} disabled={storeDiscussions.isPending} className="gap-2">
                {storeDiscussions.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('Post', 'Posting')}
              </Button>
            </CardContent>
          </Card>
        )}

        <LoadData
          hideIcon
          response={{
            isLoading: loading,
            isEmpty: discussions.length === 0,
            emptyTitle: t('No topics yet — start the first one.', 'Belum ada topik — mulai yang pertama.'),
          }}
        >
          <div className="divide-y divide-border border-y border-border">
            {discussions.map((d) => {
              const initial = (d.profiles?.full_name ?? '?').charAt(0).toUpperCase();
              const commentsCount = d.discussion_comments?.[0]?.count ?? 0;
              return (
                <Link key={d.id} href={`/discussions/${d.id}`} className="flex items-start gap-3 py-4 transition-colors hover:bg-muted/40">
                  <Avatar className="h-9 w-9 shrink-0">
                    {d.profiles?.avatar_url && <AvatarImage src={d.profiles.avatar_url} />}
                    <AvatarFallback className="bg-primary/15 text-xs text-primary">{initial}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-foreground">{d.title}</p>
                      {d.is_featured && (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE_CHIP[toneOf('discussions')]}`}>
                          {t('Featured', 'Unggulan')}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {d.profiles?.full_name ?? t('Anonymous', 'Anonim')} · {commentsCount} {t('replies', 'balasan')}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </LoadData>
      </div>
    </AppShell>
  );
}
