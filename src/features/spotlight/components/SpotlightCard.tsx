import { ArrowUpRight, Heart } from 'lucide-react';

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
}

/**
 * A shipped thing, credited to whoever shipped it. Rank is the point of
 * Spotlight, so the "Hot" marker sits inline in the header rather than
 * floating over a corner where it clips.
 */
export function SpotlightCard({
  item,
  hotLabel,
  visitLabel,
}: Readonly<{ item: SpotlightCardItem; hotLabel: string; visitLabel: string }>) {
  const Wrapper = item.linkUrl ? 'a' : 'div';
  const linkProps = item.linkUrl ? { href: item.linkUrl, target: '_blank', rel: 'noreferrer' } : {};

  return (
    <Wrapper
      {...linkProps}
      className={cn(
        'group flex h-full min-w-0 flex-col rounded-xl border border-border bg-card p-5 transition-all',
        item.linkUrl && 'hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-[var(--shadow-card-hover)]'
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={cn('text-[11px]', TONE_CHIP[toneOf('spotlight')])}>
          {item.sourceLabel}
        </Badge>
        {item.isHot && (
          <Badge className="bg-orange-500 text-[11px] text-white hover:bg-orange-500">{hotLabel}</Badge>
        )}
      </div>

      <h3 className="mt-3 line-clamp-2 font-display text-lg font-semibold leading-snug">{item.title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{item.maker}</p>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground text-pretty">{item.description}</p>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-4">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Heart className="h-3.5 w-3.5" />
          {item.likes}
        </span>
        {item.linkUrl && (
          <span className="flex items-center gap-1 text-sm font-medium text-foreground group-hover:underline">
            {visitLabel}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </Wrapper>
  );
}
