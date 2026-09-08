import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';
import type { Skill } from '@/shared/lib/types';

import type {
  PayloadPostOnboardingExperiences,
  PayloadPostOnboardingProfile,
  PayloadPostOnboardingSkills,
} from '../types/onboardingTypes';

export const getOnboardingSkills = async () => {
  return toApiResponse<Skill[]>(
    supabase.from('skills').select('*').order('name'),
    'Skills retrieved successfully'
  );
};

export const postOnboardingProfile = async (payload: PayloadPostOnboardingProfile) => {
  return toApiResponse<null>(supabase.from('profiles').upsert(payload), 'Profile saved successfully');
};

export const deleteOnboardingSkills = async (userId: string) => {
  return toApiResponse<null>(
    supabase.from('user_skills').delete().eq('user_id', userId),
    'Skills cleared successfully'
  );
};

export const postOnboardingSkills = async (payload: PayloadPostOnboardingSkills[]) => {
  return toApiResponse<null>(supabase.from('user_skills').insert(payload), 'Skills saved successfully');
};

export const deleteOnboardingExperiences = async (userId: string) => {
  return toApiResponse<null>(
    supabase.from('experiences').delete().eq('user_id', userId),
    'Experiences cleared successfully'
  );
};

export const postOnboardingExperiences = async (payload: PayloadPostOnboardingExperiences[]) => {
  return toApiResponse<null>(
    supabase.from('experiences').insert(payload),
    'Experiences saved successfully'
  );
};
