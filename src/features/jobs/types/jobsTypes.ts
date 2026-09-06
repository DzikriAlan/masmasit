export interface JobWithCompany {
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

export interface JobDetail {
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
