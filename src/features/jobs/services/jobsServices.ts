import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type {
  DataJobs,
  DataJobsApplicant,
  DataJobsMyApplication,
  DataJobsOwned,
  DataJobsCompany,
  DataJobsDetail,
  PayloadGetJobs,
  PayloadPostJobsApplication,
  PayloadPostJobsCompany,
  PayloadPostJobsPosting,
  PayloadPostJobsUserRole,
} from '../types/jobsTypes';

export const getJobsUserSkills = async (userId: string) => {
  return toApiResponse<{ skill_id: string; level: string }[]>(
    supabase.from('user_skills').select('skill_id, level').eq('user_id', userId),
    'User skills retrieved successfully'
  );
};

export const getJobs = async (payload: PayloadGetJobs) => {
  let query = supabase
    .from('jobs')
    .select('*, companies(name, logo_url, id)')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (payload.search) {
    query = query.or(`title.ilike.%${payload.search}%,description.ilike.%${payload.search}%`);
  }
  if (payload.typeFilter !== 'all') {
    query = query.eq('job_type', payload.typeFilter);
  }
  if (payload.locationFilter !== 'all') {
    query = query.eq('location', payload.locationFilter);
  }

  return toApiResponse<DataJobs[]>(query.limit(50), 'Jobs retrieved successfully');
};

export const getJobsDetail = async (id: string) => {
  return toApiResponse<DataJobsDetail>(
    supabase
      .from('jobs')
      .select('*, companies(name, logo_url, description, website, location)')
      .eq('id', id)
      .maybeSingle(),
    'Job retrieved successfully'
  );
};

export const getJobsApplication = async (jobId: string, userId: string) => {
  return toApiResponse<{ id: string }>(
    supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('user_id', userId)
      .maybeSingle(),
    'Application retrieved successfully'
  );
};

export const postJobsApplication = async (payload: PayloadPostJobsApplication) => {
  return toApiResponse<null>(
    supabase.from('job_applications').insert(payload),
    'Application submitted successfully'
  );
};

export const getJobsCompany = async (userId: string) => {
  return toApiResponse<DataJobsCompany>(
    supabase.from('companies').select('*').eq('user_id', userId).maybeSingle(),
    'Company retrieved successfully'
  );
};

export const postJobsCompany = async (payload: PayloadPostJobsCompany) => {
  return toApiResponse<null>(supabase.from('companies').insert(payload), 'Company created successfully');
};

export const postJobsUserRole = async (payload: PayloadPostJobsUserRole) => {
  return toApiResponse<null>(supabase.from('user_roles').insert(payload), 'Role assigned successfully');
};

export const postJobsPosting = async (payload: PayloadPostJobsPosting) => {
  return toApiResponse<null>(supabase.from('jobs').insert(payload), 'Job posted successfully');
};

// --- Employer side ----------------------------------------------------------

/** Jobs owned by a company, with an application count. */
export const getJobsOwned = async (companyId: string) => {
  return toApiResponse<DataJobsOwned[]>(
    supabase
      .from('jobs')
      .select('id, title, status, created_at, job_applications(id)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
    'Jobs retrieved successfully'
  );
};

export const getJobsApplicants = async (jobId: string) => {
  return toApiResponse<DataJobsApplicant[]>(
    supabase
      .from('job_applications')
      .select('*, profiles(full_name, avatar_url, location)')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false }),
    'Applicants retrieved successfully'
  );
};

export const updateJobsApplicationStatus = async (applicationId: string, status: string) => {
  return toApiResponse<null>(
    supabase.from('job_applications').update({ status }).eq('id', applicationId),
    'Application status updated successfully'
  );
};

export const updateJobsStatus = async (jobId: string, status: string) => {
  return toApiResponse<null>(
    supabase.from('jobs').update({ status }).eq('id', jobId),
    'Job status updated successfully'
  );
};

// --- Applicant side ---------------------------------------------------------

/**
 * PostgREST types embedded to-one relations as arrays while returning objects,
 * so the builder is widened before it is wrapped.
 */
export const getJobsMyApplications = async (userId: string) => {
  const query = supabase
    .from('job_applications')
    .select('id, status, created_at, jobs(id, title, job_type, location, companies(name))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return toApiResponse<DataJobsMyApplication[]>(
    query as unknown as PromiseLike<{ data: DataJobsMyApplication[] | null; error: null }>,
    'Applications retrieved successfully'
  );
};
