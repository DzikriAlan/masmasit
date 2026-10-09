import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type { DataBuilds, PayloadPatchBuilds, PayloadPostBuilds } from '../types/buildsTypes';

export const getBuilds = async () => {
  return toApiResponse<DataBuilds[]>(
    supabase.from('builds').select('*, profiles!builds_user_id_profiles_fkey(full_name, avatar_url)').order('created_at', { ascending: false }),
    'Builds retrieved successfully'
  );
};

export const getBuildsLiked = async (userId: string) => {
  return toApiResponse<{ build_id: string }[]>(
    supabase.from('build_likes').select('build_id').eq('user_id', userId),
    'Liked builds retrieved successfully'
  );
};

export const postBuilds = async (payload: PayloadPostBuilds) => {
  return toApiResponse<{ id: string }>(
    supabase.from('builds').insert(payload).select('id').single(),
    'Build posted successfully'
  );
};

export const postBuildsLike = async (buildId: string, userId: string) => {
  return toApiResponse<null>(
    supabase.from('build_likes').insert({ build_id: buildId, user_id: userId }),
    'Liked'
  );
};

export const deleteBuildsLike = async (buildId: string, userId: string) => {
  return toApiResponse<null>(
    supabase.from('build_likes').delete().eq('build_id', buildId).eq('user_id', userId),
    'Unliked'
  );
};

// `.select('id')` on writes: RLS silently skips rows that are not the
// caller's, so an empty result is how a denied edit/delete shows up.
export const patchBuilds = async (id: string, payload: PayloadPatchBuilds) => {
  return toApiResponse<{ id: string }[]>(
    supabase.from('builds').update(payload).eq('id', id).select('id'),
    'Build updated successfully'
  );
};

export const deleteBuilds = async (id: string) => {
  return toApiResponse<{ id: string }[]>(
    supabase.from('builds').delete().eq('id', id).select('id'),
    'Build deleted successfully'
  );
};
