import Link from 'next/link';
import { CalendarDays } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { TONE_TEXT, toneOf } from '@/shared/lib/tones';
import { cn } from '@/shared/lib/utils';

export interface ProjectsCardItem {
  id: string;
  title: string;
  description: string;
  status: string;
  statusLabel: string;
  budget: string;
  deadline: string | null;
  author: string;
}

/**
 * A project reads as a brief, not a product: budget is the headline fact,
 * the status says whether bidding is still open, and no stock photo stands
 * in for work nobody has done yet.
 */
export function ProjectsCard({ project }: Readonly<{ project: ProjectsCardItem }>) {
  const isOpen = project.status === 'open';

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex h-full min-w-0 flex-col rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 font-semibold leading-snug group-hover:underline">{project.title}</h3>
        <Badge variant={isOpen ? 'default' : 'secondary'} className="shrink-0 text-xs capitalize">
          {project.statusLabel}
        </Badge>
      </div>

      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground text-pretty">{project.description}</p>

      <div className="mt-auto space-y-3 pt-4">
        <p className={cn('font-display text-lg font-semibold', TONE_TEXT[toneOf('projects')])}>{project.budget}</p>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span className="truncate">{project.author}</span>
          {project.deadline && (
            <span className="flex shrink-0 items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {project.deadline}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
