export interface DataAdminStats {
  members: number;
  jobs: number;
  projects: number;
  courses: number;
  bookings: number;
  agencyProjects: number;
}

export interface DataAdminCompanies {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  location: string | null;
  industry: string | null;
  approval_status: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

export interface DataAdminCoaches {
  id: string;
  full_name: string | null;
  bio: string | null;
  is_coach: boolean;
  coach_approved: string;
  is_talent: boolean;
  talent_approved: string;
}

export interface DataAdminSettings {
  id: string;
  talent_admin_fee_percentage: string;
  agency_admin_fee_percentage: string;
  agency_revenue_share_percentage: string;
  job_fee_active: boolean;
  project_fee_active: boolean;
  lms_fee_active: boolean;
  event_fee_active: boolean;
  lynkid_bookings_url: string | null;
  lynkid_agency_url: string | null;
  lynkid_courses_url: string | null;
  lynkid_events_url: string | null;
}

export interface DataAdminModeration {
  type: string;
  id: string;
  title: string;
  meta: string;
}

export interface DataAdminPayments {
  table: string;
  id: string;
  subField?: string;
  category: string;
  item: string;
  amount: number;
  status: string;
  note: string | null;
  user: string;
  created_at: string;
}

/** Mirrors the optional-field shape AnalyticsCharts consumes. */
export interface DataAdminAnalytics {
  profiles?: { created_at: string }[];
  roleData?: { role: string }[];
  jobsData?: { created_at: string }[];
  appsData?: { created_at: string }[];
  bookingsData?: { amount: number; created_at: string; payment_status: string }[];
  agencyData?: {
    budget: number;
    dp_amount: number | null;
    dp_payment_status: string;
    final_payment_status: string;
    created_at: string;
  }[];
}

export interface PayloadPatchAdminSettings {
  talent_admin_fee_percentage: number;
  agency_admin_fee_percentage: number;
  agency_revenue_share_percentage: number;
  job_fee_active: boolean;
  project_fee_active: boolean;
  lms_fee_active: boolean;
  event_fee_active: boolean;
  lynkid_bookings_url: string | null;
  lynkid_agency_url: string | null;
  lynkid_courses_url: string | null;
  lynkid_events_url: string | null;
}

export interface Admin {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataAdminStats | null;
}

export interface DataAdminUserRole {
  role: string;
  region_id: string | null;
}

export interface DataAdminUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  location: string | null;
  user_roles: DataAdminUserRole[] | null;
}

export interface DataAdminPendingEvent {
  id: string;
  title: string;
  event_type: string;
  location: string;
  event_date: string;
  approval_status: string;
  regions: { name: string } | null;
}

export interface DataAdminApprovals {
  companies: DataAdminCompanies[];
  people: DataAdminCoaches[];
  events: DataAdminPendingEvent[];
}

export interface DataAdminAgencyService {
  id: string;
  category: string;
  title: string;
  description: string;
  base_price: number | null;
  is_active: boolean;
}

export interface DataAdminCaseStudy {
  id: string;
  title: string;
  client_name: string;
  challenge: string;
  solution: string;
  result: string;
  image_url: string | null;
  category: string | null;
  created_at: string;
}

export interface DataAdminAuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

export interface PayloadPostAdminRole {
  userId: string;
  role: string;
  regionId: string | null;
}
