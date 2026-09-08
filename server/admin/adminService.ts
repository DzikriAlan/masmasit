import { getServerSupabase } from '../supabase';
import type { AuthContext } from '../serverAuth';
import { isSuperAdmin } from '../serverAuth';

/**
 * A regional_admin only sees rows belonging to its own region; a super_admin
 * sees everything. Region scoping is applied per table because the tables
 * reach `regions` through different columns.
 */
const scopeToRegion = (ctx: AuthContext) => (isSuperAdmin(ctx) ? null : ctx.regionId);

export const getAdminUsersWithRoles = async (search: string) => {
  const supabase = getServerSupabase();

  let query = supabase
    .from('profiles')
    .select('id, full_name, avatar_url, location, user_roles(role, region_id)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (search) query = query.ilike('full_name', `%${search}%`);

  return query;
};

export const postAdminRole = async (userId: string, role: string, regionId: string | null) => {
  const supabase = getServerSupabase();
  return supabase.from('user_roles').insert({ user_id: userId, role, region_id: regionId });
};

export const deleteAdminRole = async (userId: string, role: string) => {
  const supabase = getServerSupabase();
  return supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role);
};

export const getAdminRoleDistribution = async () => {
  const supabase = getServerSupabase();
  // Readable for admins only, via the `is_admin()` clause added in migration 014.
  return supabase.from('user_roles').select('role');
};

export const getAdminPendingApprovals = async (ctx: AuthContext) => {
  const supabase = getServerSupabase();
  const regionId = scopeToRegion(ctx);

  const companiesQuery = supabase
    .from('companies')
    .select('*, profiles(full_name)')
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: false });

  const peopleQuery = supabase
    .from('profiles')
    .select('id, full_name, bio, is_coach, coach_approved, is_talent, talent_approved')
    .or('coach_approved.eq.pending,talent_approved.eq.pending')
    .order('created_at', { ascending: false });

  let eventsQuery = supabase
    .from('events')
    .select('*, regions(name)')
    .eq('approval_status', 'pending')
    .order('event_date', { ascending: true });

  if (regionId) eventsQuery = eventsQuery.eq('region_id', regionId);

  const [companies, people, events] = await Promise.all([companiesQuery, peopleQuery, eventsQuery]);

  return { companies, people, events };
};

export const updateAdminEventApproval = async (eventId: string, status: string) => {
  const supabase = getServerSupabase();
  return supabase.from('events').update({ approval_status: status }).eq('id', eventId);
};

export const getAdminAgencyServices = async () => {
  const supabase = getServerSupabase();
  return supabase.from('agency_services').select('*').order('category', { ascending: true });
};

export const postAdminAgencyService = async (payload: Record<string, unknown>) => {
  const supabase = getServerSupabase();
  return supabase.from('agency_services').insert(payload);
};

export const updateAdminAgencyService = async (id: string, payload: Record<string, unknown>) => {
  const supabase = getServerSupabase();
  return supabase.from('agency_services').update(payload).eq('id', id);
};

export const deleteAdminAgencyService = async (id: string) => {
  const supabase = getServerSupabase();
  return supabase.from('agency_services').delete().eq('id', id);
};

export const getAdminCaseStudies = async () => {
  const supabase = getServerSupabase();
  return supabase.from('case_studies').select('*').order('created_at', { ascending: false });
};

export const postAdminCaseStudy = async (payload: Record<string, unknown>) => {
  const supabase = getServerSupabase();
  return supabase.from('case_studies').insert(payload);
};

export const updateAdminCaseStudy = async (id: string, payload: Record<string, unknown>) => {
  const supabase = getServerSupabase();
  return supabase.from('case_studies').update(payload).eq('id', id);
};

export const deleteAdminCaseStudy = async (id: string) => {
  const supabase = getServerSupabase();
  return supabase.from('case_studies').delete().eq('id', id);
};
