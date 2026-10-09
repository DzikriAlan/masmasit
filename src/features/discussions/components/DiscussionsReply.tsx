'use client';

import { useState } from 'react';
import { Loader2, Pencil, Trash2 } from 'lucide-react';

import { useLang } from '@/components/language-provider';
import { DeleteConfirmButton } from '@/components/delete-confirm-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export interface DiscussionsReplyItem {
  id: string;
  author: string;
  avatarUrl: string | null;
  initial: string;
  body: string;
  canEdit: boolean;
  canDelete: boolean;
}

interface Props {
  item: DiscussionsReplyItem;
  isSaving: boolean;
  onEditReply: (id: string, body: string) => Promise<boolean>;
  onClearReply: (id: string) => void;
}

/** One reply in a thread; its author can edit it in place or delete it. */
export function DiscussionsReply({ item, isSaving, onEditReply, onClearReply }: Props) {
  const { t } = useLang();
  const [filters, setFilters] = useState({ isEditing: false, draft: item.body });

  const editReplyMode = () => setFilters({ isEditing: true, draft: item.body });
  const clearReplyMode = () => setFilters({ isEditing: false, draft: item.body });
  const submitReplyEdit = async () => {
    if (!filters.draft.trim()) return;
    const saved = await onEditReply(item.id, filters.draft.trim());
    if (saved) setFilters((prev) => ({ ...prev, isEditing: false }));
  };

  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        {item.avatarUrl && <AvatarImage src={item.avatarUrl} />}
        <AvatarFallback className="bg-muted text-xs">{item.initial}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 rounded-lg border border-border/60 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-medium text-muted-foreground">{item.author}</p>
          {!filters.isEditing && (item.canEdit || item.canDelete) && (
            <div className="flex shrink-0 items-center gap-1">
              {item.canEdit && (
                <button
                  type="button"
                  onClick={editReplyMode}
                  aria-label={t('Edit reply', 'Ubah balasan')}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {item.canDelete && (
                <DeleteConfirmButton
                  title={t('Delete this reply?', 'Hapus balasan ini?')}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                  onClearConfirm={() => onClearReply(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">{t('Delete reply', 'Hapus balasan')}</span>
                </DeleteConfirmButton>
              )}
            </div>
          )}
        </div>

        {filters.isEditing ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={filters.draft}
              onChange={(e) => setFilters((prev) => ({ ...prev, draft: e.target.value }))}
              className="min-h-[72px]"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={submitReplyEdit} disabled={isSaving} className="gap-2">
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {t('Save', 'Simpan')}
              </Button>
              <Button size="sm" variant="ghost" onClick={clearReplyMode}>{t('Cancel', 'Batal')}</Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground text-pretty">{item.body}</p>
        )}
      </div>
    </div>
  );
}
