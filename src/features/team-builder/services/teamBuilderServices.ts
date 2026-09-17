import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type {
  DataProfileSearch,
  DataTeamBuilder,
  DataTeamBuilderRoster,
  PayloadPostTeamBuilder,
  PayloadPostTeamBuilderMembers,
} from '../types/teamBuilderTypes';

// RLS (select_teams) already scopes this to teams the caller owns or is a
// member of — no extra filter needed here.
export const getTeamBuilder = async () => {
  return toApiResponse<DataTeamBuilder[]>(
    supabase.from('teams').select('*').order('created_at', { ascending: false }),
    'Teams retrieved successfully'
  );
};

export const getTeamBuilderDetail = async (id: string) => {
  return toApiResponse<DataTeamBuilder>(
    supabase.from('teams').select('*').eq('id', id).single(),
    'Team retrieved successfully'
  );
};

// get_team_roster() is SECURITY DEFINER (migration 015): it computes each
// member's grade from their own profile data live, rather than trusting a
// stored column that could go stale.
export const getTeamBuilderRoster = async (teamId: string) => {
  return toApiResponse<DataTeamBuilderRoster[]>(
    supabase.rpc('get_team_roster', { p_team_id: teamId }),
    'Roster retrieved successfully'
  );
};

export const getTeamBuilderMembersSearch = async (query: string) => {
  return toApiResponse<DataProfileSearch[]>(
    supabase.from('profiles').select('id, full_name, avatar_url').ilike('full_name', `%${query}%`).limit(8),
    'Members retrieved successfully'
  );
};

export const postTeamBuilder = async (payload: PayloadPostTeamBuilder) => {
  return toApiResponse<{ id: string }>(
    supabase.from('teams').insert(payload).select('id').single(),
    'Team created successfully'
  );
};

export const postTeamBuilderMembers = async (payload: PayloadPostTeamBuilderMembers) => {
  return toApiResponse<{ id: string }>(
    supabase.from('team_members').insert(payload).select('id').single(),
    'Member added successfully'
  );
};

export const deleteTeamBuilderMembers = async (memberId: string) => {
  return toApiResponse<null>(
    supabase.from('team_members').delete().eq('id', memberId),
    'Member removed successfully'
  );
};
