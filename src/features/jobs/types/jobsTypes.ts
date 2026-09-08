export interface PayloadGetJobs {
  search: string;
  typeFilter: string;
  locationFilter: string;
}

export interface PayloadPostJobsApplication {
  job_id: string;
  user_id: string;
  cover_letter: string | null;
}

export interface PayloadPostJobsCompany {
  user_id: string;
  name: string;
  description: string;
  website: string;
  location: string;
  industry: string;
}

export interface PayloadPostJobsUserRole {
  user_id: string;
  role: string;
}

export interface PayloadPostJobsPosting {
  company_id: string;
  title: string;
  description: string;
  location: string | null;
  job_type: string;
  salary_min: number | null;
  salary_max: number | null;
  deadline: string | null;
}

export interface DataJobs {
  id: string;
  title: string;
  description: string;
  location: string | null;
  job_type: string;
  salary_min: number | null;
  salary_max: number | null;
  deadline: string | null;
  created_at: string;
  companies: { name: string; logo_url: string | null; id: string } | null;
}

export interface DataJobsDetail {
  id: string;
  title: string;
  description: string;
  location: string | null;
  job_type: string;
  salary_min: number | null;
  salary_max: number | null;
  deadline: string | null;
  created_at: string;
  company_id: string;
  companies: { name: string; logo_url: string | null; description: string | null; website: string | null; location: string | null } | null;
}

export interface Jobs {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataJobs[] | null;
}

export interface JobsDetail {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataJobsDetail | null;
}

export interface DataJobsCompany {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  website: string | null;
  location: string | null;
  industry: string | null;
  logo_url: string | null;
  approval_status: string;
}

export interface DataJobsApplicant {
  id: string;
  status: string;
  cover_letter: string | null;
  created_at: string;
  job_id: string;
  user_id: string;
  profiles: { full_name: string | null; avatar_url: string | null; location: string | null } | null;
}

export interface DataJobsMyApplication {
  id: string;
  status: string;
  created_at: string;
  jobs: {
    id: string;
    title: string;
    job_type: string;
    location: string | null;
    companies: { name: string } | null;
  } | null;
}

export interface DataJobsOwned {
  id: string;
  title: string;
  status: string;
  created_at: string;
  job_applications: { id: string }[];
}
