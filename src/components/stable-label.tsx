'use client';

import { useLang } from '@/components/language-provider';
import { cn } from '@/shared/lib/utils';

/**
 * Shows `show` while reserving the width of the widest string in `all`:
 * every variant is stacked in the same grid cell and all but one are
 * invisible. Swapping text (language, Menu/Close) then never resizes the
 * button around it or pushes its neighbours.
 */
export function StableText({ show, all, className }: { show: string; all: string[]; className?: string }) {
  // Deduped: when a caller's EN and ID strings happen to be identical (e.g.
  // "Discover"), `all` collapses to one entry instead of two equal ones —
  // otherwise both would render with the same `key`, which is exactly the
  // "two children with the same key" warning React raises for it.
  const variants = Array.from(new Set(all.includes(show) ? all : [...all, show]));
  return (
    <span className={cn('inline-grid justify-items-center', className)}>
      {variants.map((v) => (
        <span
          key={v}
          aria-hidden={v !== show}
          className={cn('col-start-1 row-start-1 whitespace-nowrap', v !== show && 'invisible')}
        >
          {v}
        </span>
      ))}
    </span>
  );
}

/** EN/ID label whose footprint is the longer of the two translations. */
export function StableLabel({ en, id, className }: { en: string; id: string; className?: string }) {
  const { lang } = useLang();
  return <StableText show={lang === 'id' ? id : en} all={[en, id]} className={className} />;
}
