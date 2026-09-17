'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/components/app-shell';
import { LoadData } from '@/components/load-data';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { loginHref } from '@/shared/lib/utils';
import { TONE_CHIP, toneOf } from '@/shared/lib/tones';

import { useDiscussionsDetailControllers } from '@/features/discussions/controllers/discussionsControllers';

export default function DiscussionsDetail() {
  const params = useParams();
  const id = String(params.id ?? '');
  const { user } = useAuth();
  const { t } = useLang();
  const { fetchDiscussionsDetail, fetchDiscussionsComments, storeDiscussionsComments } = useDiscussionsDetailControllers(id);

  const [reply, setReply] = useState('');

  const discussion = fetchDiscussionsDetail.data;
  const comments = fetchDiscussionsComments.data ?? [];
  const loading = fetchDiscussionsDetail.isPending;

  const submitReply = async () => {
    if (!user) { window.location.href = loginHref(); return; }
    if (!reply.trim()) return;
    try {
      await storeDiscussionsComments.mutateAsync({ discussion_id: id, user_id: user.id, body: reply });
    } catch {
      toast.error(t('Failed to reply', 'Gagal membalas'));
      return;
    }
    setReply('');
  };

  return (
    <AppShell>
              <LoadData
          minHeight="60vh"
          className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8"
          hideIcon
          response={{
            isLoading: loading,
            isEmpty: !discussion,
            emptyTitle: t('Discussion not found.', 'Diskusi tidak ditemukan.'),
          }}
        >
          {/* Guarded here, not just by LoadData above — this component's own
              render pass constructs these children regardless of what
              LoadData ends up showing, so a bare `discussion.title` would
              throw on the very first render while it is still loading. */}
          {discussion && (
          <>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{discussion.title}</h1>
            {discussion.is_featured && (
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE_CHIP[toneOf('discussions')]}`}>
                {t('Featured', 'Unggulan')}
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Avatar className="h-9 w-9">
              {discussion.profiles?.avatar_url && <AvatarImage src={discussion.profiles.avatar_url} />}
              <AvatarFallback className="bg-primary/15 text-xs text-primary">{(discussion.profiles?.full_name ?? '?').charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground">{discussion.profiles?.full_name ?? t('Anonymous', 'Anonim')}</p>
          </div>

          <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-foreground text-pretty">{discussion.body}</p>

          <section className="mt-12">
            <h2 className="eyebrow text-muted-foreground">{comments.length} {t('replies', 'balasan')}</h2>
            <div className="mt-4 space-y-5">
              {comments.map((c) => {
                const ci = (c.profiles?.full_name ?? '?').charAt(0).toUpperCase();
                return (
                  <div key={c.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      {c.profiles?.avatar_url && <AvatarImage src={c.profiles.avatar_url} />}
                      <AvatarFallback className="bg-muted text-xs">{ci}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 rounded-lg border border-border/60 p-3">
                      <p className="text-xs font-medium text-muted-foreground">{c.profiles?.full_name ?? t('Anonymous', 'Anonim')}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground text-pretty">{c.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 space-y-2">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={t('Write a reply...', 'Tulis balasan...')}
                className="min-h-[80px]"
              />
              <Button onClick={submitReply} disabled={storeDiscussionsComments.isPending} className="gap-2">
                {storeDiscussionsComments.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('Reply', 'Balas')}
              </Button>
            </div>
          </section>
          </>
          )}
        </LoadData>
    </AppShell>
  );
}
