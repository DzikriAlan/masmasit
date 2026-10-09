import { supabase } from '@/shared/lib/supabase';
import { toApiResponse, successResponse } from '@/shared/lib/apiResponse';

import type {
  DataActivityCourse,
  DataActivityEvent,
  DataActivityJob,
  DataActivityJobs,
  DataActivityProjectBid,
  DataActivityProjectPosted,
  DataActivityProjects,
  DataActivityRequest,
  DataActivityRequests,
  DataActivityTeamCollab,
  DataActivityTeamJoined,
  DataActivityTeamOwned,
  DataActivityTeams,
  PayloadPostActivityRequestPayment,
} from '../types/activityTypes';

// PostgREST types to-one embeds as arrays while returning objects, so the
// builders below are widened before they are wrapped.
type Rows<T> = PromiseLike<{ data: T[] | null; error: { code?: string; message?: string } | null }>;

/** Enrollments with the certificate state per course (TC-07-05). */
export const getActivityCourses = async (userId: string) => {
  const [enrollments, certificates] = await Promise.all([
    supabase
      .from('enrollments')
      .select('id, progress, payment_status, courses(id, title, price)')
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false }) as unknown as Rows<Omit<DataActivityCourse, 'certificateIssuedAt'>>,
    supabase.from('certificates').select('course_id, issued_at').eq('user_id', userId),
  ]);
  if (enrollments.error) return toApiResponse<DataActivityCourse[]>(Promise.resolve({ data: null, error: enrollments.error }));

  const issued = new Map((certificates.data ?? []).map((c) => [c.course_id as string, c.issued_at as string]));
  const rows = (enrollments.data ?? []).map((en) => ({
    ...en,
    certificateIssuedAt: en.courses ? issued.get(en.courses.id) ?? null : null,
  }));
  return successResponse<DataActivityCourse[]>(rows, 'Courses retrieved successfully');
};

/** Projects the member posted and bids they placed (TC-03-10). */
export const getActivityProjects = async (userId: string) => {
  const [posted, bids] = await Promise.all([
    supabase
      .from('projects')
      .select('id, title, status, created_at, project_bids(id)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }) as unknown as Rows<DataActivityProjectPosted>,
    supabase
      .from('project_bids')
      .select('id, amount, status, created_at, projects(id, title, status)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }) as unknown as Rows<DataActivityProjectBid>,
  ]);
  const failed = posted.error ?? bids.error;
  if (failed) return toApiResponse<DataActivityProjects>(Promise.resolve({ data: null, error: failed }));
  return successResponse<DataActivityProjects>(
    { posted: posted.data ?? [], bids: bids.data ?? [] },
    'Projects retrieved successfully'
  );
};

/** Event RSVPs (TC-08-06). */
export const getActivityEvents = async (userId: string) => {
  return toApiResponse<DataActivityEvent[]>(
    supabase
      .from('event_rsvps')
      .select('id, status, payment_status, created_at, events(id, title, event_date, location, is_paid, price)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }) as unknown as Rows<DataActivityEvent>,
    'Events retrieved successfully'
  );
};

/** Teams owned, teams joined and the member's Team Collabs listings. */
export const getActivityTeams = async (userId: string) => {
  const [owned, joined, collabs] = await Promise.all([
    supabase
      .from('teams')
      .select('id, name, created_at')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false }) as unknown as Rows<DataActivityTeamOwned>,
    supabase
      .from('team_members')
      .select('id, role_title, teams(id, name)')
      .eq('user_id', userId) as unknown as Rows<DataActivityTeamJoined>,
    supabase
      .from('team_collabs')
      .select('id, focus, status, created_at, teams(id, name)')
      .eq('created_by', userId)
      .order('created_at', { ascending: false }) as unknown as Rows<DataActivityTeamCollab>,
  ]);
  const failed = owned.error ?? joined.error ?? collabs.error;
  if (failed) return toApiResponse<DataActivityTeams>(Promise.resolve({ data: null, error: failed }));

  const ownedIds = new Set((owned.data ?? []).map((team) => team.id));
  return successResponse<DataActivityTeams>(
    {
      owned: owned.data ?? [],
      // An owner is usually on their own roster too; list that team once.
      joined: (joined.data ?? []).filter((m) => !m.teams || !ownedIds.has(m.teams.id)),
      collabs: collabs.data ?? [],
    },
    'Teams retrieved successfully'
  );
};

/** Service requests filed by the member (agency_projects.client_user_id, 031). */
export const getActivityRequests = async (userId: string) => {
  const [requests, settings] = await Promise.all([
    supabase
      .from('agency_projects')
      .select(
        'id, scope, budget, status, dp_amount, dp_payment_status, dp_payment_link_url, dp_payment_note, final_payment_status, final_payment_link_url, final_payment_note, created_at, agency_services(title)'
      )
      .eq('client_user_id', userId)
      .order('created_at', { ascending: false }) as unknown as Rows<DataActivityRequest>,
    supabase.from('app_settings').select('goakal_agency_url').maybeSingle(),
  ]);
  if (requests.error) return toApiResponse<DataActivityRequests>(Promise.resolve({ data: null, error: requests.error }));
  return successResponse<DataActivityRequests>(
    { requests: requests.data ?? [], fallbackUrl: (settings.data?.goakal_agency_url as string | null | undefined) ?? null },
    'Requests retrieved successfully'
  );
};

/** "Already paid? Let us know" for a request's DP or final payment. */
export const postActivityRequestPayment = async (payload: PayloadPostActivityRequestPayment) => {
  return toApiResponse<null>(
    supabase.rpc('report_agency_project_payment', {
      p_project_id: payload.projectId,
      p_stage: payload.stage,
      p_note: payload.note,
    }),
    'Payment confirmation submitted successfully'
  );
};

/** The member's company and its job postings. */
export const getActivityJobs = async (userId: string) => {
  const company = await supabase
    .from('companies')
    .select('id, name, approval_status')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (company.error) return toApiResponse<DataActivityJobs>(Promise.resolve({ data: null, error: company.error }));
  if (!company.data) return successResponse<DataActivityJobs>({ company: null, jobs: [] }, 'No company');

  const jobs = await (supabase
    .from('jobs')
    .select('id, title, status, created_at, job_applications(id)')
    .eq('company_id', company.data.id)
    .order('created_at', { ascending: false }) as unknown as Rows<DataActivityJob>);
  if (jobs.error) return toApiResponse<DataActivityJobs>(Promise.resolve({ data: null, error: jobs.error }));
  return successResponse<DataActivityJobs>(
    { company: company.data as DataActivityJobs['company'], jobs: jobs.data ?? [] },
    'Jobs retrieved successfully'
  );
};
