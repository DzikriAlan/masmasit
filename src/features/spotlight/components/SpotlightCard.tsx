import Link from 'next/link';
import { ArrowUpRight, Heart, Pencil, Trash2 } from 'lucide-react';
import { ShareButton } from '@/components/share-button';

import { DeleteConfirmButton } from '@/components/delete-confirm-button';
import { Badge } from '@/components/ui/badge';
import { TONE_CHIP, toneOf } from '@/shared/lib/tones';
import { cn } from '@/shared/lib/utils';

export interface SpotlightCardItem {
  id: string;
  title: string;
  description: string;
  maker: string;
  sourceLabel: string;
  likes: number;
  linkUrl: string | null;
  isHot: boolean;
  isLiked?: boolean;
  isOwner?: boolean;
  /** Spotlight rows that came from Builds are taken off the shelf, not deleted. */
  isFromBuilds?: boolean;
  href?: string;
}

export interface SpotlightCardLabels {
  like: string;
  edit: string;
  delete: string;
  deleteTitle: string;
  deleteDescription: string;
}

/**
 * A shipped thing, credited to whoever shipped it. Rank is the point of
 * Spotlight, so the "Hot" marker sits inline in the header rather than
 * floating over a corner where it clips. The like button and the owner's
 * actions are real buttons, so the card itself is no longer one big link —
 * only the title (detail) and "Visit" (external) navigate.
 */
export function SpotlightCard({
  item,
  hotLabel,
  visitLabel,
  labels,
  onEditLike,
  onEditItem,
  onClearItem,
}: Readonly<{
  item: SpotlightCardItem;
  hotLabel: string;
  visitLabel: string;
  labels?: SpotlightCardLabels;
  onEditLike?: (item: SpotlightCardItem) => void;
  onEditItem?: (item: SpotlightCardItem) => void;
  onClearItem?: (item: SpotlightCardItem) => void;
}>) {
  const canManage = Boolean(item.isOwner && labels && (onEditItem || onClearItem));

  return (
    <div className="group flex h-full min-w-0 flex-col rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-[var(--shadow-card-hover)]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={cn('text-[11px]', TONE_CHIP[toneOf('spotlight')])}>
          {item.sourceLabel}
        </Badge>
        {item.isHot && (
          <Badge className="bg-orange-500 text-[11px] text-white hover:bg-orange-500">{hotLabel}</Badge>
        )}
      </div>

      <h3 className="mt-3 line-clamp-2 font-display text-lg font-semibold leading-snug">
        {item.href ? <Link href={item.href} className="hover:underline">{item.title}</Link> : item.title}
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{item.maker}</p>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground text-pretty">{item.description}</p>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-4">
        {onEditLike ? (
          <button
            type="button"
            onClick={() => onEditLike(item)}
            aria-pressed={Boolean(item.isLiked)}
            aria-label={labels?.like}
            className={cn(
              'flex items-center gap-1.5 text-sm font-medium transition-colors',
              item.isLiked ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Heart className={cn('h-3.5 w-3.5', item.isLiked && 'fill-current')} />
            {item.likes}
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Heart className="h-3.5 w-3.5" />
            {item.likes}
          </span>
        )}

        <div className="flex items-center gap-1">
          {canManage && labels && onEditItem && (
            <button
              type="button"
              onClick={() => onEditItem(item)}
              className="flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
              {labels.edit}
            </button>
          )}
          {canManage && labels && onClearItem && (
            <DeleteConfirmButton
              title={labels.deleteTitle}
              description={labels.deleteDescription}
              className="flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-destructive"
              onClearConfirm={() => onClearItem(item)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {labels.delete}
            </DeleteConfirmButton>
          )}
          <ShareButton compact url={`/spotlight/${item.id}`} title={`${item.title} — MasmasIT Spotlight`} />
          {item.linkUrl && (
            <a
              href={item.linkUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-1 flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
            >
              {visitLabel}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
