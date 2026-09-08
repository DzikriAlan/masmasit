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
