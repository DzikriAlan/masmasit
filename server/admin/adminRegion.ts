import { getServerSupabase } from '../supabase';
import type { AuthContext } from '../serverAuth';
import { isSuperAdmin } from '../serverAuth';
import { API_ERROR_CODE, errorJson } from '../apiResponse';

/**
 * Regional scoping for the admin panel (TC-14-04 / TC-14-05).
 *
 * Only `events` carries its own region. Everything else belongs to its
 * owner's home region, `profiles.region_id` (migration 030, derived from
 * `profiles.location`). A super_admin is global; a regional_admin only ever
 * sees or touches rows that resolve to `ctx.regionId`.
 */

// Matches no region — used when a regional_admin has no region assigned, so
// a missing region narrows to nothing instead of widening to everything.
const NO_REGION = '00000000-0000-0000-0000-000000000000';

/** null = unscoped (super_admin); otherwise the region every query is pinned to. */
export const getRegionScope = (ctx: AuthContext) => (isSuperAdmin(ctx) ? null : ctx.regionId ?? NO_REGION);

export type RegionTarget =
  | 'jobs'
  | 'projects'
  | 'courses'
  | 'events'
  | 'discussions'
  | 'discussion_comments'
  | 'builds'
  | 'companies'
  | 'profiles'
  | 'agencies'
  | 'team_collabs'
  | 'bookings'
  | 'enrollments'
  | 'event_rsvps'
  | 'agency_projects'
  | 'job_applications';

/** Owner column per table; the owner's profile region is the row's region. */
const OWNER_COLUMN: Partial<Record<RegionTarget, string>> = {
  projects: 'user_id',
  courses: 'coach_id',
  discussions: 'user_id',
  discussion_comments: 'user_id',
  builds: 'user_id',
  companies: 'user_id',
  profiles: 'id',
  agencies: 'owner_id',
  team_collabs: 'created_by',
  bookings: 'client_id',
  enrollments: 'user_id',
  job_applications: 'user_id',
};

const getProfileRegion = async (profileId: string | null | undefined) => {
  if (!profileId) return null;
  const supabase = getServerSupabase();
  const { data } = await supabase.from('profiles').select('region_id').eq('id', profileId).maybeSingle();
  return (data?.region_id as string | null | undefined) ?? null;
};

/**
 * Resolves the region a row belongs to.
 * `found: false` when the row does not exist (or is invisible under RLS).
 */
export const getTargetRegion = async (target: RegionTarget, id: string) => {
  const supabase = getServerSupabase();

  if (target === 'events') {
    const { data } = await supabase.from('events').select('region_id').eq('id', id).maybeSingle();
    return { found: Boolean(data), regionId: (data?.region_id as string | null | undefined) ?? null };
  }

  if (target === 'event_rsvps') {
    const { data } = await supabase.from('event_rsvps').select('events(region_id)').eq('id', id).maybeSingle();
    const event = (data as { events: { region_id: string | null } | null } | null)?.events;
    return { found: Boolean(data), regionId: event?.region_id ?? null };
  }

  if (target === 'jobs') {
    const { data } = await supabase.from('jobs').select('companies(user_id)').eq('id', id).maybeSingle();
    const company = (data as { companies: { user_id: string } | null } | null)?.companies;
    return { found: Boolean(data), regionId: await getProfileRegion(company?.user_id) };
  }

  // Agency projects come from external clients with no member account, so
  // they have no region: only a super_admin may act on them.
  if (target === 'agency_projects') {
    const { data } = await supabase.from('agency_projects').select('id').eq('id', id).maybeSingle();
    return { found: Boolean(data), regionId: null };
  }

  const column = OWNER_COLUMN[target];
  if (!column) return { found: false, regionId: null };

  const { data } = await supabase.from(target).select(column).eq('id', id).maybeSingle();
  const ownerId = (data as Record<string, string | null> | null)?.[column] ?? null;
  return { found: Boolean(data), regionId: await getProfileRegion(ownerId) };
};

/**
 * Server-side gate for every admin mutation. Returns an error response to
 * send back, or null when the caller may proceed.
 */
export const checkRegionAccess = async (ctx: AuthContext, target: RegionTarget, id: string) => {
  const { found, regionId } = await getTargetRegion(target, id);
  if (!found) return errorJson(API_ERROR_CODE.NOT_FOUND, 'Record not found.');
  if (isSuperAdmin(ctx)) return null;
  if (!ctx.regionId || regionId !== ctx.regionId) {
    return errorJson(API_ERROR_CODE.FORBIDDEN, 'This record belongs to another region.');
  }
  return null;
};

/**
 * Writes chained with `.select('id')` return the rows they touched. RLS drops
 * a write it does not allow without raising, so zero rows means "refused".
 */
export const checkAffected = (rows: unknown[] | null) =>
  rows && rows.length > 0
    ? null
    : errorJson(API_ERROR_CODE.FORBIDDEN, 'The database refused this change (missing permission or record).');
