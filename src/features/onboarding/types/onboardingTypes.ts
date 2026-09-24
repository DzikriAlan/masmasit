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

// Onboarding popup (migration 025). Values are what the DB check constraints
// accept; labels are shown in both the popup and the admin Onboarding tab.
export interface OnboardingOption {
  value: string;
  en: string;
  id: string;
}

export const ONBOARDING_FIELDS: OnboardingOption[] = [
  { value: 'frontend', en: 'Frontend', id: 'Frontend' },
  { value: 'backend', en: 'Backend', id: 'Backend' },
  { value: 'mobile', en: 'Mobile', id: 'Mobile' },
  { value: 'uiux', en: 'UI/UX', id: 'UI/UX' },
  { value: 'data', en: 'Data', id: 'Data' },
  { value: 'devops', en: 'DevOps', id: 'DevOps' },
  { value: 'qa', en: 'QA', id: 'QA' },
  { value: 'pm', en: 'Product / PM', id: 'Product / PM' },
];

export const ONBOARDING_LEVELS: OnboardingOption[] = [
  { value: 'student', en: 'Student', id: 'Pelajar' },
  { value: 'junior', en: 'Junior', id: 'Junior' },
  { value: 'mid', en: 'Mid', id: 'Mid' },
  { value: 'senior', en: 'Senior', id: 'Senior' },
  { value: 'lead', en: 'Lead', id: 'Lead' },
];

// Same stored values as the profile form's job status select, so Directory
// filters keep working.
export const ONBOARDING_JOB_STATUSES: OnboardingOption[] = [
  { value: 'Employed', en: 'Employed', id: 'Bekerja' },
  { value: 'Looking for work', en: 'Looking for work', id: 'Cari kerja' },
  { value: 'Freelancing', en: 'Freelancing', id: 'Freelance' },
  { value: 'Student', en: 'Studying', id: 'Kuliah' },
];

export const ONBOARDING_GOALS: OnboardingOption[] = [
  { value: 'find_job', en: 'Find a job', id: 'Cari kerja' },
  { value: 'find_team', en: 'Find a team', id: 'Cari tim' },
  { value: 'learn', en: 'Learn', id: 'Belajar' },
  { value: 'networking', en: 'Networking', id: 'Networking' },
  { value: 'hire', en: 'Find talent / clients', id: 'Cari talent / klien' },
];

export const ONBOARDING_REFERRALS: OnboardingOption[] = [
  { value: 'instagram', en: 'Instagram', id: 'Instagram' },
  { value: 'tiktok', en: 'TikTok', id: 'TikTok' },
  { value: 'linkedin', en: 'LinkedIn', id: 'LinkedIn' },
  { value: 'x', en: 'X / Twitter', id: 'X / Twitter' },
  { value: 'youtube', en: 'YouTube', id: 'YouTube' },
  { value: 'google', en: 'Google search', id: 'Pencarian Google' },
  { value: 'friend', en: 'Friend / colleague', id: 'Teman / rekan' },
  { value: 'community', en: 'Community / event', id: 'Komunitas / event' },
  { value: 'other', en: 'Other', id: 'Lainnya' },
];

export interface PayloadPatchOnboardingAnswers {
  id: string;
  fields: string[];
  experience_level: string;
  location: string;
  current_job_status: string;
  join_goals: string[];
  referral_source: string;
  referral_note: string | null;
  /** Optional; omitted when left blank so an existing number is kept. */
  whatsapp?: string;
}

export interface PayloadPatchOnboardingSnooze {
  id: string;
  until: string;
}
