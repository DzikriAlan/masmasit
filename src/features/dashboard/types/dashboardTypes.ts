export interface DataDashboard {
  applications: number;
  projects: number;
  enrollments: number;
  rsvps: number;
}

export interface Dashboard {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataDashboard | null;
}

export interface MonthlyActivity {
  month: string;
  applications: number;
  projects: number;
  enrollments: number;
  rsvps: number;
}

export interface SkillDistribution {
  name: string;
  count: number;
}

export interface ApplicationStatus {
  status: string;
  count: number;
}
