import { supabase } from '@/shared/lib/supabase';
import { API_ERROR_CODE, errorResponse, successResponse, toApiResponse } from '@/shared/lib/apiResponse';

import type { DataFeed, DataFeedCourses, DataFeedEvents, PayloadGetFeed } from '../types/feedTypes';

/**
 * Public activity across the platform: newest open jobs, open projects,
 * builds and approved events, merged by date. Every table here is readable
 * by guests (migration 028), and each embed is a left join, so an embed a
 * guest may not read (e.g. a private profile) degrades to a null name rather
 * than failing the whole feed.
 */
export const getFeed = async (payload: PayloadGetFeed) => {
  try {
    const per = Math.max(5, Math.ceil(payload.limit / 2));
    const [jobs, projects, builds, events] = await Promise.all([
      supabase
        .from('jobs')
        .select('id, title, created_at, companies(name, logo_url)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(per),
      supabase
        .from('projects')
        .select('id, title, created_at, profiles!projects_user_id_profiles_fkey(full_name, avatar_url)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(per),
      supabase
        .from('builds')
        .select('id, title, created_at, profiles!builds_user_id_profiles_fkey(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(per),
      supabase
        .from('events')
        .select('id, title, created_at, regions(name)')
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(per),
    ]);

    const firstError = [jobs, projects, builds, events].find((result) => result.error)?.error;
    if (firstError && [jobs, projects, builds, events].every((result) => result.error)) {
      return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, firstError.message);
    }

    const items: DataFeed[] = [
      ...(jobs.data ?? []).map((j: any) => ({
        id: `job-${j.id}`, kind: 'job' as const, actor: j.companies?.name ?? null, avatarUrl: j.companies?.logo_url ?? null,
        title: j.title, href: `/jobs/${j.id}`, created_at: j.created_at,
      })),
      ...(projects.data ?? []).map((p: any) => ({
        id: `project-${p.id}`, kind: 'project' as const, actor: p.profiles?.full_name ?? null, avatarUrl: p.profiles?.avatar_url ?? null,
        title: p.title, href: `/projects/${p.id}`, created_at: p.created_at,
      })),
      ...(builds.data ?? []).map((b: any) => ({
        id: `build-${b.id}`, kind: 'build' as const, actor: b.profiles?.full_name ?? null, avatarUrl: b.profiles?.avatar_url ?? null,
        title: b.title, href: '/builds', created_at: b.created_at,
      })),
      ...(events.data ?? []).map((e: any) => ({
        id: `event-${e.id}`, kind: 'event' as const, actor: e.regions?.name ?? null, avatarUrl: null,
        title: e.title, href: `/events/${e.id}`, created_at: e.created_at,
      })),
    ];

    const sorted = items
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, payload.limit);

    return successResponse(sorted, 'Feed retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, message);
  }
};

/** Newest courses for the homepage "Learn" carousel. */
export const getFeedCourses = async () => {
  return toApiResponse<DataFeedCourses[]>(
    supabase.from('courses').select('id, title, level, category, created_at').order('created_at', { ascending: false }).limit(8),
    'Courses retrieved successfully'
  );
};

/** Next approved events for the homepage "Events" carousel. */
export const getFeedEvents = async () => {
  return toApiResponse<DataFeedEvents[]>(
    supabase
      .from('events')
      .select('id, title, event_type, location, event_date')
      .eq('approval_status', 'approved')
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(8),
    'Events retrieved successfully'
  );
};
