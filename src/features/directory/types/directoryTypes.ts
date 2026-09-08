import type { UserProfile } from '@/shared/lib/types';

export interface PayloadGetDirectory {
  search: string;
  locationFilter: string;
  statusFilter: string;
  skillFilter: string;
  page: number;
}

export interface DataDirectory extends UserProfile {
  user_skills?: { level: string; skills: { name: string } }[];
  _isDummy?: boolean;
}

export interface DataDirectoryDetail {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  current_job_status: string | null;
  linkedin_url: string | null;
  whatsapp: string | null;
  calendly_url: string | null;
  is_talent: boolean;
  talent_approved: string;
  is_coach: boolean;
  coach_approved: string;
  created_at: string;
  user_skills?: { level: string; skills: { name: string; category: string | null } }[];
  experiences?: { id: string; company: string; position: string; start_date: string; end_date: string | null; description: string | null }[];
}

export interface Directory {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataDirectory[] | null;
}

export interface DirectoryDetail {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataDirectoryDetail | null;
}
