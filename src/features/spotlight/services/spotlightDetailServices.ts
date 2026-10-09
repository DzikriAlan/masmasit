import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type { DataSpotlightDetail } from '../types/spotlightDetailTypes';

// One Spotlight entry: a `builds` row promoted to Spotlight. Readable by
// guests through the anon policy from migration 028.
export const getSpotlightDetail = async (id: string) => {
  return toApiResponse<DataSpotlightDetail>(
    supabase
      .from('builds')
      .select('*, profiles!builds_user_id_profiles_fkey(full_name, avatar_url), agencies(name, slug)')
      .eq('id', id)
      .eq('promoted_to_spotlight', true)
      .maybeSingle(),
    'Spotlight entry retrieved successfully'
  );
};
