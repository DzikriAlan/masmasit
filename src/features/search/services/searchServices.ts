import { supabase } from '@/shared/lib/supabase';
import { API_ERROR_CODE, errorResponse, successResponse } from '@/shared/lib/apiResponse';

import type { DataSearch } from '../types/searchTypes';

/* projects stores a range, not a single `budget`, so the subtitle renders
   whichever ends are present rather than a column that does not exist. */
const formatBudget = (min?: number | null, max?: number | null) => {
  const jt = (n: number) => `Rp ${(n / 1000000).toFixed(0)}jt`;
  if (min && max) return `${jt(min)} – ${jt(max)}`;
  if (min) return `${jt(min)}+`;
  if (max) return `< ${jt(max)}`;
  return '';
};

/** Cross-domain quick search over members, jobs, courses, and projects. */
export const getSearch = async (query: string) => {
  try {
    const like = `%${query}%`;
    const [profiles, jobs, courses, projects] = await Promise.all([
      supabase.from('profiles').select('id, full_name, bio, location').or(`full_name.ilike.${like},bio.ilike.${like}`).limit(5),
      supabase.from('jobs').select('id, title, location, companies(name)').or(`title.ilike.${like},description.ilike.${like}`).eq('status', 'open').limit(5),
      supabase.from('courses').select('id, title, level, category').or(`title.ilike.${like},description.ilike.${like}`).limit(5),
      supabase.from('projects').select('id, title, budget_min, budget_max').or(`title.ilike.${like},description.ilike.${like}`).eq('status', 'open').limit(5),
    ]);

    const results: DataSearch[] = [];
    (profiles.data ?? []).forEach((p: any) =>
      results.push({ id: p.id, type: 'profile', title: p.full_name ?? 'Unknown', subtitle: p.location ?? p.bio?.slice(0, 50) ?? '', href: `/directory/${p.id}` })
    );
    (jobs.data ?? []).forEach((j: any) =>
      results.push({ id: j.id, type: 'job', title: j.title, subtitle: [j.companies?.name, j.location].filter(Boolean).join(' · '), href: `/jobs/${j.id}` })
    );
    (courses.data ?? []).forEach((c: any) =>
      results.push({ id: c.id, type: 'course', title: c.title, subtitle: `${c.level} · ${c.category ?? ''}`, href: `/courses/${c.id}` })
    );
    (projects.data ?? []).forEach((p: any) =>
      results.push({ id: p.id, type: 'project', title: p.title, subtitle: formatBudget(p.budget_min, p.budget_max), href: `/projects/${p.id}` })
    );

    return successResponse(results, 'Search results retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, message);
  }
};
