import { supabase } from '@/shared/lib/supabase';
import { API_ERROR_CODE, errorResponse, successResponse, toApiResponse } from '@/shared/lib/apiResponse';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/shared/lib/api';

import type {
  DataAdminAgencyService,
  DataAdminAnalytics,
  DataAdminApprovals,
  DataAdminAuditLog,
  DataAdminCaseStudy,
  DataAdminCoaches,
  DataAdminCompanies,
  DataAdminModeration,
  DataAdminPayments,
  DataAdminSettings,
  DataAdminStats,
  DataAdminUser,
  PayloadPatchAdminSettings,
  PayloadPostAdminRole,
} from '../types/adminTypes';

const getMonthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
};

export const getAdminCompanies = async () => {
  return toApiResponse<DataAdminCompanies[]>(
    supabase.from('companies').select('*, profiles(full_name)').order('created_at', { ascending: false }),
    'Companies retrieved successfully'
  );
};

export const getAdminCoaches = async () => {
  return toApiResponse<DataAdminCoaches[]>(
    supabase
      .from('profiles')
      .select('id, full_name, bio, is_coach, coach_approved, is_talent, talent_approved')
      .or('is_coach.eq.true,is_talent.eq.true')
      .order('created_at', { ascending: false }),
    'Coach and talent applications retrieved successfully'
  );
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

export const getAdminModeration = async () => {
  try {
    const [jobs, projects, courses, events] = await Promise.all([
      supabase.from('jobs').select('id, title, created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('projects').select('id, title, created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('courses').select('id, title, created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('events').select('id, title, created_at').order('created_at', { ascending: false }).limit(10),
    ]);

    const items: DataAdminModeration[] = [];
    (jobs.data ?? []).forEach((j) => items.push({ type: 'jobs', id: j.id, title: j.title, meta: 'Job' }));
    (projects.data ?? []).forEach((p) => items.push({ type: 'projects', id: p.id, title: p.title, meta: 'Project' }));
    (courses.data ?? []).forEach((c) => items.push({ type: 'courses', id: c.id, title: c.title, meta: 'Course' }));
    (events.data ?? []).forEach((e) => items.push({ type: 'events', id: e.id, title: e.title, meta: 'Event' }));

    return successResponse(items, 'Moderation queue retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, message);
  }
};

export const getAdminPayments = async () => {
  try {
    const pending = ['unpaid', 'awaiting_confirmation'];
    const [bookings, enrollments, rsvps, agency] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, payment_status, payment_note, amount, created_at, client_name, client_email, client_id, profiles:talent_id(full_name)')
        .in('payment_status', pending)
        .order('created_at', { ascending: false }),
      supabase
        .from('enrollments')
        .select('id, payment_status, payment_note, created_at, user_id, courses(title, price)')
        .in('payment_status', pending)
        .order('created_at', { ascending: false }),
      supabase
        .from('event_rsvps')
        .select('id, payment_status, payment_note, created_at, user_id, events(title, price)')
        .in('payment_status', pending)
        .order('created_at', { ascending: false }),
      supabase
        .from('agency_projects')
        .select('id, dp_payment_status, dp_payment_note, final_payment_status, final_payment_note, budget, dp_amount, created_at, client_name, client_company, agency_services(title)')
        .order('created_at', { ascending: false }),
    ]);

    const rows: DataAdminPayments[] = [];
    (bookings.data ?? []).forEach((r: any) =>
      rows.push({ table: 'bookings', id: r.id, category: 'Booking', item: r.profiles?.full_name ?? 'Talent', amount: r.amount, status: r.payment_status, note: r.payment_note, user: r.client_name ?? r.client_id, created_at: r.created_at })
    );
    (enrollments.data ?? []).forEach((r: any) =>
      rows.push({ table: 'enrollments', id: r.id, category: 'Course', item: r.courses?.title ?? 'Course', amount: r.courses?.price ?? 0, status: r.payment_status, note: r.payment_note, user: r.user_id, created_at: r.created_at })
    );
    (rsvps.data ?? []).forEach((r: any) =>
      rows.push({ table: 'event_rsvps', id: r.id, category: 'Event', item: r.events?.title ?? 'Event', amount: r.events?.price ?? 0, status: r.payment_status, note: r.payment_note, user: r.user_id, created_at: r.created_at })
    );
    (agency.data ?? []).forEach((r: any) => {
      if (pending.includes(r.dp_payment_status)) {
        rows.push({ table: 'agency_projects', id: r.id, subField: 'dp', category: 'Agency DP', item: r.agency_services?.title ?? 'Project', amount: r.dp_amount ?? r.budget ?? 0, status: r.dp_payment_status, note: r.dp_payment_note, user: r.client_name, created_at: r.created_at });
      }
      if (pending.includes(r.final_payment_status)) {
        rows.push({ table: 'agency_projects', id: r.id, subField: 'final', category: 'Agency Final', item: r.agency_services?.title ?? 'Project', amount: r.budget ?? 0, status: r.final_payment_status, note: r.final_payment_note, user: r.client_name, created_at: r.created_at });
      }
    });

    rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return successResponse(rows, 'Pending payments retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return errorResponse(API_ERROR_CODE.INTERNAL_SERVER_ERROR, message);
  }
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

export const updateAdminCompanyApproval = async (id: string, status: string) => {
  return toApiResponse<null>(
    supabase.from('companies').update({ approval_status: status }).eq('id', id),
    'Company approval updated successfully'
  );
};

export const updateAdminUserApproval = async (
  id: string,
  field: 'coach_approved' | 'talent_approved',
  status: string
) => {
  return toApiResponse<null>(
    supabase.from('profiles').update({ [field]: status }).eq('id', id),
    'User approval updated successfully'
  );
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

export const updateAdminPaymentPaid = async (
  table: string,
  id: string,
  userId: string | undefined,
  subField?: string
) => {
  if (table === 'agency_projects') {
    const statusField = subField === 'dp' ? 'dp_payment_status' : 'final_payment_status';
    const confirmedAtField = subField === 'dp' ? 'dp_payment_confirmed_at' : 'final_payment_confirmed_at';
    const confirmedByField = subField === 'dp' ? 'dp_payment_confirmed_by' : 'final_payment_confirmed_by';
    return toApiResponse<null>(
      supabase
        .from('agency_projects')
        .update({
          [statusField]: 'paid',
          [confirmedAtField]: new Date().toISOString(),
          [confirmedByField]: userId,
        })
        .eq('id', id),
      'Payment marked as paid successfully'
    );
  }

  return toApiResponse<null>(
    supabase
      .from(table)
      .update({ payment_status: 'paid', payment_confirmed_at: new Date().toISOString(), payment_confirmed_by: userId })
      .eq('id', id),
    'Payment marked as paid successfully'
  );
};

export const updateAdminPaymentReset = async (table: string, id: string, subField?: string) => {
  if (table === 'agency_projects') {
    const statusField = subField === 'dp' ? 'dp_payment_status' : 'final_payment_status';
    const noteField = subField === 'dp' ? 'dp_payment_note' : 'final_payment_note';
    return toApiResponse<null>(
      supabase.from('agency_projects').update({ [statusField]: 'unpaid', [noteField]: null }).eq('id', id),
      'Payment reset successfully'
    );
  }

  return toApiResponse<null>(
    supabase.from(table).update({ payment_status: 'unpaid', payment_note: null }).eq('id', id),
    'Payment reset successfully'
  );
};

export const deleteAdminContent = async (table: string, id: string) => {
  return toApiResponse<null>(
    supabase.from(table).delete().eq('id', id),
    'Content deleted successfully'
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

export const getAdminApprovals = async () => {
  return apiGet<DataAdminApprovals>('/admin/approvals');
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
