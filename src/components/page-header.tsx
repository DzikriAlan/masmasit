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
 */
export function PageHeader({
  title,
  subtitle,
  action,
  tone,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className={cn('font-display text-3xl font-semibold', tone && TONE_TEXT[tone])}>{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
