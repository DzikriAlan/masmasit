import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type { PayloadPatchBuilds } from '@/features/builds/types/buildsTypes';

import type { DataSpotlight, PayloadPostSpotlight } from '../types/spotlightTypes';

// Spotlight has no table of its own — REST.md Bagian 2 says its data comes
// from Builds plus direct submissions, so it's `builds` filtered to
// `promoted_to_spotlight = true`, ranked by like count as Hot Rank.
export const getSpotlight = async () => {
  return toApiResponse<DataSpotlight[]>(
    supabase
      .from('builds')
      .select('*, profiles!builds_user_id_profiles_fkey(full_name, avatar_url), agencies(name, slug)')
      .eq('promoted_to_spotlight', true)
      .order('likes_count', { ascending: false })
      .order('created_at', { ascending: false }),
    'Spotlight retrieved successfully'
  );
};

export const getSpotlightAgenciesOwned = async (ownerId: string) => {
  return toApiResponse<{ id: string; name: string }[]>(
    supabase.from('agencies').select('id, name').eq('owner_id', ownerId).eq('approval_status', 'approved'),
    'Owned agencies retrieved successfully'
  );
};

export const postSpotlight = async (payload: PayloadPostSpotlight) => {
  return toApiResponse<{ id: string }>(
    supabase
      .from('builds')
      .insert({ ...payload, promoted_to_spotlight: true })
      .select('id')
      .single(),
    'Submitted to Spotlight'
  );
};

// Likes are the same build_likes rows Builds uses — one like, one Hot Rank
// signal, whichever page it was clicked on.
export const getSpotlightLiked = async (userId: string) => {
  return toApiResponse<{ build_id: string }[]>(
    supabase.from('build_likes').select('build_id').eq('user_id', userId),
    'Liked entries retrieved successfully'
  );
};

export const postSpotlightLike = async (buildId: string, userId: string) => {
  return toApiResponse<null>(
    supabase.from('build_likes').insert({ build_id: buildId, user_id: userId }),
    'Liked'
  );
};

export const deleteSpotlightLike = async (buildId: string, userId: string) => {
  return toApiResponse<null>(
    supabase.from('build_likes').delete().eq('build_id', buildId).eq('user_id', userId),
    'Unliked'
  );
};

// `.select('id')`: RLS skips rows the caller doesn't own without raising, so
// an empty result is how a denied edit/delete shows up.
export const patchSpotlight = async (id: string, payload: PayloadPatchBuilds) => {
  return toApiResponse<{ id: string }[]>(
    supabase.from('builds').update(payload).eq('id', id).select('id'),
    'Spotlight entry updated'
  );
};

export const deleteSpotlight = async (id: string) => {
  return toApiResponse<{ id: string }[]>(
    supabase.from('builds').delete().eq('id', id).select('id'),
    'Spotlight entry deleted'
  );
};
