export interface DataJobsType {
  slug: string;
  label_en: string;
  label_id: string;
  sort_order: number;
}

export interface DataJobsLocation {
  id: string;
  name: string;
  sort_order: number;
}

export interface DataJobsSkill {
  id: string;
  name: string;
  category: string | null;
}

export interface DataJobsEditable {
  id: string;
  title: string;
  description: string;
  location: string | null;
  job_type: string;
  salary_min: number | null;
  salary_max: number | null;
  deadline: string | null;
  skills: string[] | null;
}

export interface PayloadUpdateJobs {
  title: string;
  description: string;
  location: string | null;
  job_type: string;
  salary_min: number | null;
  salary_max: number | null;
  deadline: string | null;
  skills: string[];
}

export interface DataJobsMatchSkill {
  level: string;
  skills: { name: string } | null;
}

