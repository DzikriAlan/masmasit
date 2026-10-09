import { supabase } from '@/shared/lib/supabase';
import { API_ERROR_CODE, errorResponse, successResponse, toApiResponse } from '@/shared/lib/apiResponse';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/shared/lib/api';

import type {
  AdminModerationType,
  DataAdminAgencies,
  DataAdminAgencyService,
  DataAdminApplication,
  DataAdminMember,
  PayloadGetAdminList,
  PayloadGetAdminMembers,
  PayloadGetAdminModeration,
  PayloadPatchAdminAgency,
  PayloadPatchAdminMemberSuspension,
  DataAdminAnalytics,
  DataAdminApprovals,
  DataAdminArticle,
  DataAdminAuditLog,
  DataAdminCaseStudy,
  DataAdminOnboarding,
  DataAdminModeration,
  DataAdminPayments,
  DataAdminSettings,
  DataAdminStats,
  DataAdminTeamCollabs,
  DataAdminUser,
  DataAdminUserActivity,
  PayloadPatchAdminSettings,
  PayloadPostAdminRole,
} from '../types/adminTypes';

const getMonthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
};

export const getAdminSettings = async () => {
  return toApiResponse<DataAdminSettings>(
    supabase.from('app_settings').select('*').maybeSingle(),
    'Settings retrieved successfully'
  );
};

export const getAdminStats = async () => {
  try {
    const monthStart = getMonthStart();
    const [members, jobs, projects, courses, bookings, agencyProjects] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('agency_projects').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    ]);

    return successResponse<DataAdminStats>(
      {
        members: members.count ?? 0,
        jobs: jobs.count ?? 0,
        projects: projects.count ?? 0,
        courses: courses.count ?? 0,
        bookings: bookings.count ?? 0,
        agencyProjects: agencyProjects.count ?? 0,
      },
      'Admin stats retrieved successfully'
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, message);
  }
};

export const getAdminAgencyProjects = async () => {
  return toApiResponse<Record<string, any>[]>(
    supabase
      .from('agency_projects')
      .select('*, agency_services(category, title)')
      .order('created_at', { ascending: false }),
    'Agency projects retrieved successfully'
  );
};

export const getAdminAnalytics = async () => {
  try {
    const [profiles, roleData, jobsData, appsData, bookingsData, agencyData] = await Promise.all([
      supabase.from('profiles').select('created_at'),
      supabase.from('user_roles').select('role'),
      supabase.from('jobs').select('created_at'),
      supabase.from('job_applications').select('created_at'),
      supabase.from('bookings').select('amount, created_at, payment_status'),
      supabase.from('agency_projects').select('budget, dp_amount, dp_payment_status, final_payment_status, created_at'),
    ]);

    return successResponse<DataAdminAnalytics>(
      {
        profiles: (profiles.data ?? undefined) as DataAdminAnalytics['profiles'],
        roleData: (roleData.data ?? undefined) as DataAdminAnalytics['roleData'],
        jobsData: (jobsData.data ?? undefined) as DataAdminAnalytics['jobsData'],
        appsData: (appsData.data ?? undefined) as DataAdminAnalytics['appsData'],
        bookingsData: (bookingsData.data ?? undefined) as DataAdminAnalytics['bookingsData'],
        agencyData: (agencyData.data ?? undefined) as DataAdminAnalytics['agencyData'],
      },
      'Analytics retrieved successfully'
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, message);
  }
};

export const updateAdminSettings = async (id: string, payload: PayloadPatchAdminSettings) => {
  return toApiResponse<null>(
    supabase.from('app_settings').update(payload).eq('id', id),
    'Settings updated successfully'
  );
};

export const updateAdminAgencyStatus = async (id: string, status: string) => {
  return toApiResponse<null>(
    supabase.from('agency_projects').update({ status }).eq('id', id),
    'Agency project status updated successfully'
  );
};

// --- Endpoints under /api/v1/admin -----------------------------------------
// These run server-side because they need privileges the browser client does
// not have under RLS (reading every user's roles, granting roles, audit logs).

export const getAdminUsers = async (search: string) => {
  return apiGet<DataAdminUser[]>('/admin/roles', { search });
};

export const postAdminUserRole = async (payload: PayloadPostAdminRole) => {
  return apiPost<null>('/admin/roles', payload);
};

export const deleteAdminUserRole = async (userId: string, role: string) => {
  return apiDelete<null>('/admin/roles', { userId, role });
};

export const getAdminApprovals = async (includeAll = false) => {
  return apiGet<DataAdminApprovals>('/admin/approvals', { all: includeAll });
};

// Company / coach-talent approvals go through the server so the caller's
// region is checked and the decision lands in the audit log (TC-14-05).
export const patchAdminCompanyApproval = async (id: string, status: string) => {
  return apiPatch<null>(`/admin/companies/${id}`, { status });
};

export const patchAdminPersonApproval = async (
  id: string,
  field: 'coach_approved' | 'talent_approved',
  status: string
) => {
  return apiPatch<null>(`/admin/people/${id}`, { field, status });
};

export const getAdminPayments = async () => {
  return apiGet<DataAdminPayments[]>('/admin/payments');
};

export const patchAdminPayment = async (
  table: DataAdminPayments['table'],
  id: string,
  action: 'paid' | 'reset',
  subField?: string
) => {
  return apiPatch<null>(`/admin/payments/${table}/${id}`, { action, subField });
};

export const getAdminModeration = async (payload: PayloadGetAdminModeration) => {
  return apiGet<DataAdminModeration[]>('/admin/moderation', {
    type: payload.type,
    search: payload.search,
    page: payload.page,
    limit: payload.limit,
  });
};

export const patchAdminModeration = async (
  type: AdminModerationType,
  id: string,
  payload: { is_featured?: boolean; promoted_to_spotlight?: boolean }
) => {
  return apiPatch<null>(`/admin/moderation/${type}/${id}`, payload);
};

export const deleteAdminModeration = async (type: AdminModerationType, id: string) => {
  return apiDelete<null>(`/admin/moderation/${type}/${id}`);
};

export const getAdminApplications = async (payload: PayloadGetAdminList) => {
  return apiGet<DataAdminApplication[]>('/admin/applications', {
    search: payload.search,
    page: payload.page,
    limit: payload.limit,
  });
};

export const getAdminMembers = async (payload: PayloadGetAdminMembers) => {
  return apiGet<DataAdminMember[]>('/admin/members', {
    search: payload.search,
    page: payload.page,
    limit: payload.limit,
    suspended: payload.suspendedOnly || undefined,
  });
};

export const patchAdminMemberSuspension = async (id: string, payload: PayloadPatchAdminMemberSuspension) => {
  return apiPatch<null>(`/admin/members/${id}/suspension`, payload);
};

export const getAdminAgencies = async () => {
  return apiGet<DataAdminAgencies[]>('/admin/agencies');
};

export const patchAdminAgency = async (id: string, payload: PayloadPatchAdminAgency) => {
  return apiPatch<null>(`/admin/agencies/${id}`, payload);
};

export const deleteAdminAgency = async (id: string) => {
  return apiDelete<null>(`/admin/agencies/${id}`);
};

export const patchAdminTeamCollabsClose = async (id: string) => {
  return apiPatch<null>(`/admin/team-collabs/${id}`, { status: 'closed' });
};

export const updateAdminEventApproval = async (id: string, status: string) => {
  return apiPatch<null>(`/admin/events/${id}`, { status });
};

export const getAdminRoleDistribution = async () => {
  return apiGet<{ role: string }[]>('/admin/analytics');
};

export const getAdminAuditLogs = async () => {
  return apiGet<DataAdminAuditLog[]>('/admin/audit-logs');
};

export const getAdminUserActivity = async () => {
  return apiGet<DataAdminUserActivity[]>('/admin/user-activity');
};

export const getAdminOnboarding = async () => {
  return apiGet<DataAdminOnboarding[]>('/admin/onboarding');
};

export const getAdminAgencyServices = async () => {
  return apiGet<DataAdminAgencyService[]>('/admin/agency-services');
};

export const postAdminAgencyService = async (payload: Record<string, unknown>) => {
  return apiPost<null>('/admin/agency-services', payload);
};

export const updateAdminAgencyService = async (id: string, payload: Record<string, unknown>) => {
  return apiPatch<null>(`/admin/agency-services/${id}`, payload);
};

export const deleteAdminAgencyService = async (id: string) => {
  return apiDelete<null>(`/admin/agency-services/${id}`);
};

export const getAdminCaseStudies = async () => {
  return apiGet<DataAdminCaseStudy[]>('/admin/case-studies');
};

export const postAdminCaseStudy = async (payload: Record<string, unknown>) => {
  return apiPost<null>('/admin/case-studies', payload);
};

export const updateAdminCaseStudy = async (id: string, payload: Record<string, unknown>) => {
  return apiPatch<null>(`/admin/case-studies/${id}`, payload);
};

export const deleteAdminCaseStudy = async (id: string) => {
  return apiDelete<null>(`/admin/case-studies/${id}`);
};

export const getAdminRegions = async () => {
  return toApiResponse<{ id: string; name: string }[]>(
    supabase.from('regions').select('id, name').order('name'),
    'Regions retrieved successfully'
  );
};

// Agency approval — client-side updates to `approval_status` are reverted
// by the guard_agencies_approval trigger (migration 015), so approving one
// only ever goes through this server route.
export const updateAdminAgencyApproval = async (id: string, status: string) => {
  return apiPatch<null>(`/admin/agencies/${id}`, { status });
};

export const getAdminTeamCollabs = async () => {
  return apiGet<DataAdminTeamCollabs[]>('/admin/team-collabs');
};

export const updateAdminTeamCollabsMatch = async (id: string, matchedWith: string) => {
  return apiPatch<null>(`/admin/team-collabs/${id}`, { matched_with: matchedWith });
};

export const getAdminArticles = async () => {
  return apiGet<DataAdminArticle[]>('/admin/articles');
};

export const postAdminArticle = async (payload: Record<string, unknown>) => {
  return apiPost<null>('/admin/articles', payload);
};

export const updateAdminArticle = async (id: string, payload: Record<string, unknown>) => {
  return apiPatch<null>(`/admin/articles/${id}`, payload);
};

export const deleteAdminArticle = async (id: string) => {
  return apiDelete<null>(`/admin/articles/${id}`);
};
