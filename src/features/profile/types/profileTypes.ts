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
}

export interface Profile {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
}
