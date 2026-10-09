import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type {
  DataProfileSearch,
  DataTeamBuilder,
  DataTeamBuilderRoster,
  PayloadPatchTeamBuilder,
  PayloadPatchTeamBuilderMembers,
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

// `.select().single()` turns an RLS-filtered no-op (0 rows) into an error
// instead of a silent success.
export const patchTeamBuilder = async (payload: PayloadPatchTeamBuilder) => {
  return toApiResponse<{ id: string }>(
    supabase
      .from('teams')
      .update({ name: payload.name, description: payload.description || null })
      .eq('id', payload.id)
      .select('id')
      .single(),
    'Team updated successfully'
  );
};

// team_members / team_collabs rows cascade with the team (migration 015).
export const deleteTeamBuilder = async (id: string) => {
  return toApiResponse<{ id: string }>(
    supabase.from('teams').delete().eq('id', id).select('id').single(),
    'Team deleted successfully'
  );
};

// Owner adds -> the row is always 'invited' (guard_team_member_insert,
// migration 032), which also notifies the invitee.
export const postTeamBuilderMembers = async (payload: PayloadPostTeamBuilderMembers) => {
  return toApiResponse<{ id: string }>(
    supabase.from('team_members').insert(payload).select('id').single(),
    'Member added successfully'
  );
};

export const patchTeamBuilderMembers = async (payload: PayloadPatchTeamBuilderMembers) => {
  return toApiResponse<{ id: string }>(
    supabase
      .from('team_members')
      .update({ role_title: payload.role_title })
      .eq('id', payload.member_id)
      .select('id')
      .single(),
    'Role updated successfully'
  );
};

// The invitee accepting their own invitation (invited -> active).
export const patchTeamBuilderMembersAccept = async (memberId: string) => {
  return toApiResponse<{ id: string }>(
    supabase.from('team_members').update({ status: 'active' }).eq('id', memberId).select('id').single(),
    'Invitation accepted'
  );
};

// Owner removing a member, an invitee declining, or a member leaving -
// the same row delete, allowed by delete_team_members_owner /
// delete_own_team_membership respectively.
export const deleteTeamBuilderMembers = async (memberId: string) => {
  return toApiResponse<{ id: string }>(
    supabase.from('team_members').delete().eq('id', memberId).select('id').single(),
    'Member removed successfully'
  );
};
