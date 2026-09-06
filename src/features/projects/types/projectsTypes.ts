export interface ProjectWithOwner {
  id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  status: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

export interface ProjectDetail {
  id: string;
  user_id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  status: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

export interface BidWithUser {
  id: string;
  amount: number;
  proposal: string;
  eta_days: number | null;
  status: string;
  user_id: string;
  profiles: { full_name: string | null } | null;
}
