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

const snippet = (text?: string | null, length = 60) => (text ?? '').replace(/\s+/g, ' ').trim().slice(0, length);

/**
 * Cross-domain quick search: members, talents, jobs, courses, projects,
 * agencies, services, events, discussions and builds — max 5 per type.
 */
export const getSearch = async (query: string) => {
  try {
    // PostgREST's or() grammar treats , ( ) as separators — strip them so a
    // stray comma cannot break every branch of the query at once.
    const like = `%${query.replace(/[,()%]/g, ' ').trim()}%`;
    const [profiles, talents, jobs, courses, projects, agencies, services, events, discussions, builds] = await Promise.all([
      supabase.from('profiles').select('id, full_name, bio, location').or(`full_name.ilike.${like},bio.ilike.${like}`).limit(5),
      supabase
        .from('profiles')
        .select('id, full_name, bio, location')
        .eq('is_talent', true)
        .eq('talent_approved', 'approved')
        .or(`full_name.ilike.${like},bio.ilike.${like}`)
        .limit(5),
      supabase.from('jobs').select('id, title, location, companies(name)').or(`title.ilike.${like},description.ilike.${like}`).eq('status', 'open').limit(5),
      supabase.from('courses').select('id, title, level, category').or(`title.ilike.${like},description.ilike.${like}`).limit(5),
      supabase.from('projects').select('id, title, budget_min, budget_max').or(`title.ilike.${like},description.ilike.${like}`).eq('status', 'open').limit(5),
      supabase.from('agencies').select('id, name, slug, description').eq('approval_status', 'approved').or(`name.ilike.${like},description.ilike.${like}`).limit(5),
      supabase
        .from('agency_services')
        .select('id, title, category, agencies(name, slug)')
        .eq('is_active', true)
        .or(`title.ilike.${like},description.ilike.${like}`)
        .limit(5),
      supabase
        .from('events')
        .select('id, title, event_date, location')
        .eq('approval_status', 'approved')
        .or(`title.ilike.${like},description.ilike.${like}`)
        .order('event_date', { ascending: false })
        .limit(5),
      supabase.from('discussions').select('id, title, body').or(`title.ilike.${like},body.ilike.${like}`).order('created_at', { ascending: false }).limit(5),
      supabase.from('builds').select('id, title, description').or(`title.ilike.${like},description.ilike.${like}`).order('created_at', { ascending: false }).limit(5),
    ]);

    const results: DataSearch[] = [];
    (profiles.data ?? []).forEach((p: any) =>
      results.push({ id: p.id, type: 'profile', title: p.full_name ?? 'Unknown', subtitle: p.location ?? p.bio?.slice(0, 50) ?? '', href: `/directory/${p.id}` })
    );
    (talents.data ?? []).forEach((p: any) =>
      results.push({ id: p.id, type: 'talent', title: p.full_name ?? 'Unknown', subtitle: p.location ?? snippet(p.bio, 50), href: `/talents/${p.id}` })
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
    (agencies.data ?? []).forEach((a: any) =>
      results.push({ id: a.id, type: 'agency', title: a.name, subtitle: snippet(a.description), href: `/agency/${a.slug}` })
    );
    (services.data ?? []).forEach((sv: any) =>
      results.push({
        id: sv.id,
        type: 'service',
        title: sv.title,
        subtitle: [sv.category, sv.agencies?.name].filter(Boolean).join(' · '),
        href: sv.agencies?.slug ? `/agency/${sv.agencies.slug}` : '/services',
      })
    );
    (events.data ?? []).forEach((e: any) =>
      results.push({
        id: e.id,
        type: 'event',
        title: e.title,
        subtitle: [new Date(e.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }), e.location].filter(Boolean).join(' · '),
        href: `/events/${e.id}`,
      })
    );
    (discussions.data ?? []).forEach((d: any) =>
      results.push({ id: d.id, type: 'discussion', title: d.title, subtitle: snippet(d.body), href: `/discussions/${d.id}` })
    );
    (builds.data ?? []).forEach((b: any) =>
      results.push({ id: b.id, type: 'build', title: b.title, subtitle: snippet(b.description), href: '/builds' })
    );

    return successResponse(results, 'Search results retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, message);
  }
};
