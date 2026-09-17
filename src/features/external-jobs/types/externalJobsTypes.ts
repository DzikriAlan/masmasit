export type ExternalJobRole = 'backend' | 'frontend' | 'fullstack' | 'mobile' | 'devops' | 'data' | 'software';

export interface DataExternalJobs {
  id: number;
  title: string;
  company_name: string;
  company_domain: string | null;
  url: string;
  location: string;
  job_type: string;
  role_category: ExternalJobRole;
  tags: string[];
  salary: string | null;
  published_at: string;
}

export interface ExternalJobs {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataExternalJobs[] | null;
}
