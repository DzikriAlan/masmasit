import { getServerSupabase, getServiceSupabase } from '../supabase';
import type { AuthContext } from '../serverAuth';
import { getRegionScope } from './adminRegion';

/**
 * A regional_admin only sees rows belonging to its own region; a super_admin
 * sees everything. Region scoping is applied per table because the tables
 * reach `regions` through different columns — events directly, everything
 * else through the owner's profiles.region_id (migration 030).
 */
const scopeToRegion = getRegionScope;

/** Parses ?page / ?limit into a PostgREST range. */
export const getPageRange = (pageParam: string | null, limitParam: string | null, defaultLimit = 20) => {
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(limitParam ?? String(defaultLimit), 10) || defaultLimit));
  const from = (page - 1) * limit;
  return { page, limit, from, to: from + limit - 1 };
};

export const toPagination = (page: number, limit: number, total: number | null) => ({
  page,
  limit,
  total: total ?? 0,
  totalPages: Math.max(1, Math.ceil((total ?? 0) / limit)),
});

/** PostgREST `or` values cannot contain these unescaped. */
const sanitizeSearch = (search: string) => search.replace(/[,()*%\\]/g, ' ').trim();

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

// Approvals are regionally scoped: events by their own region, everything
// else by the owner's profiles.region_id (migration 030). `includeAll`
// returns every company / coach-talent application, not just the pending
// queue, for the panel's "Show all" toggle.
export const getAdminPendingApprovals = async (ctx: AuthContext, includeAll = false) => {
  const supabase = getServerSupabase();
  const regionId = scopeToRegion(ctx);
  const join = regionId ? '!inner' : '';

  let companiesQuery = supabase
    .from('companies')
    .select(`*, profiles${join}(full_name, region_id)`)
    .order('created_at', { ascending: false });
  if (!includeAll) companiesQuery = companiesQuery.eq('approval_status', 'pending');
  if (regionId) companiesQuery = companiesQuery.eq('profiles.region_id', regionId);

  // coach_approved / talent_approved default to 'pending' for every profile,
  // so the queue is only people who actually applied for the badge.
  let peopleQuery = supabase
    .from('profiles')
    .select('id, full_name, bio, is_coach, coach_approved, is_talent, talent_approved, region_id')
    .or(
      includeAll
        ? 'is_coach.eq.true,is_talent.eq.true'
        : 'and(is_coach.eq.true,coach_approved.eq.pending),and(is_talent.eq.true,talent_approved.eq.pending)'
    )
    .order('created_at', { ascending: false });
  if (regionId) peopleQuery = peopleQuery.eq('region_id', regionId);

  let eventsQuery = supabase
    .from('events')
    .select('*, regions(name)')
    .eq('approval_status', 'pending')
    .order('event_date', { ascending: true });
  if (regionId) eventsQuery = eventsQuery.eq('region_id', regionId);

  let agenciesQuery = supabase
    .from('agencies')
    .select(`*, profiles:owner_id${join}(full_name, region_id)`)
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: false });
  if (regionId) agenciesQuery = agenciesQuery.eq('profiles.region_id', regionId);

  const [companies, people, events, agencies] = await Promise.all([companiesQuery, peopleQuery, eventsQuery, agenciesQuery]);

  return { companies, people, events, agencies };
};

export const updateAdminEventApproval = async (eventId: string, status: string) => {
  const supabase = getServerSupabase();
  return supabase.from('events').update({ approval_status: status }).eq('id', eventId).select('id');
};

// Company / coach-talent approvals used to be written straight from the
// browser, which skipped both the region check and the audit trail.
export const updateAdminCompanyApproval = async (id: string, status: string) => {
  const supabase = getServerSupabase();
  return supabase.from('companies').update({ approval_status: status }).eq('id', id).select('id');
};

export const updateAdminPersonApproval = async (
  id: string,
  field: 'coach_approved' | 'talent_approved',
  status: string
) => {
  const supabase = getServerSupabase();
  return supabase.from('profiles').update({ [field]: status }).eq('id', id).select('id');
};

// Agency approval (REST.md Bagian 7: "pola sama seperti approval company").
// Client-side self-updates cannot move this field at all — see the
// guard_agencies_approval trigger in migration 015 — so this server path,
// running with is_admin() satisfied by withAdmin(), is the only way in.
export const updateAdminAgencyApproval = async (agencyId: string, status: string) => {
  const supabase = getServerSupabase();
  return supabase.from('agencies').update({ approval_status: status }).eq('id', agencyId).select('id');
};

// Team Collabs open for a match (REST.md Bagian 6.2/7) — the human-in-the-loop
// step: an admin pairs a team with a client and hands both sides to WhatsApp.
export const getAdminTeamCollabs = async (ctx: AuthContext) => {
  const supabase = getServerSupabase();
  const regionId = scopeToRegion(ctx);

  let query = supabase
    .from('team_collabs')
    .select(`*, teams(name), profiles:created_by${regionId ? '!inner' : ''}(full_name, region_id)`)
    .order('created_at', { ascending: false });
  if (regionId) query = query.eq('profiles.region_id', regionId);

  return query;
};

export const updateAdminTeamCollabsMatch = async (id: string, matchedWith: string) => {
  const supabase = getServerSupabase();
  return supabase.from('team_collabs').update({ status: 'matched', matched_with: matchedWith }).eq('id', id).select('id');
};

// TC-14-07: an admin can take a listing off the board.
export const updateAdminTeamCollabsClose = async (id: string) => {
  const supabase = getServerSupabase();
  return supabase.from('team_collabs').update({ status: 'closed' }).eq('id', id).select('id');
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

// `.select('id')` so an update RLS silently drops (case_studies writes are
// super_admin-only) surfaces as an error instead of a false "saved".
export const updateAdminCaseStudy = async (id: string, payload: Record<string, unknown>) => {
  const supabase = getServerSupabase();
  return supabase.from('case_studies').update(payload).eq('id', id).select('id');
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


// ---------------------------------------------------------------------------
// Moderation (TC-14-06) — one paginated, searchable list per content type.
// ---------------------------------------------------------------------------

export const MODERATION_TYPES = [
  'jobs',
  'projects',
  'courses',
  'events',
  'discussions',
  'replies',
  'builds',
  'spotlight',
] as const;

export type ModerationType = (typeof MODERATION_TYPES)[number];

/** The table each moderation type lives in. */
export const MODERATION_TABLE: Record<ModerationType, 'jobs' | 'projects' | 'courses' | 'events' | 'discussions' | 'discussion_comments' | 'builds'> = {
  jobs: 'jobs',
  projects: 'projects',
  courses: 'courses',
  events: 'events',
  discussions: 'discussions',
  replies: 'discussion_comments',
  builds: 'builds',
  spotlight: 'builds',
};

const OWNER_SELECT = (inner: boolean) => `profiles${inner ? '!inner' : ''}(full_name, region_id)`;

const getModerationSelect = (type: ModerationType, inner: boolean) => {
  switch (type) {
    case 'jobs':
      return `id, title, status, created_at, companies${inner ? '!inner' : ''}(name, ${OWNER_SELECT(inner)})`;
    case 'events':
      return 'id, title, approval_status, created_at, region_id, regions(name), profiles(full_name)';
    case 'discussions':
      return `id, title, is_featured, created_at, ${OWNER_SELECT(inner)}`;
    case 'replies':
      return `id, body, created_at, discussion_id, discussions(title), ${OWNER_SELECT(inner)}`;
    case 'builds':
    case 'spotlight':
      return `id, title, promoted_to_spotlight, likes_count, created_at, ${OWNER_SELECT(inner)}`;
    default:
      return `id, title, created_at, ${OWNER_SELECT(inner)}`;
  }
};

const getModerationRegionPath = (type: ModerationType) => {
  if (type === 'events') return 'region_id';
  if (type === 'jobs') return 'companies.profiles.region_id';
  return 'profiles.region_id';
};

export const getAdminModeration = async (
  ctx: AuthContext,
  type: ModerationType,
  search: string,
  from: number,
  to: number
) => {
  const supabase = getServerSupabase();
  const regionId = scopeToRegion(ctx);
  const table = MODERATION_TABLE[type];

  let query = supabase
    .from(table)
    .select(getModerationSelect(type, Boolean(regionId)), { count: 'exact' })
    .order('created_at', { ascending: false });

  if (type === 'spotlight') query = query.eq('promoted_to_spotlight', true);

  const term = sanitizeSearch(search);
  if (term) query = query.ilike(type === 'replies' ? 'body' : 'title', `%${term}%`);
  if (regionId) query = query.eq(getModerationRegionPath(type), regionId);

  const { data, error, count } = await query.range(from, to);
  if (error) return { data: null, error, count: null };

  const items = ((data ?? []) as Record<string, any>[]).map((row) => ({
    type,
    id: row.id as string,
    title: (type === 'replies' ? row.body : row.title) as string,
    context: type === 'replies' ? (row.discussions?.title ?? null) : type === 'events' ? (row.regions?.name ?? null) : null,
    author: (type === 'jobs' ? row.companies?.name : row.profiles?.full_name) ?? null,
    created_at: row.created_at as string,
    is_featured: type === 'discussions' ? Boolean(row.is_featured) : undefined,
    promoted_to_spotlight: type === 'builds' || type === 'spotlight' ? Boolean(row.promoted_to_spotlight) : undefined,
  }));

  return { data: items, error: null, count };
};

export const deleteAdminModeration = async (type: ModerationType, id: string) => {
  const supabase = getServerSupabase();
  return supabase.from(MODERATION_TABLE[type]).delete().eq('id', id).select('id');
};

/** TC-09-04: editorial "Featured" flag on a discussion. */
export const updateAdminDiscussionFeatured = async (id: string, isFeatured: boolean) => {
  const supabase = getServerSupabase();
  return supabase.from('discussions').update({ is_featured: isFeatured }).eq('id', id).select('id');
};

/** TC-09-13: take a build down from Spotlight without deleting it. */
export const updateAdminBuildSpotlight = async (id: string, promoted: boolean) => {
  const supabase = getServerSupabase();
  return supabase.from('builds').update({ promoted_to_spotlight: promoted }).eq('id', id).select('id');
};

// ---------------------------------------------------------------------------
// Payments (TC-14-04) — moved off the browser so the queue is region-scoped
// and every confirm / reset is checked and audited on the server.
// ---------------------------------------------------------------------------

export const PAYMENT_TABLES = ['bookings', 'enrollments', 'event_rsvps', 'agency_projects'] as const;
export type PaymentTable = (typeof PAYMENT_TABLES)[number];

export const getAdminPayments = async (ctx: AuthContext) => {
  const supabase = getServerSupabase();
  const regionId = scopeToRegion(ctx);
  const pending = ['unpaid', 'awaiting_confirmation'];

  let bookingsQuery = supabase
    .from('bookings')
    .select(
      `id, payment_status, payment_note, amount, created_at, client_name, client_email, client_id, talent:talent_id(full_name), client:client_id${regionId ? '!inner' : ''}(full_name, region_id)`
    )
    .in('payment_status', pending)
    .order('created_at', { ascending: false });
  if (regionId) bookingsQuery = bookingsQuery.eq('client.region_id', regionId);

  let enrollmentsQuery = supabase
    .from('enrollments')
    // enrollments timestamps its rows as enrolled_at.
    .select(`id, payment_status, payment_note, created_at:enrolled_at, user_id, courses(title, price), ${OWNER_SELECT(Boolean(regionId))}`)
    .in('payment_status', pending)
    .order('enrolled_at', { ascending: false });
  if (regionId) enrollmentsQuery = enrollmentsQuery.eq('profiles.region_id', regionId);

  let rsvpsQuery = supabase
    .from('event_rsvps')
    .select(`id, payment_status, payment_note, created_at, user_id, events${regionId ? '!inner' : ''}(title, price, region_id), profiles(full_name)`)
    .in('payment_status', pending)
    .order('created_at', { ascending: false });
  if (regionId) rsvpsQuery = rsvpsQuery.eq('events.region_id', regionId);

  // Agency projects come from external clients and carry no region, so they
  // are a super_admin-only queue.
  const agencyQuery = regionId
    ? Promise.resolve({ data: [] as Record<string, any>[], error: null })
    : supabase
        .from('agency_projects')
        .select('id, dp_payment_status, dp_payment_note, final_payment_status, final_payment_note, budget, dp_amount, created_at, client_name, client_company, agency_services(title)')
        .or('dp_payment_status.in.(unpaid,awaiting_confirmation),final_payment_status.in.(unpaid,awaiting_confirmation)')
        .order('created_at', { ascending: false });

  const [bookings, enrollments, rsvps, agency] = await Promise.all([bookingsQuery, enrollmentsQuery, rsvpsQuery, agencyQuery]);

  const firstError = bookings.error ?? enrollments.error ?? rsvps.error ?? agency.error;
  if (firstError) return { data: null, error: firstError };

  const rows: Record<string, unknown>[] = [];
  ((bookings.data ?? []) as Record<string, any>[]).forEach((r) =>
    rows.push({ table: 'bookings', id: r.id, category: 'Booking', item: r.talent?.full_name ?? 'Talent', amount: r.amount ?? 0, status: r.payment_status, note: r.payment_note, user: r.client_name ?? r.client?.full_name ?? r.client_id, created_at: r.created_at })
  );
  ((enrollments.data ?? []) as Record<string, any>[]).forEach((r) =>
    rows.push({ table: 'enrollments', id: r.id, category: 'Course', item: r.courses?.title ?? 'Course', amount: r.courses?.price ?? 0, status: r.payment_status, note: r.payment_note, user: r.profiles?.full_name ?? r.user_id, created_at: r.created_at })
  );
  ((rsvps.data ?? []) as Record<string, any>[]).forEach((r) =>
    rows.push({ table: 'event_rsvps', id: r.id, category: 'Event', item: r.events?.title ?? 'Event', amount: r.events?.price ?? 0, status: r.payment_status, note: r.payment_note, user: r.profiles?.full_name ?? r.user_id, created_at: r.created_at })
  );
  ((agency.data ?? []) as Record<string, any>[]).forEach((r) => {
    if (pending.includes(r.dp_payment_status)) {
      rows.push({ table: 'agency_projects', id: r.id, subField: 'dp', category: 'Agency DP', item: r.agency_services?.title ?? 'Project', amount: r.dp_amount ?? r.budget ?? 0, status: r.dp_payment_status, note: r.dp_payment_note, user: r.client_name, created_at: r.created_at });
    }
    if (pending.includes(r.final_payment_status)) {
      rows.push({ table: 'agency_projects', id: r.id, subField: 'final', category: 'Agency Final', item: r.agency_services?.title ?? 'Project', amount: r.budget ?? 0, status: r.final_payment_status, note: r.final_payment_note, user: r.client_name, created_at: r.created_at });
    }
  });

  rows.sort((a, b) => new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime());
  return { data: rows, error: null };
};

export const updateAdminPayment = async (
  table: PaymentTable,
  id: string,
  action: 'paid' | 'reset',
  actorId: string,
  subField?: 'dp' | 'final'
) => {
  const supabase = getServerSupabase();
  let patch: Record<string, unknown>;

  if (table === 'agency_projects') {
    const prefix = subField === 'final' ? 'final' : 'dp';
    patch =
      action === 'paid'
        ? {
            [`${prefix}_payment_status`]: 'paid',
            [`${prefix}_payment_confirmed_at`]: new Date().toISOString(),
            [`${prefix}_payment_confirmed_by`]: actorId,
          }
        : { [`${prefix}_payment_status`]: 'unpaid', [`${prefix}_payment_note`]: null };
  } else {
    patch =
      action === 'paid'
        ? { payment_status: 'paid', payment_confirmed_at: new Date().toISOString(), payment_confirmed_by: actorId }
        : { payment_status: 'unpaid', payment_note: null };
  }

  return supabase.from(table).update(patch).eq('id', id).select('id');
};

// ---------------------------------------------------------------------------
// Applications (TC-00-11) — every job application on the platform.
// Readable to admins via the job_applications admin policy (migration 028).
// ---------------------------------------------------------------------------

export const getAdminApplications = async (ctx: AuthContext, search: string, from: number, to: number) => {
  const supabase = getServerSupabase();
  const regionId = scopeToRegion(ctx);

  let query = supabase
    .from('job_applications')
    .select(
      `id, status, created_at, user_id, job_id, profiles${regionId ? '!inner' : ''}(full_name, email, region_id), jobs(title, companies(name))`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  if (regionId) query = query.eq('profiles.region_id', regionId);

  // Applicant name OR job title: resolve both to ids first, since PostgREST
  // cannot OR across two embedded tables in one filter.
  const term = sanitizeSearch(search);
  if (term) {
    const [people, jobs] = await Promise.all([
      supabase.from('profiles').select('id').ilike('full_name', `%${term}%`).limit(200),
      supabase.from('jobs').select('id').ilike('title', `%${term}%`).limit(200),
    ]);
    const userIds = (people.data ?? []).map((p) => p.id as string);
    const jobIds = (jobs.data ?? []).map((j) => j.id as string);
    if (userIds.length === 0 && jobIds.length === 0) return { data: [], error: null, count: 0 };

    const clauses: string[] = [];
    if (userIds.length) clauses.push(`user_id.in.(${userIds.join(',')})`);
    if (jobIds.length) clauses.push(`job_id.in.(${jobIds.join(',')})`);
    query = query.or(clauses.join(','));
  }

  const { data, error, count } = await query.range(from, to);
  if (error) return { data: null, error, count: null };

  const rows = ((data ?? []) as Record<string, any>[]).map((r) => ({
    id: r.id as string,
    status: r.status as string,
    created_at: r.created_at as string,
    applicant_id: r.user_id as string,
    applicant_name: (r.profiles?.full_name ?? null) as string | null,
    applicant_email: (r.profiles?.email ?? null) as string | null,
    job_id: r.job_id as string,
    job_title: (r.jobs?.title ?? null) as string | null,
    company_name: (r.jobs?.companies?.name ?? null) as string | null,
  }));

  return { data: rows, error: null, count };
};

// ---------------------------------------------------------------------------
// Members & suspension (TC-09-16)
// ---------------------------------------------------------------------------

export const getAdminMembers = async (
  ctx: AuthContext,
  search: string,
  suspendedOnly: boolean,
  from: number,
  to: number
) => {
  const supabase = getServerSupabase();
  const regionId = scopeToRegion(ctx);

  // `region:region_id(...)` names the FK column: profiles and regions are
  // also linked the other way (regions.admin_user_id), so a bare
  // `regions(...)` embed would be ambiguous (PGRST201).
  let query = supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, location, region_id, region:region_id(name), is_suspended, suspended_reason, suspended_at, created_at', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (regionId) query = query.eq('region_id', regionId);
  if (suspendedOnly) query = query.eq('is_suspended', true);

  const term = sanitizeSearch(search);
  if (term) query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);

  return query.range(from, to);
};

/**
 * Suspends or restores a member. Runs on the service-role client because the
 * login ban lives in auth.users, which only the admin API can change. The
 * caller's admin rights and region have already been checked by the route.
 * ban_duration '876000h' is ~100 years; 'none' lifts the ban.
 */
export const updateAdminMemberSuspension = async (
  userId: string,
  suspended: boolean,
  reason: string | null,
  actorId: string
) => {
  const service = getServiceSupabase();

  const { error: banError } = await service.auth.admin.updateUserById(userId, {
    ban_duration: suspended ? '876000h' : 'none',
  });
  if (banError) return { error: banError };

  const { error } = await service
    .from('profiles')
    .update({
      is_suspended: suspended,
      suspended_reason: suspended ? reason : null,
      suspended_at: suspended ? new Date().toISOString() : null,
      suspended_by: suspended ? actorId : null,
    })
    .eq('id', userId);

  return { error };
};

// ---------------------------------------------------------------------------
// Agencies (TC-14-07) — list, edit, delete.
// ---------------------------------------------------------------------------

export const getAdminAgencies = async (ctx: AuthContext) => {
  const supabase = getServerSupabase();
  const regionId = scopeToRegion(ctx);

  let query = supabase
    .from('agencies')
    .select(`id, name, slug, logo_url, description, is_in_house, approval_status, created_at, owner_id, profiles:owner_id${regionId ? '!inner' : ''}(full_name, region_id)`)
    .order('created_at', { ascending: false });
  if (regionId) query = query.eq('profiles.region_id', regionId);

  return query;
};

export const updateAdminAgency = async (id: string, payload: Record<string, unknown>) => {
  const supabase = getServerSupabase();
  return supabase.from('agencies').update(payload).eq('id', id).select('id');
};

export const deleteAdminAgency = async (id: string) => {
  const supabase = getServerSupabase();
  return supabase.from('agencies').delete().eq('id', id).select('id');
};
