import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type {
  DataJobsEditable,
  DataJobsLocation,
  DataJobsMatchSkill,
  DataJobsSkill,
  DataJobsType,
  PayloadUpdateJobs,
} from '../types/jobsEditTypes';

/** Reference table (034): replaces the job types hard-coded in the form and filters. */
export const getJobsTypes = async () => {
  return toApiResponse<DataJobsType[]>(
    supabase.from('job_types').select('slug, label_en, label_id, sort_order').order('sort_order'),
    'Job types retrieved successfully'
  );
};

/** Reference table (034): replaces the hard-coded location list. */
export const getJobsLocations = async () => {
  return toApiResponse<DataJobsLocation[]>(
    supabase.from('job_locations').select('id, name, sort_order').order('sort_order'),
    'Job locations retrieved successfully'
  );
};

export const getJobsSkillsCatalog = async () => {
  return toApiResponse<DataJobsSkill[]>(
    supabase.from('skills').select('id, name, category').order('name'),
    'Skills retrieved successfully'
  );
};

export const getJobsEditable = async (jobId: string) => {
  return toApiResponse<DataJobsEditable>(
    supabase
      .from('jobs')
      .select('id, title, description, location, job_type, salary_min, salary_max, deadline, skills')
      .eq('id', jobId)
      .maybeSingle(),
    'Job retrieved successfully'
  );
};

/** `.select('id')` so an update RLS filtered out is an error, not a silent success. */
export const updateJobs = async (jobId: string, payload: PayloadUpdateJobs) => {
  return toApiResponse<{ id: string }>(
    supabase.from('jobs').update(payload).eq('id', jobId).select('id').single(),
    'Job updated successfully'
  );
};

/** The member's skills by name, for the match score on job cards. */
export const getJobsMatchUserSkills = async (userId: string) => {
  const query = supabase.from('user_skills').select('level, skills(name)').eq('user_id', userId);
  return toApiResponse<DataJobsMatchSkill[]>(
    query as unknown as PromiseLike<{ data: DataJobsMatchSkill[] | null; error: null }>,
    'User skills retrieved successfully'
  );
};

