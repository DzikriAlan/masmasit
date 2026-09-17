export interface DataTeamCollabs {
  id: string;
  team_id: string;
  created_by: string;
  focus: string;
  description: string;
  status: 'open' | 'matched' | 'closed';
  matched_with: string | null;
  created_at: string;
  teams?: { name: string } | null;
}

export interface PayloadPostTeamCollabs {
  team_id: string;
  created_by: string;
  focus: string;
  description: string;
}

export interface TeamCollabs {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataTeamCollabs[] | null;
}
