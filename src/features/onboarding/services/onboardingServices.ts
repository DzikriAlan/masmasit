import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';
import { slugify } from '@/shared/lib/utils';
import type { Skill } from '@/shared/lib/types';

import type {
  DataOnboardingExperience,
  DataOnboardingUserSkill,
  PayloadPatchOnboardingAnswers,
  PayloadPatchOnboardingSnooze,
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

// Saved skills / experiences, so revisiting /onboarding edits what is there
// instead of starting blank (TC-01-16).
export const getOnboardingUserSkills = async (userId: string) => {
  return toApiResponse<DataOnboardingUserSkill[]>(
    supabase.from('user_skills').select('skill_id, level').eq('user_id', userId),
    'Skills retrieved successfully'
  );
};

export const getOnboardingExperiences = async (userId: string) => {
  return toApiResponse<DataOnboardingExperience[]>(
    supabase
      .from('experiences')
      .select('id, company, position, start_date, end_date, description')
      .eq('user_id', userId)
      .order('start_date', { ascending: false }),
    'Experiences retrieved successfully'
  );
};

/** Removes only the skills no longer listed (keepIds = the ones kept). */
export const deleteOnboardingSkills = async (userId: string, keepIds: string[]) => {
  let query = supabase.from('user_skills').delete().eq('user_id', userId);
  if (keepIds.length > 0) query = query.not('skill_id', 'in', `(${keepIds.join(',')})`);
  return toApiResponse<null>(query, 'Skills removed successfully');
};

/** Upsert on (user_id, skill_id): new skills are added, levels updated. */
export const postOnboardingSkills = async (payload: PayloadPostOnboardingSkills[]) => {
  return toApiResponse<null>(
    supabase.from('user_skills').upsert(payload, { onConflict: 'user_id,skill_id' }),
    'Skills saved successfully'
  );
};

/** Removes only the experiences no longer listed (keepIds = saved ids kept). */
export const deleteOnboardingExperiences = async (userId: string, keepIds: string[]) => {
  let query = supabase.from('experiences').delete().eq('user_id', userId);
  if (keepIds.length > 0) query = query.not('id', 'in', `(${keepIds.join(',')})`);
  return toApiResponse<null>(query, 'Experiences removed successfully');
};

export const postOnboardingExperiences = async (payload: PayloadPostOnboardingExperiences[]) => {
  return toApiResponse<null>(
    supabase.from('experiences').insert(payload),
    'Experiences saved successfully'
  );
};

export const updateOnboardingExperiences = async (payload: (PayloadPostOnboardingExperiences & { id: string })[]) => {
  return toApiResponse<null>(supabase.from('experiences').upsert(payload), 'Experiences updated successfully');
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

// An update RLS filters out matches zero rows without an error. Returning the
// id turns that into a visible failure instead of a popup that keeps coming back.
const requireUpdatedRow = async (query: PromiseLike<{ data: { id: string }[] | null; error: { code?: string; message?: string } | null }>) => {
  const { data, error } = await query;
  if (!error && (data ?? []).length === 0) {
    return { data: null, error: { code: 'PGRST116', message: 'Profile not found or not editable' } };
  }
  return { data: null, error };
};

// Onboarding popup: saves the answers and marks onboarding done in one write.
export const patchOnboardingAnswers = async ({ id, ...answers }: PayloadPatchOnboardingAnswers) => {
  return toApiResponse<null>(
    requireUpdatedRow(
      supabase
        .from('profiles')
        .update({ ...answers, onboarding_completed_at: new Date().toISOString() })
        .eq('id', id)
        .select('id')
    ),
    'Onboarding saved successfully'
  );
};

// Full /onboarding form finished: the popup must not come back (TC-01-14).
export const patchOnboardingCompleted = async (id: string) => {
  return toApiResponse<null>(
    requireUpdatedRow(
      supabase
        .from('profiles')
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq('id', id)
        .select('id')
    ),
    'Onboarding completed'
  );
};

export const patchOnboardingSnooze = async ({ id, until }: PayloadPatchOnboardingSnooze) => {
  return toApiResponse<null>(
    requireUpdatedRow(supabase.from('profiles').update({ onboarding_snoozed_until: until }).eq('id', id).select('id')),
    'Onboarding snoozed'
  );
};

// Resolves typed skill names to catalogue rows, creating the missing ones
// (migration 025). Plain members cannot insert into skills directly.
export const postOnboardingSkillNames = async (names: string[]) => {
  return toApiResponse<Skill[]>(supabase.rpc('ensure_skills', { names }), 'Skills resolved successfully');
};

// The popup only adds skills. Unlike the full onboarding page it must not
// wipe skills the member already set, so this upserts and skips duplicates.
export const postOnboardingSkillsMerge = async (payload: PayloadPostOnboardingSkills[]) => {
  return toApiResponse<null>(
    supabase.from('user_skills').upsert(payload, { onConflict: 'user_id,skill_id', ignoreDuplicates: true }),
    'Skills saved successfully'
  );
};
