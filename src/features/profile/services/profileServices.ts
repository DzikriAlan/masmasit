import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type { PayloadPatchProfile } from '../types/profileTypes';

export const updateProfile = async (userId: string, payload: PayloadPatchProfile) => {
  return toApiResponse<null>(
    supabase.from('profiles').update(payload).eq('id', userId),
    'Profile updated successfully'
  );
};

export const updateProfileTalentApplication = async (userId: string) => {
  return toApiResponse<null>(
    supabase.from('profiles').update({ is_talent: true, talent_approved: 'pending' }).eq('id', userId),
    'Talent application submitted successfully'
  );
};

export const updateProfileCoachApplication = async (userId: string) => {
  return toApiResponse<null>(
    supabase.from('profiles').update({ is_coach: true, coach_approved: 'pending' }).eq('id', userId),
    'Coach application submitted successfully'
  );
};
