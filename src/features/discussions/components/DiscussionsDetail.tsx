'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Pencil, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/components/app-shell';
import { LoadData } from '@/components/load-data';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { DeleteConfirmButton } from '@/components/delete-confirm-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, loginHref } from '@/shared/lib/utils';
import { TONE_CHIP, toneOf } from '@/shared/lib/tones';

import type { DataDiscussionsComments } from '@/features/discussions/types/discussionsTypes';
import { useDiscussionsDetailControllers } from '@/features/discussions/controllers/discussionsControllers';
import { DiscussionsReply } from '@/features/discussions/components/DiscussionsReply';

export default function DiscussionsDetail() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id ?? '');
  const { user, roles } = useAuth();
  const { t } = useLang();
  const {
    fetchDiscussionsDetail,
    fetchDiscussionsComments,
    storeDiscussionsComments,
    modifyDiscussions,
    removeDiscussions,
    modifyDiscussionsComments,
    removeDiscussionsComments,
  } = useDiscussionsDetailControllers(id);

  const [reply, setReply] = useState('');
  const [filters, setFilters] = useState({ isEditing: false, title: '', body: '' });

  const discussion = fetchDiscussionsDetail.data;
  const loading = fetchDiscussionsDetail.isPending;

  const data = useMemo(() => {
    const isAdmin = roles.includes('super_admin') || roles.includes('regional_admin');
    const isAuthor = Boolean(user) && discussion?.user_id === user?.id;

    const getMappedReply = (c: DataDiscussionsComments) => ({
      id: c.id,
      author: c.profiles?.full_name ?? t('Anonymous', 'Anonim'),
      avatarUrl: c.profiles?.avatar_url ?? null,
      initial: (c.profiles?.full_name ?? '?').charAt(0).toUpperCase(),
      body: c.body,
      canEdit: c.user_id === user?.id,
      canDelete: Boolean(user) && (c.user_id === user?.id || isAdmin),
    });

    return {
      replies: (fetchDiscussionsComments.data ?? []).map(getMappedReply),
      isAdmin,
      canEdit: isAuthor,
      canDelete: isAuthor || isAdmin,
    };
  }, [fetchDiscussionsComments.data, discussion, user, roles, t]);

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

  const editDiscussionsMode = () => {
    if (!discussion) return;
    setFilters({ isEditing: true, title: discussion.title, body: discussion.body });
  };

  const clearDiscussionsMode = () => setFilters((prev) => ({ ...prev, isEditing: false }));

  const submitDiscussionsEdit = async () => {
    if (!filters.title.trim() || !filters.body.trim()) {
      toast.error(t('Please fill in a title and body', 'Isi judul dan isi topik'));
      return;
    }
    try {
      await modifyDiscussions.mutateAsync({ title: filters.title.trim(), body: filters.body.trim() });
    } catch {
      toast.error(t('Failed to save changes', 'Gagal menyimpan perubahan'));
      return;
    }
    toast.success(t('Topic updated', 'Topik diperbarui'));
    clearDiscussionsMode();
  };

  const clearDiscussions = async () => {
    try {
      await removeDiscussions.mutateAsync();
    } catch {
      toast.error(t('Failed to delete the topic', 'Gagal menghapus topik'));
      return;
    }
    toast.success(t('Topic deleted', 'Topik dihapus'));
    router.push('/discussions');
  };

  const editDiscussionsFeatured = async () => {
    if (!discussion) return;
    const next = !discussion.is_featured;
    try {
      await modifyDiscussions.mutateAsync({ is_featured: next });
    } catch {
      toast.error(t('Failed to update Featured', 'Gagal mengubah status Unggulan'));
      return;
    }
    toast.success(next ? t('Marked as Featured', 'Ditandai Unggulan') : t('Removed from Featured', 'Dilepas dari Unggulan'));
  };

  const editReply = async (commentId: string, body: string) => {
    try {
      await modifyDiscussionsComments.mutateAsync({ commentId, body });
    } catch {
      toast.error(t('Failed to save the reply', 'Gagal menyimpan balasan'));
      return false;
    }
    toast.success(t('Reply updated', 'Balasan diperbarui'));
    return true;
  };

  const clearReply = async (commentId: string) => {
    try {
      await removeDiscussionsComments.mutateAsync(commentId);
    } catch {
      toast.error(t('Failed to delete the reply', 'Gagal menghapus balasan'));
      return;
    }
    toast.success(t('Reply deleted', 'Balasan dihapus'));
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
          {filters.isEditing ? (
            <div className="space-y-3">
              <Input
                value={filters.title}
                onChange={(e) => setFilters((prev) => ({ ...prev, title: e.target.value }))}
                aria-label={t('Title', 'Judul')}
                className="font-display text-lg font-semibold"
              />
              <Textarea
                value={filters.body}
                onChange={(e) => setFilters((prev) => ({ ...prev, body: e.target.value }))}
                aria-label={t('Body', 'Isi')}
                className="min-h-[160px]"
              />
              <div className="flex gap-2">
                <Button onClick={submitDiscussionsEdit} disabled={modifyDiscussions.isPending} className="gap-2">
                  {modifyDiscussions.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('Save', 'Simpan')}
                </Button>
                <Button variant="ghost" onClick={clearDiscussionsMode}>{t('Cancel', 'Batal')}</Button>
              </div>
            </div>
          ) : (
          <>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{discussion.title}</h1>
            {discussion.is_featured && (
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE_CHIP[toneOf('discussions')]}`}>
                {t('Featured', 'Unggulan')}
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Avatar className="h-9 w-9">
              {discussion.profiles?.avatar_url && <AvatarImage src={discussion.profiles.avatar_url} />}
              <AvatarFallback className="bg-primary/15 text-xs text-primary">{(discussion.profiles?.full_name ?? '?').charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground">{discussion.profiles?.full_name ?? t('Anonymous', 'Anonim')}</p>

            {(data.canEdit || data.canDelete || data.isAdmin) && (
              <div className="ml-auto flex flex-wrap items-center gap-1.5">
                {data.isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={editDiscussionsFeatured}
                    disabled={modifyDiscussions.isPending}
                    aria-pressed={discussion.is_featured}
                    className="h-8 gap-1.5"
                  >
                    <Star className={cn('h-3.5 w-3.5', discussion.is_featured && 'fill-current')} />
                    {discussion.is_featured ? t('Unfeature', 'Lepas Unggulan') : t('Feature', 'Jadikan Unggulan')}
                  </Button>
                )}
                {data.canEdit && (
                  <Button size="sm" variant="ghost" onClick={editDiscussionsMode} className="h-8 gap-1.5">
                    <Pencil className="h-3.5 w-3.5" />
                    {t('Edit', 'Ubah')}
                  </Button>
                )}
                {data.canDelete && (
                  <DeleteConfirmButton
                    title={t('Delete this topic?', 'Hapus topik ini?')}
                    description={t('The topic and all its replies will be removed.', 'Topik beserta semua balasannya akan dihapus.')}
                    disabled={removeDiscussions.isPending}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    onClearConfirm={clearDiscussions}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t('Delete', 'Hapus')}
                  </DeleteConfirmButton>
                )}
              </div>
            )}
          </div>

          <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-foreground text-pretty">{discussion.body}</p>
          </>
          )}

          <section className="mt-12">
            <h2 className="eyebrow text-muted-foreground">{data.replies.length} {t('replies', 'balasan')}</h2>
            <div className="mt-4 space-y-5">
              {data.replies.map((c) => (
                <DiscussionsReply
                  key={c.id}
                  item={c}
                  isSaving={modifyDiscussionsComments.isPending}
                  onEditReply={editReply}
                  onClearReply={clearReply}
                />
              ))}
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
