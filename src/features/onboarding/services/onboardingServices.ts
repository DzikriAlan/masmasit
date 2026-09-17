import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';
import { slugify } from '@/shared/lib/utils';
import type { Skill } from '@/shared/lib/types';

import type {
  PayloadPostOnboardingAgency,
  PayloadPostOnboardingExperiences,
  PayloadPostOnboardingProfile,
  PayloadPostOnboardingRoles,
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

// user_roles already supports one user holding several roles (its unique key
// is (user_id, role)) — multi-select onboarding just inserts one row per
// pick. is_coach/is_talent also flip here so the rest of the app (Coach and
// Talent gating) recognises the choice immediately.
export const postOnboardingRoles = async (payload: PayloadPostOnboardingRoles) => {
  if (payload.roles.length === 0) return toApiResponse<null>(Promise.resolve({ data: null, error: null }), 'No roles to add');

  const rows = payload.roles.map((role) => ({ user_id: payload.user_id, role }));
  const rolesResult = await supabase.from('user_roles').upsert(rows, { onConflict: 'user_id,role', ignoreDuplicates: true });
  if (rolesResult.error) return toApiResponse<null>(Promise.resolve(rolesResult), 'Roles saved successfully');

  const profilePatch: Record<string, boolean> = {};
  if (payload.roles.includes('talent')) profilePatch.is_talent = true;
  if (payload.roles.includes('coach')) profilePatch.is_coach = true;

  if (Object.keys(profilePatch).length === 0) {
    return toApiResponse<null>(Promise.resolve(rolesResult), 'Roles saved successfully');
  }

  return toApiResponse<null>(
    supabase.from('profiles').update(profilePatch).eq('id', payload.user_id),
    'Roles saved successfully'
  );
};

// Agency Owner sub-step (REST.md Bagian 8): creates the agency row as
// `pending`, same approval queue as company accounts (Bagian 7).
export const postOnboardingAgency = async (payload: PayloadPostOnboardingAgency) => {
  return toApiResponse<{ id: string; slug: string }>(
    supabase
      .from('agencies')
      .insert({
        owner_id: payload.owner_id,
        name: payload.name,
        slug: `${slugify(payload.name)}-${payload.owner_id.slice(0, 8)}`,
        logo_url: payload.logo_url || null,
        description: payload.description,
      })
      .select('id, slug')
      .single(),
    'Agency registered — pending approval'
  );
};
