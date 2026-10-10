import Link from 'next/link';
import { MapPin } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ShareButton } from '@/components/share-button';
import { TONE_CHIP, toneOf } from '@/shared/lib/tones';

export interface JobsCardItem {
  id: string;
  title: string;
  companyName: string;
  companyLogo: string | null;
  jobType: string;
  location: string | null;
  salary: string | null;
  deadline: string | null;
}

/**
 * One job as a card: identity first (logo, title, company), then the two
 * facts a candidate actually scans for — pay and where — and nothing else
 * competing with them.
 */
export function JobsCard({ job }: Readonly<{ job: JobsCardItem }>) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex h-full min-w-0 flex-col rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg ${TONE_CHIP[toneOf('jobs')]}`}>
          {job.companyLogo ? (
            <img src={job.companyLogo} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-semibold">{job.companyName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold leading-snug group-hover:underline">{job.title}</h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{job.companyName}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-xs capitalize">{job.jobType}</Badge>
        {job.location && (
          <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{job.location}</span>
          </span>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/60 pt-4">
        <p className="text-sm font-semibold text-success">{job.salary}</p>
        <div className="flex shrink-0 items-center gap-1">
          {job.deadline && <p className="text-xs text-muted-foreground">{job.deadline}</p>}
          <ShareButton compact url={`/jobs/${job.id}`} title={`${job.title} — ${job.companyName}`} />
        </div>
      </div>
    </Link>
  );
}
