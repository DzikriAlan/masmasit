import { supabase } from '@/shared/lib/supabase';

export const getUserSkills = async (userId: string) => {
  return supabase.from('user_skills').select('skill_id, level').eq('user_id', userId);
};

export const getJobs = async (search: string, typeFilter: string, locationFilter: string) => {
  let query = supabase
    .from('jobs')
    .select('*, companies(name, logo_url, id)')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }
  if (typeFilter !== 'all') {
    query = query.eq('job_type', typeFilter);
  }
  if (locationFilter !== 'all') {
    query = query.eq('location', locationFilter);
  }

  return query.limit(50);
};

export const getJobDetail = async (id: string) => {
  return supabase
    .from('jobs')
    .select('*, companies(name, logo_url, description, website, location)')
    .eq('id', id)
    .maybeSingle();
};

export const getJobApplication = async (jobId: string, userId: string) => {
  return supabase
    .from('job_applications')
    .select('id')
    .eq('job_id', jobId)
    .eq('user_id', userId)
    .maybeSingle();
};

export const postJobApplication = async (payload: { job_id: string; user_id: string; cover_letter: string | null }) => {
  return supabase.from('job_applications').insert(payload);
};

export const getUserCompany = async (userId: string) => {
  return supabase.from('companies').select('*').eq('user_id', userId).maybeSingle();
};

export const postCompany = async (payload: Record<string, unknown>) => {
  return supabase.from('companies').insert(payload);
};

export const postUserRole = async (payload: { user_id: string; role: string }) => {
  return supabase.from('user_roles').insert(payload);
};

export const postJobPosting = async (payload: Record<string, unknown>) => {
  return supabase.from('jobs').insert(payload);
};
