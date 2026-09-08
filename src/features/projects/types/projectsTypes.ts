export interface PayloadGetProjects {
  search: string;
  statusFilter: string;
}

export interface PayloadPostProjects {
  user_id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
}

export interface PayloadPostProjectsBid {
  project_id: string;
  user_id: string;
  amount: number;
  proposal: string;
  eta_days: number | null;
}

export interface DataProjects {
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

export interface DataProjectsDetail {
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

export interface DataProjectsBids {
  id: string;
  amount: number;
  proposal: string;
  eta_days: number | null;
  status: string;
  user_id: string;
  profiles: { full_name: string | null } | null;
}

export interface Projects {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataProjects[] | null;
}

export interface ProjectsDetail {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataProjectsDetail | null;
}
