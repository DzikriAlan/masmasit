import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type {
  DataDiscussions,
  DataDiscussionsComments,
  PayloadPatchDiscussions,
  PayloadPatchDiscussionsComments,
  PayloadPostDiscussions,
  PayloadPostDiscussionsComments,
} from '../types/discussionsTypes';

export const getDiscussions = async () => {
  return toApiResponse<DataDiscussions[]>(
    supabase
      .from('discussions')
      .select('*, profiles(full_name, avatar_url), discussion_comments(count)')
      .order('created_at', { ascending: false }),
    'Discussions retrieved successfully'
  );
};

// Discover's "Tulisan Member" strand — threads an admin has promoted.
export const getDiscussionsFeatured = async () => {
  return toApiResponse<DataDiscussions[]>(
    supabase
      .from('discussions')
      .select('*, profiles(full_name, avatar_url)')
      .eq('is_featured', true)
      .order('created_at', { ascending: false }),
    'Featured discussions retrieved successfully'
  );
};

export const getDiscussionsDetail = async (id: string) => {
  return toApiResponse<DataDiscussions>(
    supabase.from('discussions').select('*, profiles(full_name, avatar_url)').eq('id', id).single(),
    'Discussion retrieved successfully'
  );
};

export const getDiscussionsComments = async (discussionId: string) => {
  return toApiResponse<DataDiscussionsComments[]>(
    supabase
      .from('discussion_comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('discussion_id', discussionId)
      .order('created_at', { ascending: true }),
    'Comments retrieved successfully'
  );
};

export const postDiscussions = async (payload: PayloadPostDiscussions) => {
  return toApiResponse<{ id: string }>(
    supabase.from('discussions').insert(payload).select('id').single(),
    'Discussion posted successfully'
  );
};

export const postDiscussionsComments = async (payload: PayloadPostDiscussionsComments) => {
  return toApiResponse<{ id: string }>(
    supabase.from('discussion_comments').insert(payload).select('id').single(),
    'Comment posted successfully'
  );
};

// `.select('id')` on writes: RLS silently filters rows a member may not touch,
// so an empty result is how a denied edit/delete shows up.
export const patchDiscussions = async (id: string, payload: PayloadPatchDiscussions) => {
  return toApiResponse<{ id: string }[]>(
    supabase.from('discussions').update(payload).eq('id', id).select('id'),
    'Discussion updated successfully'
  );
};

export const deleteDiscussions = async (id: string) => {
  return toApiResponse<{ id: string }[]>(
    supabase.from('discussions').delete().eq('id', id).select('id'),
    'Discussion deleted successfully'
  );
};

export const patchDiscussionsComments = async (id: string, payload: PayloadPatchDiscussionsComments) => {
  return toApiResponse<{ id: string }[]>(
    supabase.from('discussion_comments').update(payload).eq('id', id).select('id'),
    'Comment updated successfully'
  );
};

export const deleteDiscussionsComments = async (id: string) => {
  return toApiResponse<{ id: string }[]>(
    supabase.from('discussion_comments').delete().eq('id', id).select('id'),
    'Comment deleted successfully'
  );
};
