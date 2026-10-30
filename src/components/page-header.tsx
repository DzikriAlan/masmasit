import type { ReactNode } from 'react';

import type { Tone } from '@/shared/lib/tones';
import { cn } from '@/shared/lib/utils';

/**
 * The one page-header shape every browse page uses — Jobs, Projects,
 * Courses, Events, Talents, Services, Case Studies, Directory, and every
 * newer Ecosystem page (Agency, Discussions, Builds, Spotlight, Team
 * Builder, Team Collabs). Title + subtitle on the left, one optional
 * primary action on the right; nothing else varies between pages except
 * that action and the content below. Sized as Pixel's page header: a 2xl
 * semibold title over a small muted subtitle. Pair with the same outer
 * container everywhere too:
 * `page-container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8` — inside the
 * dashboard shell that container yields to the shell's own gutter.
 *
 * `tone` marks a page that belongs to an ecosystem area; its title then
 * takes the primary colour (burgundy on internal pages) rather than the
 * area's own hue, so every such title reads as one product.
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
    <div className="mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-1">
          {eyebrow && <p className="eyebrow mb-2 text-muted-foreground">{eyebrow}</p>}
          <h1 className={cn('font-display text-2xl font-semibold tracking-tight', tone && 'text-primary')}>
            {title}
          </h1>
          {subtitle && <p className="text-sm text-muted-foreground text-pretty">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      {meta && <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">{meta}</div>}
    </div>
  );
}
