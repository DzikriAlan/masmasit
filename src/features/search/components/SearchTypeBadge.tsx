'use client';

import { useLang } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';
import { TONE_CHIP, toneOf } from '@/shared/lib/tones';
import { cn } from '@/shared/lib/utils';

import type { DataSearch } from '@/features/search/types/searchTypes';

type SearchType = DataSearch['type'];

const AREA: Record<SearchType, string> = {
  profile: 'directory',
  talent: 'talents',
  job: 'jobs',
  course: 'courses',
  project: 'projects',
  agency: 'agency',
  service: 'services',
  event: 'events',
  discussion: 'discussions',
  build: 'builds',
};

/** Bilingual label per result type, shared by the header dialog and Discover. */
export const useSearchLabels = () => {
  const { t } = useLang();
  const labels: Record<SearchType, string> = {
    profile: t('Members', 'Member'),
    talent: t('Talents', 'Talent'),
    job: t('Jobs', 'Lowongan'),
    course: t('Courses', 'Kursus'),
    project: t('Projects', 'Proyek'),
    agency: t('Agencies', 'Agency'),
    service: t('Services', 'Layanan'),
    event: t('Events', 'Event'),
    discussion: t('Discussions', 'Diskusi'),
    build: t('Builds', 'Builds'),
  };
  return labels;
};

/** Type badge on a search result, tinted with that area's own tone. */
export function SearchTypeBadge({ type }: Readonly<{ type: SearchType }>) {
  const labels = useSearchLabels();
  return (
    <Badge variant="outline" className={cn('shrink-0 text-xs', TONE_CHIP[toneOf(AREA[type])])}>
      {labels[type]}
    </Badge>
  );
}
