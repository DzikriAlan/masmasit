export interface PayloadPostOnboardingProfile {
  id: string;
  email: string | undefined;
  full_name: string;
  bio: string;
  location: string;
  current_job_status: string;
  linkedin_url: string;
  whatsapp: string;
  calendly_url: string;
}

export interface PayloadPostOnboardingSkills {
  user_id: string;
  skill_id: string;
  level: string;
}

export interface PayloadPostOnboardingExperiences {
  user_id: string;
  company: string;
  position: string;
  start_date: string;
  end_date: string | null;
  description: string;
}

export interface Onboarding {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
}
