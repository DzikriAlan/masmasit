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

  // Agencies have no region column (REST.md Bagian 7 doesn't scope them
  // regionally), so a regional_admin sees the same pending queue as super_admin.
  const agenciesQuery = supabase
    .from('agencies')
    .select('*, profiles:owner_id(full_name)')
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: false });

  const [companies, people, events, agencies] = await Promise.all([companiesQuery, peopleQuery, eventsQuery, agenciesQuery]);

  return { companies, people, events, agencies };
};

export const updateAdminEventApproval = async (eventId: string, status: string) => {
  const supabase = getServerSupabase();
  return supabase.from('events').update({ approval_status: status }).eq('id', eventId);
};

// Agency approval (REST.md Bagian 7: "pola sama seperti approval company").
// Client-side self-updates cannot move this field at all — see the
// guard_agencies_approval trigger in migration 015 — so this server path,
// running with is_admin() satisfied by withAdmin(), is the only way in.
export const updateAdminAgencyApproval = async (agencyId: string, status: string) => {
  const supabase = getServerSupabase();
  return supabase.from('agencies').update({ approval_status: status }).eq('id', agencyId);
};

// Team Collabs open for a match (REST.md Bagian 6.2/7) — the human-in-the-loop
// step: an admin pairs a team with a client and hands both sides to WhatsApp.
export const getAdminTeamCollabs = async () => {
  const supabase = getServerSupabase();
  return supabase
    .from('team_collabs')
    .select('*, teams(name), profiles:created_by(full_name)')
    .order('created_at', { ascending: false });
};

export const updateAdminTeamCollabsMatch = async (id: string, matchedWith: string) => {
  const supabase = getServerSupabase();
  return supabase.from('team_collabs').update({ status: 'matched', matched_with: matchedWith }).eq('id', id);
};

// Articles — the "Article" strand of Discover (Bagian 3/9), platform-authored.
export const getAdminArticles = async () => {
  const supabase = getServerSupabase();
  return supabase.from('articles').select('*').order('created_at', { ascending: false });
};

export const postAdminArticle = async (payload: Record<string, unknown>) => {
  const supabase = getServerSupabase();
  return supabase.from('articles').insert(payload);
};

export const updateAdminArticle = async (id: string, payload: Record<string, unknown>) => {
  const supabase = getServerSupabase();
  return supabase.from('articles').update(payload).eq('id', id);
};

export const deleteAdminArticle = async (id: string) => {
  const supabase = getServerSupabase();
  return supabase.from('articles').delete().eq('id', id);
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

/**
 * Per-member feature usage for the admin panel.
 *
 * Goes through the admin_user_activity() RPC rather than counting here: the
 * counts span tables whose RLS hides other people's rows, so a client-side
 * tally would silently report only what the admin happens to own. The
 * function is SECURITY DEFINER and re-checks is_admin() itself.
 */
export const getAdminUserActivity = async () => {
  const supabase = getServerSupabase();
  return supabase.rpc('admin_user_activity');
};

/**
 * Onboarding popup answers per member (migration 025). profiles and
 * user_skills are readable by any signed-in user, so no RPC is needed.
 */
export const getAdminOnboarding = async () => {
  const supabase = getServerSupabase();
  return supabase
    .from('profiles')
    .select(
      'id, full_name, email, whatsapp, avatar_url, location, current_job_status, fields, experience_level, join_goals, referral_source, referral_note, onboarding_completed_at, created_at, user_skills(skills(name))'
    )
    .order('onboarding_completed_at', { ascending: false, nullsFirst: false });
};

