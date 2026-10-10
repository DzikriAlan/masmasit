import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';
import type { Skill } from '@/shared/lib/types';

import type { DataDirectory, DataDirectoryDetail, PayloadGetDirectory } from '../types/directoryTypes';

export const getDirectorySkills = async () => {
  return toApiResponse<Skill[]>(
    supabase.from('skills').select('*').order('name'),
    'Skills retrieved successfully'
  );
};

export const DIRECTORY_PAGE_SIZE = 24;

/**
 * The skill filter is applied through an inner join on `user_skills`, so it
 * narrows the whole table rather than just the rows already fetched.
 */
export const getDirectory = async (payload: PayloadGetDirectory) => {
  const skillJoin = payload.skillFilter !== 'all' ? '!inner' : '';
  // Suspended members (migration 030) are hidden from the directory.
  let query = supabase
    .from('profiles')
    .select(`*, user_skills${skillJoin}(level, skill_id, skills(name))`)
    .eq('is_suspended', false);

  if (payload.search) {
    query = query.or(`full_name.ilike.%${payload.search}%,bio.ilike.%${payload.search}%`);
  }
  if (payload.locationFilter !== 'all') {
    query = query.eq('location', payload.locationFilter);
  }
  if (payload.statusFilter !== 'all') {
    query = query.eq('current_job_status', payload.statusFilter);
  }
  if (payload.skillFilter !== 'all') {
    query = query.eq('user_skills.skill_id', payload.skillFilter);
  }

  const from = (payload.page - 1) * DIRECTORY_PAGE_SIZE;

  return toApiResponse<DataDirectory[]>(
    query.order('created_at', { ascending: false }).range(from, from + DIRECTORY_PAGE_SIZE - 1),
    'Members retrieved successfully'
  );
};

// Guests may open a shared profile link; anon can only read these columns
// (028). WhatsApp is added for signed-in members.
const DIRECTORY_PUBLIC_COLUMNS =
  'id, full_name, bio, avatar_url, location, current_job_status, linkedin_url, calendly_url, is_coach, coach_approved, is_talent, talent_approved, created_at';

export const getDirectoryDetail = async (id: string, isSignedIn = false) => {
  const columns = isSignedIn ? `${DIRECTORY_PUBLIC_COLUMNS}, whatsapp` : DIRECTORY_PUBLIC_COLUMNS;
  return toApiResponse<DataDirectoryDetail>(
    supabase
      .from('profiles')
      .select(`${columns}, user_skills(level, skills(name, category)), experiences(*)`)
      .eq('id', id)
      .eq('is_suspended', false)
      .maybeSingle(),
    'Member retrieved successfully'
  );
};
