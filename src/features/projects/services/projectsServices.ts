import { supabase } from '@/shared/lib/supabase';

export const getProjects = async (search: string, statusFilter: string) => {
  let query = supabase
    .from('projects')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false });

  if (statusFilter !== 'all') query = query.eq('status', statusFilter);
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);

  return query.limit(50);
};

export const postProject = async (payload: Record<string, unknown>) => {
  return supabase.from('projects').insert(payload);
};

export const getProjectDetail = async (id: string) => {
  return supabase.from('projects').select('*, profiles(full_name)').eq('id', id).maybeSingle();
};

export const getProjectBids = async (projectId: string) => {
  return supabase
    .from('project_bids')
    .select('*, profiles(full_name)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
};

export const postProjectBid = async (payload: Record<string, unknown>) => {
  return supabase.from('project_bids').insert(payload);
};

export const updateBidStatus = async (bidId: string, status: string) => {
  return supabase.from('project_bids').update({ status }).eq('id', bidId);
};

export const updateOtherBidsRejected = async (bidId: string, projectId: string) => {
  return supabase.from('project_bids').update({ status: 'rejected' }).neq('id', bidId).eq('project_id', projectId);
};

export const updateProjectStatus = async (projectId: string, status: string) => {
  return supabase.from('projects').update({ status }).eq('id', projectId);
};
