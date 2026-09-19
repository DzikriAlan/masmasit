import type { ReactNode } from 'react';

import { TONE_TEXT, type Tone } from '@/shared/lib/tones';
import { cn } from '@/shared/lib/utils';

/**
 * The one page-header shape every browse page uses — Jobs, Projects,
 * Courses, Events, Talents, Services, Case Studies, Directory, and every
 * newer Ecosystem page (Agency, Discussions, Builds, Spotlight, Team
 * Builder, Team Collabs). Title + subtitle on the left, one optional
 * primary action on the right; nothing else varies between pages except
 * that action and the content below. Pair with the same outer container
 * everywhere too: `mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8`.
 *
 * `tone` colours the title with the page's ecosystem-area colour (see
 * shared/lib/tones.ts) — this is the site's stand-in for an icon: colour
 * says which area you're in instead of a glyph next to the label.
 *
 * `eyebrow` names the group the page belongs to (Product / Ecosystem), so
 * a browse page states where it sits without a breadcrumb; `meta` carries
 * a live count or similar, which reads as fact rather than decoration.
 */
export function PageHeader({
  title,
  subtitle,
  action,
  tone,
  eyebrow,
  meta,
}: Readonly<{
  title: string;
  subtitle?: string;
  action?: ReactNode;
  tone?: Tone;
  eyebrow?: string;
  meta?: ReactNode;
}>) {
  return (
    <div className="mb-8 border-b border-border pb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          {eyebrow && <p className="eyebrow mb-2 text-muted-foreground">{eyebrow}</p>}
          <h1 className={cn('font-display text-3xl font-semibold tracking-tight', tone && TONE_TEXT[tone])}>
            {title}
          </h1>
          {subtitle && <p className="mt-2 leading-relaxed text-muted-foreground text-pretty">{subtitle}</p>}
        </div>
        {action}
      </div>
      {meta && <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">{meta}</div>}
    </div>
  );
}
