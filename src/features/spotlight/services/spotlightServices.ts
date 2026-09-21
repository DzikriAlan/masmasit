import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

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
