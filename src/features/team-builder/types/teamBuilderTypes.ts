export interface DataTeamBuilder {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

// Shape returned by the get_team_roster() RPC — role + a live-computed
// grade in one round trip (see migration 015).
export interface DataTeamBuilderRoster {
  member_id: string;
  user_id: string;
  role_title: string;
  grade: 'junior' | 'mid' | 'senior';
  full_name: string | null;
  avatar_url: string | null;
}

export interface DataProfileSearch {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface PayloadPostTeamBuilder {
  owner_id: string;
  name: string;
  description: string;
}

export interface PayloadPostTeamBuilderMembers {
  team_id: string;
  user_id: string;
  role_title: string;
}

export interface TeamBuilder {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataTeamBuilder[] | null;
}

export interface TeamBuilderDetail {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataTeamBuilder | null;
}
