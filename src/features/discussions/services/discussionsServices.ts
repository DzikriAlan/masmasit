import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type {
  DataDiscussions,
  DataDiscussionsComments,
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
