export type ActivityTab =
  | 'applications'
  | 'courses'
  | 'bookings'
  | 'projects'
  | 'events'
  | 'teams'
  | 'requests'
  | 'jobs';

export const ACTIVITY_TABS: ActivityTab[] = [
  'applications',
  'courses',
  'bookings',
  'projects',
  'events',
  'teams',
  'requests',
  'jobs',
];

export interface DataActivityCourse {
  id: string;
  progress: number;
  payment_status: string;
  courses: { id: string; title: string; price: number } | null;
  /** issued_at of the certificate for this course, null when none yet. */
  certificateIssuedAt: string | null;
}

export interface DataActivityProjectPosted {
  id: string;
  title: string;
  status: string;
  created_at: string;
  project_bids: { id: string }[] | null;
}

export interface DataActivityProjectBid {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  projects: { id: string; title: string; status: string } | null;
}

export interface DataActivityProjects {
  posted: DataActivityProjectPosted[];
  bids: DataActivityProjectBid[];
}

export interface DataActivityEvent {
  id: string;
  status: string;
  payment_status: string | null;
  created_at: string;
  events: { id: string; title: string; event_date: string; location: string; is_paid: boolean; price: number | null } | null;
}

export interface DataActivityTeamOwned {
  id: string;
  name: string;
  created_at: string;
}

export interface DataActivityTeamJoined {
  id: string;
  role_title: string;
  teams: { id: string; name: string } | null;
}

export interface DataActivityTeamCollab {
  id: string;
  focus: string;
  status: string;
  created_at: string;
  teams: { id: string; name: string } | null;
}

export interface DataActivityTeams {
  owned: DataActivityTeamOwned[];
  joined: DataActivityTeamJoined[];
  collabs: DataActivityTeamCollab[];
}

export interface DataActivityRequest {
  id: string;
  scope: string;
  budget: number | null;
  status: string;
  dp_amount: number | null;
  dp_payment_status: string;
  dp_payment_link_url: string | null;
  dp_payment_note: string | null;
  final_payment_status: string;
  final_payment_link_url: string | null;
  final_payment_note: string | null;
  created_at: string;
  agency_services: { title: string } | null;
}

export interface DataActivityRequests {
  requests: DataActivityRequest[];
  fallbackUrl: string | null;
}

export interface DataActivityJob {
  id: string;
  title: string;
  status: string;
  created_at: string;
  job_applications: { id: string }[] | null;
}

export interface DataActivityJobs {
  company: { id: string; name: string; approval_status: string } | null;
  jobs: DataActivityJob[];
}

export interface PayloadPostActivityRequestPayment {
  projectId: string;
  stage: 'dp' | 'final';
  note: string | null;
}

export interface Activity {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
}

export const ACTIVITY_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'outline',
  reviewing: 'secondary',
  accepted: 'default',
  confirmed: 'default',
  completed: 'default',
  rejected: 'destructive',
  cancelled: 'destructive',
  open: 'default',
  in_progress: 'secondary',
  matched: 'default',
  closed: 'secondary',
  draft: 'outline',
  registered: 'default',
  checked_in: 'default',
  requested: 'outline',
  in_review: 'secondary',
  approved: 'default',
};
