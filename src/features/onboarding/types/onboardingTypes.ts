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

// REST.md Bagian 8: "pilih peran (multi-select, bisa lebih dari satu)".
// 'member' is assigned automatically at signup and is not offered here.
export type OnboardingRole = 'talent' | 'coach' | 'company' | 'agency_owner';

export interface PayloadPostOnboardingRoles {
  user_id: string;
  roles: OnboardingRole[];
}

// Sub-step shown only when "Agency Owner" is picked.
export interface PayloadPostOnboardingAgency {
  owner_id: string;
  name: string;
  logo_url: string;
  description: string;
}

export interface Onboarding {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
}
