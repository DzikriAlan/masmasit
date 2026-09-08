import { supabase } from '@/shared/lib/supabase';
import { API_ERROR_CODE, errorResponse, successResponse } from '@/shared/lib/apiResponse';

import type { DataSearch } from '../types/searchTypes';

/** Cross-domain quick search over members, jobs, courses, and projects. */
export const getSearch = async (query: string) => {
  try {
    const like = `%${query}%`;
    const [profiles, jobs, courses, projects] = await Promise.all([
      supabase.from('profiles').select('id, full_name, bio, location').or(`full_name.ilike.${like},bio.ilike.${like}`).limit(5),
      supabase.from('jobs').select('id, title, company_name, location').or(`title.ilike.${like},description.ilike.${like}`).eq('status', 'open').limit(5),
      supabase.from('courses').select('id, title, level, category').or(`title.ilike.${like},description.ilike.${like}`).limit(5),
      supabase.from('projects').select('id, title, budget').or(`title.ilike.${like},description.ilike.${like}`).eq('status', 'open').limit(5),
    ]);

    const results: DataSearch[] = [];
    (profiles.data ?? []).forEach((p: any) =>
      results.push({ id: p.id, type: 'profile', title: p.full_name ?? 'Unknown', subtitle: p.location ?? p.bio?.slice(0, 50) ?? '', href: `/directory/${p.id}` })
    );
    (jobs.data ?? []).forEach((j: any) =>
      results.push({ id: j.id, type: 'job', title: j.title, subtitle: `${j.company_name} · ${j.location ?? ''}`, href: `/jobs/${j.id}` })
    );
    (courses.data ?? []).forEach((c: any) =>
      results.push({ id: c.id, type: 'course', title: c.title, subtitle: `${c.level} · ${c.category ?? ''}`, href: `/courses/${c.id}` })
    );
    (projects.data ?? []).forEach((p: any) =>
      results.push({ id: p.id, type: 'project', title: p.title, subtitle: p.budget ? `Rp ${(p.budget / 1000000).toFixed(0)}M` : '', href: `/projects/${p.id}` })
    );

    return successResponse(results, 'Search results retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, message);
  }
};
