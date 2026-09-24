export interface PayloadPatchProfile {
  full_name: string;
  bio: string;
  location: string;
  current_job_status: string;
  linkedin_url: string;
  whatsapp: string;
  calendly_url: string;
  avatar_url: string | null;
  hourly_rate: number | null;
  fields?: string[];
  experience_level?: string | null;
  join_goals?: string[];
  onboarding_completed_at?: string;
}

export interface DataProfileExperience {
  id: string;
  company: string;
  position: string;
  start_date: string;
  end_date: string | null;
  description: string | null;
}

/** An experience being edited; `id` is null until it is first saved. */
export interface PayloadProfileExperience {
  id: string | null;
  company: string;
  position: string;
  start_date: string;
  end_date: string;
  description: string;
}

export interface DataProfileSkill {
  skill_id: string;
  skills: { name: string } | null;
}

export interface Profile {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
}
