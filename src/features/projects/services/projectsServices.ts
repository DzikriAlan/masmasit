import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type {
  DataProjects,
  DataProjectsBids,
  DataProjectsDetail,
  PayloadGetProjects,
  PayloadPostProjects,
  PayloadPostProjectsBid,
} from '../types/projectsTypes';

export const getProjects = async (payload: PayloadGetProjects) => {
  let query = supabase
    .from('projects')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false });

  if (payload.statusFilter !== 'all') query = query.eq('status', payload.statusFilter);
  if (payload.search) {
    query = query.or(`title.ilike.%${payload.search}%,description.ilike.%${payload.search}%`);
  }

  return toApiResponse<DataProjects[]>(query.limit(50), 'Projects retrieved successfully');
};

export const postProjects = async (payload: PayloadPostProjects) => {
  return toApiResponse<null>(supabase.from('projects').insert(payload), 'Project created successfully');
};

export const getProjectsDetail = async (id: string) => {
  return toApiResponse<DataProjectsDetail>(
    supabase.from('projects').select('*, profiles(full_name)').eq('id', id).maybeSingle(),
    'Project retrieved successfully'
  );
};

export const getProjectsBids = async (projectId: string) => {
  return toApiResponse<DataProjectsBids[]>(
    supabase
      .from('project_bids')
      .select('*, profiles(full_name)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false }),
    'Bids retrieved successfully'
  );
};

export const postProjectsBid = async (payload: PayloadPostProjectsBid) => {
  return toApiResponse<null>(
    supabase.from('project_bids').insert(payload),
    'Bid submitted successfully'
  );
};

/**
 * Accepting a bid used to be three separate calls (accept, reject the rest,
 * move the project to in_progress); a failure part-way left the project
 * inconsistent. `accept_project_bid` does all three in one transaction and
 * verifies the caller owns the project.
 */
export const postProjectsBidAccepted = async (bidId: string, projectId: string) => {
  return toApiResponse<null>(
    supabase.rpc('accept_project_bid', { p_bid_id: bidId, p_project_id: projectId }),
    'Bid accepted successfully'
  );
};

export const updateProjectsStatus = async (projectId: string, status: string) => {
  return toApiResponse<null>(
    supabase.from('projects').update({ status }).eq('id', projectId),
    'Project status updated successfully'
  );
};
