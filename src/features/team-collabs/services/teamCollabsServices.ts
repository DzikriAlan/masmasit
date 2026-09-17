import { supabase } from '@/shared/lib/supabase';
import { toApiResponse } from '@/shared/lib/apiResponse';

import type { DataTeamCollabs, PayloadPostTeamCollabs } from '../types/teamCollabsTypes';

// select_team_collabs RLS already returns open listings to everyone and a
// caller's own (any status) — no extra filter needed here.
export const getTeamCollabs = async () => {
  return toApiResponse<DataTeamCollabs[]>(
    supabase.from('team_collabs').select('*, teams(name)').order('created_at', { ascending: false }),
    'Team Collabs retrieved successfully'
  );
};

export const postTeamCollabs = async (payload: PayloadPostTeamCollabs) => {
  return toApiResponse<{ id: string }>(
    supabase.from('team_collabs').insert(payload).select('id').single(),
    'Registered for Team Collabs'
  );
};

// Self-service withdrawal — the one status change a non-admin may still
// make (see the guard_team_collabs_match trigger in migration 015).
export const updateTeamCollabsWithdraw = async (id: string) => {
  return toApiResponse<null>(
    supabase.from('team_collabs').update({ status: 'closed' }).eq('id', id),
    'Listing withdrawn'
  );
};
