import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type { Skill } from '@/shared/lib/types';

import type { DataProfileExperience, DataProfileSkill, PayloadPatchProfile } from '../types/profileTypes';

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

export const getProfileSkillOptions = async () => {
  return toApiResponse<Skill[]>(supabase.from('skills').select('*').order('name'), 'Skills retrieved successfully');
};

export const getProfileSkills = async (userId: string) => {
  return toApiResponse<DataProfileSkill[]>(
    supabase.from('user_skills').select('skill_id, skills(name)').eq('user_id', userId).returns<DataProfileSkill[]>(),
    'Profile skills retrieved successfully'
  );
};

// Creates catalogue rows for typed names that do not exist yet (migration 025).
export const postProfileSkillNames = async (names: string[]) => {
  return toApiResponse<Skill[]>(supabase.rpc('ensure_skills', { names }), 'Skills resolved successfully');
};

// Upsert keeps the level already set for skills the member still has.
export const postProfileSkills = async (userId: string, skillIds: string[]) => {
  return toApiResponse<null>(
    supabase
      .from('user_skills')
      .upsert(
        skillIds.map((skill_id) => ({ user_id: userId, skill_id })),
        { onConflict: 'user_id,skill_id', ignoreDuplicates: true }
      ),
    'Profile skills saved successfully'
  );
};

export const deleteProfileSkills = async (userId: string, keepIds: string[]) => {
  let query = supabase.from('user_skills').delete().eq('user_id', userId);
  if (keepIds.length > 0) query = query.not('skill_id', 'in', `(${keepIds.join(',')})`);
  return toApiResponse<null>(query, 'Profile skills removed successfully');
};

export const getProfileExperiences = async (userId: string) => {
  return toApiResponse<DataProfileExperience[]>(
    supabase
      .from('experiences')
      .select('id, company, position, start_date, end_date, description')
      .eq('user_id', userId)
      .order('start_date', { ascending: false }),
    'Experiences retrieved successfully'
  );
};

type ExperienceRow = Omit<DataProfileExperience, 'id'>;

export const postProfileExperiences = async (userId: string, rows: ExperienceRow[]) => {
  return toApiResponse<null>(
    supabase.from('experiences').insert(rows.map((r) => ({ ...r, user_id: userId }))),
    'Experiences added successfully'
  );
};

export const updateProfileExperiences = async (userId: string, rows: DataProfileExperience[]) => {
  return toApiResponse<null>(
    supabase.from('experiences').upsert(rows.map((r) => ({ ...r, user_id: userId }))),
    'Experiences updated successfully'
  );
};

export const deleteProfileExperiences = async (userId: string, keepIds: string[]) => {
  let query = supabase.from('experiences').delete().eq('user_id', userId);
  if (keepIds.length > 0) query = query.not('id', 'in', `(${keepIds.join(',')})`);
  return toApiResponse<null>(query, 'Experiences removed successfully');
};
