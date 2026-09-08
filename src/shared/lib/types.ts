export type Role = 'member' | 'company' | 'client' | 'coach' | 'talent' | 'regional_admin' | 'super_admin';

export type JobType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
export type JobStatus = 'draft' | 'open' | 'closed';
export type ApplicationStatus = 'pending' | 'reviewing' | 'accepted' | 'rejected';

export type ProjectStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type BidStatus = 'pending' | 'accepted' | 'rejected';

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type EnrollmentStatus = 'active' | 'completed' | 'dropped';

export type EventType = 'meetup' | 'workshop' | 'conference' | 'hackathon' | 'webinar';
export type RSVPStatus = 'registered' | 'checked_in' | 'cancelled';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type BookingType = 'consultation' | 'mentoring';

export type AgencyProjectStatus = 'requested' | 'in_review' | 'approved' | 'in_progress' | 'completed' | 'cancelled';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  current_job_status: string | null;
  linkedin_url: string | null;
  whatsapp: string | null;
  calendly_url: string | null;
  is_coach: boolean;
  is_talent: boolean;
  coach_approved: ApprovalStatus;
  talent_approved: ApprovalStatus;
  /** Default session amount a talent charges, in rupiah. */
  hourly_rate: number | null;
  created_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string | null;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  level: SkillLevel;
}

export interface Experience {
  id: string;
  user_id: string;
  company: string;
  position: string;
  start_date: string;
  end_date: string | null;
  description: string | null;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  location: string | null;
  industry: string | null;
  approval_status: ApprovalStatus;
  created_at: string;
}

export interface Job {
  id: string;
  company_id: string;
  title: string;
  description: string;
  location: string | null;
  job_type: JobType;
  salary_min: number | null;
  salary_max: number | null;
  deadline: string | null;
  status: JobStatus;
  created_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  user_id: string;
  status: ApplicationStatus;
  cover_letter: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  status: ProjectStatus;
  created_at: string;
}

export interface ProjectBid {
  id: string;
  project_id: string;
  user_id: string;
  amount: number;
  proposal: string;
  eta_days: number | null;
  status: BidStatus;
  created_at: string;
}

export interface ProjectReview {
  id: string;
  project_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  coach_id: string;
  title: string;
  description: string;
  level: CourseLevel;
  category: string | null;
  price: number;
  created_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_free: boolean;
  created_at: string;
}

export interface Quiz {
  id: string;
  module_id: string;
  title: string;
  passing_grade: number;
}

export interface Enrollment {
  id: string;
  course_id: string;
  user_id: string;
  status: EnrollmentStatus;
  progress: number;
  enrolled_at: string;
}

export interface Certificate {
  id: string;
  course_id: string;
  user_id: string;
  issued_at: string;
}

export interface Region {
  id: string;
  name: string;
  description: string | null;
  admin_user_id: string | null;
}

export interface Event {
  id: string;
  region_id: string;
  title: string;
  description: string;
  event_type: EventType;
  location: string;
  event_date: string;
  max_capacity: number;
  is_paid: boolean;
  price: number | null;
  created_at: string;
}

export interface EventRSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: RSVPStatus;
  created_at: string;
}

export interface Booking {
  id: string;
  talent_id: string;
  client_id: string;
  booking_type: BookingType;
  scheduled_at: string;
  notes: string | null;
  status: BookingStatus;
  amount: number;
  admin_fee_percentage: number;
  created_at: string;
}

export interface AgencyService {
  id: string;
  category: 'SaaS' | 'AI Solutions' | 'Creative Services' | 'HR Solutions';
  title: string;
  description: string;
  base_price: number | null;
  is_active: boolean;
}

export interface AgencyProject {
  id: string;
  client_name: string;
  client_email: string;
  client_company: string | null;
  service_id: string;
  scope: string;
  budget: number | null;
  status: AgencyProjectStatus;
  dp_amount: number | null;
  admin_fee_percentage: number;
  revenue_share_percentage: number;
  created_at: string;
}

export interface CaseStudy {
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

export interface AppSettings {
  id: string;
  talent_admin_fee_percentage: number;
  agency_admin_fee_percentage: number;
  agency_revenue_share_percentage: number;
  job_fee_active: boolean;
  project_fee_active: boolean;
  lms_fee_active: boolean;
  event_fee_active: boolean;
}
